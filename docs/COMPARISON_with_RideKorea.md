# RideKorea vs RideKorea_b Source Comparison

작성일: 2026-07-01

이 문서는 `E:\dev\RideKorea`와 `E:\dev\RideKorea_b`를 소스 중심으로 비교한 기록이다. 목적은 다른 구현에서 배울 점을 우리 앱에 흡수하되, 현재 RideKorea가 가진 FastAPI/PostGIS 기반 구조와 테스트 가능성을 유지하는 것이다.

## 1. 비교 대상 요약

### RideKorea

- 구조: FastAPI backend + Expo frontend + PostgreSQL/PostGIS
- 강점: 도메인별 서비스 레이어, 명시적인 API, 테스트 기반, POI/관리/데이터 파이프라인 확장성
- 최근 상태: 사사키 시나리오 기준 약 97% 수준
- 주요 구현 영역:
  - Google 중심 로그인 UX
  - Journey / Moments / My Path / Compass 화면
  - 공식 코스, 공유 루트, 공유 루트 가져오기
  - 주행 track point 저장 API
  - My Path 서버 집계 API
  - Travel POI, 신고, 피드백, 관리자 검색, importer
  - `ko/en/ja` i18n dictionary

### RideKorea_b

- 구조: Expo app + Supabase + PostGIS + RPC/RLS
- 강점: 모바일 라이딩 세션, SQLite outbox, 경로 이탈 구간, Naver Map WebView 업데이트, 바우처 지갑 흐름
- 확인 결과:
  - `npm run typecheck` 통과
  - 자동화 테스트는 거의 확인되지 않음
  - `.env`는 비밀값 가능성이 있어 열람하지 않음

## 2. RideKorea_b에서 배울 점

### 2.1 실제 라이딩 세션 구조

참고 파일:

- `E:\dev\RideKorea_b\src\stores\ride.ts`
- `E:\dev\RideKorea_b\src\features\ride\track.ts`
- `E:\dev\RideKorea_b\src\features\ride\outbox.ts`
- `E:\dev\RideKorea_b\src\features\ride\api.ts`
- `E:\dev\RideKorea_b\app\(tabs)\ride.tsx`

배울 점:

- `expo-location.watchPositionAsync`를 Ride store가 중앙에서 관리한다.
- GPS fix를 받은 즉시 SQLite에 저장한다.
- 앱이 종료되거나 재시작돼도 `recover()`로 진행 중인 라이딩을 복구한다.
- `pause`, `resume`, `stop`, `discard`가 명확히 분리되어 있다.
- 서버 finalize가 성공한 뒤에만 local outbox를 비운다.

우리 앱 적용 방향:

- 현재 SecureStore 기반 offline queue를 SQLite outbox로 고도화한다.
- 라이딩 중 사진 핀, track point, ride metadata를 같은 로컬 저장소에서 관리한다.
- 앱 재시작 시 "진행 중인 라이딩을 이어서 할까요?" UX를 추가한다.

### 2.2 경로 이탈 감지와 pink segment 표현

참고 파일:

- `E:\dev\RideKorea_b\src\features\ride\deviation.ts`
- `E:\dev\RideKorea_b\src\features\ride\track.ts`

배울 점:

- 루트 이탈 진입 threshold와 복귀 threshold를 다르게 둔다.
- 이 방식은 GPS 흔들림 때문에 이탈 상태가 빠르게 깜빡이는 문제를 줄인다.
- 정상 구간과 이탈 구간을 별도 geometry로 만들 수 있다.

우리 앱 적용 방향:

- `useRiderLocation` 내부 계산을 순수 유틸로 분리한다.
- `is_off_route` point flag뿐 아니라 이탈 segment geometry를 따로 만든다.
- 지도에서 정상 track은 파란색, 이탈 segment는 분홍색으로 표시한다.

### 2.3 Naver Map WebView 업데이트 방식

참고 파일:

- `E:\dev\RideKorea_b\src\lib\naverMap.ts`

배울 점:

- WebView HTML 안에서 Naver Map을 한 번만 로드한다.
- 이후 GPS 업데이트는 `window.__rideUpdate(...)`로 track, deviated, position만 갱신한다.
- 매 GPS fix마다 map HTML을 다시 만들지 않아 비용과 성능 면에서 유리하다.

우리 앱 적용 방향:

- 현재 map adapter를 `buildRideMapHtml`, `buildRouteMapHtml` 같은 역할로 정리한다.
- Naver Map Client ID가 들어오면 provider만 교체할 수 있게 만든다.
- 지도 업데이트 메시지 protocol을 문서화한다.

### 2.4 바우처 지오펜스와 Wallet 흐름

참고 파일:

- `E:\dev\RideKorea_b\src\features\geofence\geofence.ts`
- `E:\dev\RideKorea_b\app\(tabs)\wallet.tsx`
- `E:\dev\RideKorea_b\src\features\wallet\api.ts`
- `E:\dev\RideKorea_b\supabase\migrations\20260630120000_rpc_functions.sql`

배울 점:

- 클라이언트에서 지역 진입을 감지한다.
- 서버에서 PostGIS로 다시 검증한다.
- 발급된 바우처를 Wallet에서 확인하고 redeem한다.

우리 앱 적용 방향:

- 클라이언트 geofence detector를 순수 유틸로 추가한다.
- 서버에서는 반드시 PostGIS로 재검증한다.
- MVP에서는 redeem code 또는 staff confirmation 수준으로 시작한다.

### 2.5 React Query 기반 서버 상태 관리

참고 파일:

- `E:\dev\RideKorea_b\src\features\route\api.ts`
- `E:\dev\RideKorea_b\src\features\route\social.ts`
- `E:\dev\RideKorea_b\src\features\wallet\api.ts`

배울 점:

- route detail, import, like, comment, wallet claim 같은 서버 상태를 hook 단위로 분리했다.
- mutation 이후 invalidate 흐름이 명확하다.

우리 앱 적용 방향:

- 지금 당장 전체 교체는 필요 없다.
- 다만 `Moments`, `My Path`, `Journey Detail`, `Voucher Wallet`처럼 서버 상태가 많은 화면부터 React Query 도입을 검토한다.

## 3. 우리가 더 나은 점

### 3.1 백엔드 도메인 구조

우리 앱은 FastAPI router, schema, service, model이 분리되어 있다. 이 구조는 기능이 커질수록 유리하다.

대표 파일:

- `E:\dev\RideKorea\backend\app\routers\journeys.py`
- `E:\dev\RideKorea\backend\app\services\journey_service.py`
- `E:\dev\RideKorea\backend\app\services\shared_route_service.py`
- `E:\dev\RideKorea\backend\app\services\travel_poi_service.py`

RideKorea_b는 Supabase RPC와 SQL에 비즈니스 로직이 많이 들어가 있다. 빠른 MVP에는 좋지만, 복잡한 운영 정책과 테스트가 늘어나면 유지보수 난도가 올라갈 수 있다.

### 3.2 테스트 가능성

우리 앱은 backend unittest와 frontend utility test를 이미 갖고 있다. 특히 `journey_service`, offline queue core, i18n dictionary 같은 부분은 회귀 테스트를 만들기 쉽다.

RideKorea_b는 typecheck는 통과하지만, 소스 기준으로 자동화 테스트는 거의 확인되지 않았다.

### 3.3 POI, 데이터 수집, 운영 도메인

우리 앱은 Travel POI, 신고, 피드백, 관리자 검색, importer, license sidecar 구조가 더 발전되어 있다.

대표 파일:

- `E:\dev\RideKorea\backend\app\services\travel_poi_service.py`
- `E:\dev\RideKorea\backend\app\routers\travel_pois.py`
- `E:\dev\RideKorea\docs\ridekorea_travel_poi_data_pipeline.md`
- `E:\dev\RideKorea\docs\ridekorea_poi_data_sources_and_licenses.md`

한국 자전거 여행 서비스에서는 실제 데이터 출처, 라이선스, 갱신 흐름이 중요하므로 이 방향은 유지하는 것이 좋다.

### 3.4 도메인 분리

RideKorea_b는 "everything is a route" 구조로 공식 루트, 유저 루트, 가져온 루트, 완주 기록을 하나의 routes 테이블에서 다룬다.

장점:

- MVP 구현 속도가 빠르다.
- route detail UI를 재사용하기 쉽다.

단점:

- 공식 코스, 개인 여정, 공유 루트, 완주 기록, POI, 인증센터가 커지면 의미가 무거워질 수 있다.

우리 앱은 Course, Journey, SharedRoute, SpotDiary, TravelPoi, Voucher가 비교적 분리되어 있어 장기 확장에 더 적합하다.

## 4. 그대로 가져오면 안 되는 점

### 4.1 Supabase-only 전환

Supabase RPC/RLS 구조는 참고할 가치가 있지만, 현재 RideKorea를 Supabase-only로 전환할 필요는 없다. 우리 앱은 FastAPI/PostGIS 조합이 데이터 수집, 관리자 기능, 외부 연동, 테스트에 더 적합하다.

### 4.2 모든 것을 routes로 합치는 구조

단일 route lifecycle 아이디어는 좋지만, 우리 앱의 도메인을 하나로 합치면 오히려 장기 유지보수성이 떨어질 수 있다. 대신 route lifecycle 개념만 Journey/SharedRoute에 반영한다.

### 4.3 테스트 없는 빠른 구현 방식

RideKorea_b의 모바일 세션 구조는 좋지만, 이식할 때는 반드시 순수 유틸 테스트와 API 테스트를 같이 추가한다.

### 4.4 silent catch

RideKorea_b에는 best-effort 목적의 빈 `catch {}`가 일부 보인다. 우리 앱에 적용할 때는 사용자에게 방해되지 않는 선에서 로그, 상태, 재시도 정보를 남긴다.

## 5. 결론

RideKorea_b는 "라이딩 현장성"이 강하다. 특히 SQLite outbox, crash recovery, deviation segment, Naver Map incremental update, voucher wallet은 우리 앱에 바로 배울 가치가 있다.

RideKorea는 "서비스 확장성"이 강하다. FastAPI 서비스 레이어, 테스트, POI 데이터 파이프라인, 도메인 분리는 유지해야 한다.

따라서 최선의 방향은 RideKorea_b의 모바일 라이딩 엔진을 우리 앱의 FastAPI/PostGIS 기반 서비스 구조에 흡수하는 것이다.

다음 문서:

- `docs/RIDEKOREA_B_ADOPTION_PLAN.md`

