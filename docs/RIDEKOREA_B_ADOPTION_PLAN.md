# RideKorea_b Ideas Adoption Plan

작성일: 2026-07-01

이 문서는 `docs/COMPARISON_with_RideKorea.md`의 비교 결과를 바탕으로, 오늘 집에서 로컬 환경을 세팅한 뒤 바로 적용할 수 있는 작업 순서를 정리한다.

## 0. 집 PC 로컬 세팅 빠른 체크

이미 clone 되어 있지 않다면:

```powershell
git clone https://github.com/abfishlee/RideKorea.git
cd RideKorea
```

이미 clone 되어 있다면:

```powershell
cd RideKorea
git pull origin master
```

백엔드:

```powershell
docker compose up -d
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
..\venv\Scripts\alembic.exe upgrade head
..\venv\Scripts\python.exe -m app.seed
..\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```

프론트엔드:

```powershell
cd frontend
npm install
npx expo start
```

Android emulator를 쓰는 경우:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api/v1
EXPO_PUBLIC_MAP_URL=http://10.0.2.2:8000/map
```

로컬 PC 브라우저/실기기 같은 네트워크 조건에서는 환경에 맞춰 `127.0.0.1` 또는 PC의 LAN IP를 사용한다.

## 1. 오늘 바로 적용할 우선순위

### P0. 현재 main/master 최신화와 검증

목표:

- 집 PC에서 지금까지 작업한 결과를 정확히 재현한다.

검증 명령:

```powershell
$env:PYTHONPATH='backend'; venv\Scripts\python.exe -m unittest discover -s backend/tests
venv\Scripts\python.exe -m compileall -f backend/app backend/alembic
```

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

완료 기준:

- backend unittest 통과
- backend compileall 통과
- frontend typecheck/lint/test:utils 통과

### P1. 라이딩 엔진 순수 유틸 분리

참고할 RideKorea_b 파일:

- `E:\dev\RideKorea_b\src\features\ride\track.ts`
- `E:\dev\RideKorea_b\src\features\ride\deviation.ts`

우리 앱 적용 대상:

- `E:\dev\RideKorea\frontend\src\hooks\use-rider-location.ts`
- 신규 후보: `E:\dev\RideKorea\frontend\src\utils\ride-track-core.ts`
- 신규 후보: `E:\dev\RideKorea\frontend\src\utils\route-deviation-core.ts`

작업 내용:

- GPS point 누적, 거리 계산, 이동 시간 계산을 React hook 밖 순수 함수로 분리한다.
- route polyline과 현재 위치의 거리 계산을 순수 함수로 분리한다.
- off-route 진입 threshold와 복귀 threshold를 따로 둔다.
- 정상 track과 deviated segment를 별도로 생성할 수 있게 만든다.

권장 기본값:

- off-route enter threshold: 40m
- off-route exit threshold: 25m
- min step distance: 3m
- max accepted accuracy: 80m

테스트:

- 정상 루트 근처 point는 이탈이 아니어야 한다.
- 40m 이상 벗어나면 이탈 상태가 되어야 한다.
- 25m 안쪽으로 돌아와야 복귀 처리되어야 한다.
- 이탈 중인 point들은 pink segment 후보로 묶여야 한다.

완료 기준:

- hook이 계산 로직을 직접 많이 들고 있지 않다.
- 순수 유틸 테스트가 추가된다.
- 기존 주행 HUD가 깨지지 않는다.

### P2. SQLite 기반 local ride outbox 도입

참고할 RideKorea_b 파일:

- `E:\dev\RideKorea_b\src\features\ride\outbox.ts`
- `E:\dev\RideKorea_b\src\stores\ride.ts`

우리 앱 현재 파일:

- `E:\dev\RideKorea\frontend\src\services\offline-track-queue.ts`
- `E:\dev\RideKorea\frontend\src\utils\offline-track-queue-core.ts`

작업 내용:

- SecureStore 기반 queue는 설정/토큰처럼 작은 값에 적합하다.
- 장거리 라이딩 track point와 사진 pin은 SQLite에 저장하는 편이 좋다.
- `ride_meta`, `ride_point`, `ride_photo`에 해당하는 구조를 만든다.
- 서버 전송 성공 후에만 local row를 삭제한다.

권장 단계:

1. 기존 SecureStore queue를 유지한 상태로 SQLite service를 추가한다.
2. 신규 service에 테스트 가능한 core 함수를 둔다.
3. hook에서 저장 대상만 SQLite로 교체한다.
4. 안정화 후 SecureStore queue를 fallback 또는 migration 용도로만 남긴다.

완료 기준:

- 앱 종료 후 재실행해도 진행 중 ride metadata와 points를 복구할 수 있다.
- 서버 전송 실패 시 local data가 사라지지 않는다.
- 긴 주행에서도 queue size 80 같은 제한에 막히지 않는다.

### P3. 라이딩 복구 UX

참고할 RideKorea_b 파일:

- `E:\dev\RideKorea_b\app\(tabs)\ride.tsx`

우리 앱 적용 대상:

- `E:\dev\RideKorea\frontend\src\app\journey.tsx`
- `E:\dev\RideKorea\frontend\src\app\my-path.tsx`
- ride/session 관련 hook 또는 context

작업 내용:

- 앱 시작 또는 Journey 진입 시 unfinished ride가 있는지 확인한다.
- 있으면 "이어서 주행" / "기록 삭제" 선택지를 보여준다.
- 이어서 주행하면 마지막 track과 stats를 복구한다.
- 삭제하면 local outbox를 명시적으로 비운다.

완료 기준:

- 앱 강제 종료 후 재실행해도 사용자가 기록을 잃지 않는다.
- 사용자가 명시적으로 삭제하기 전에는 local ride가 보존된다.

### P4. Naver Map incremental update adapter 정리

참고할 RideKorea_b 파일:

- `E:\dev\RideKorea_b\src\lib\naverMap.ts`

우리 앱 적용 대상:

- `E:\dev\RideKorea\frontend\src\components\JourneyMap.tsx`
- `E:\dev\RideKorea\backend\app\routers\map.py`
- map html/provider 관련 파일

작업 내용:

- 지도 HTML 생성과 주행 중 update protocol을 분리한다.
- `track`, `deviated`, `currentPosition`, `spots`를 message payload로 갱신한다.
- Naver Map Client ID가 없으면 기존 fallback map이 동작해야 한다.

완료 기준:

- GPS update 때마다 전체 HTML을 다시 만들지 않는다.
- 정상 track과 이탈 segment를 다른 색으로 표시할 준비가 되어 있다.
- Naver Map 미설정 환경에서도 개발 가능하다.

### P5. 지오펜스 기반 바우처 감지

참고할 RideKorea_b 파일:

- `E:\dev\RideKorea_b\src\features\geofence\geofence.ts`
- `E:\dev\RideKorea_b\app\(tabs)\wallet.tsx`

우리 앱 적용 대상:

- `E:\dev\RideKorea\backend\app\services\voucher_service.py`
- `E:\dev\RideKorea\frontend\src\app\compass.tsx`
- 신규 후보: `E:\dev\RideKorea\frontend\src\utils\geofence-core.ts`
- 신규 후보: `E:\dev\RideKorea\frontend\src\app\wallet.tsx`

작업 내용:

- 클라이언트에서 POI/region 진입 후보를 감지한다.
- 서버에서 PostGIS로 실제 발급 가능 여부를 재검증한다.
- 발급된 바우처는 Wallet에서 확인한다.

완료 기준:

- GPS가 특정 지역에 들어갔을 때 바우처 후보 알림을 띄울 수 있다.
- 실제 claim은 서버 검증을 통과해야 한다.
- 발급된 바우처 목록을 별도 화면에서 볼 수 있다.

## 2. 오늘 밤 추천 작업 순서

가장 추천하는 순서:

1. `git pull origin master`
2. backend/frontend 검증 명령 실행
3. P1 라이딩 엔진 순수 유틸 분리
4. P1 테스트 추가
5. P2 SQLite outbox service 추가
6. P3 복구 UX skeleton 추가
7. 가능하면 P4 map adapter payload 구조까지 정리

오늘 한 번에 모두 완성하지 못해도 P1과 P2의 뼈대만 잡히면 이후 속도가 크게 빨라진다.

## 3. 사용자 준비가 필요한 작업

아래는 개발자가 임의로 끝낼 수 없는 외부 의존 작업이다.

- Naver Map Client ID 발급
- Naver Map 허용 도메인, Android package, iOS bundle 등록
- Google OAuth 운영 client ID 확정
- Android/iOS redirect URI 확정
- 한국 자전거 도로 GPX/GeoJSON/인증센터 공식 데이터 확보
- 지역 바우처 제휴처, 사용 조건, 정산/법무 정책 확정
- 위치정보 및 사진 업로드 개인정보 처리방침 문구 확정
- App Store / Play Store 계정과 배포 설정

## 4. 적용 후 확인할 사용자 시나리오

사사키 시나리오 기준으로 다음 흐름을 직접 확인한다.

1. Google로 로그인한다.
2. Journey 화면에서 공식 루트 또는 공유 루트를 선택한다.
3. 공유 루트를 내 루트로 가져온다.
4. 주행을 시작한다.
5. 정상 루트를 따라가면 파란 track이 쌓인다.
6. 일부러 루트에서 벗어나면 pink segment가 생긴다.
7. 앱을 강제 종료한다.
8. 다시 열었을 때 진행 중 라이딩 복구 안내가 보인다.
9. 사진 pin을 남긴다.
10. 주행 종료 후 My Path에 요약이 남는다.
11. 특정 지역 진입 시 바우처 후보 알림이 보인다.

## 5. 현재 판단

현재 RideKorea의 완성도는 사사키 시나리오 기준 약 97%로 본다.

남은 핵심 3%는 화면 개수보다 "실제 여행 중 데이터가 안전하게 남는가"에 가깝다. 따라서 오늘 적용할 가장 중요한 개선은 SQLite outbox, 라이딩 복구, 경로 이탈 segment다.

이 세 가지가 들어가면 RideKorea_b의 가장 강한 장점을 흡수하면서도, 우리 앱의 FastAPI/PostGIS 기반 확장성은 그대로 유지할 수 있다.

## 6. 2026-07-01 추가 진행 기록

### 완료: P1 라이딩 엔진 순수 유틸 분리 1차

적용 파일:

- `frontend/src/utils/route-deviation-core.ts`
- `frontend/src/utils/route-deviation-core.test.ts`
- `frontend/src/utils/ride-track-core.ts`
- `frontend/src/utils/ride-track-core.test.ts`
- `frontend/src/hooks/use-rider-location.ts`
- `frontend/src/hooks/use-journey-map.ts`
- `frontend/src/app/index.tsx`
- `frontend/package.json`

완료 내용:

- route polyline 기준 거리 계산 유틸을 추가했다.
- off-route 진입 threshold와 복귀 threshold를 분리한 hysteresis 기반 감지 로직을 추가했다.
- GPS point 누적 거리 계산을 hook 밖 순수 유틸로 분리했다.
- 선택된 공식 코스/공유 루트 path를 `useJourneyMap`에서 `activeRoutePath`로 노출했다.
- `useRiderLocation`이 `activeRoutePath`를 받아 track point의 `is_off_route` 값을 계산하도록 연결했다.
- `npm run test:utils`에 신규 유틸 테스트를 포함했다.

검증:

```powershell
cd frontend
npm.cmd run test:utils
npx.cmd tsc --noEmit
npm.cmd run lint
```

결과:

- `test:utils` 통과
- `tsc --noEmit` 통과
- `lint` 통과

다음 작업:

- P2 SQLite 기반 local ride outbox 도입
- 이후 P3 라이딩 복구 UX 연결

### 완료: P2 SQLite 기반 local ride outbox 1차

적용 파일:

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/services/offline-track-queue.ts`

완료 내용:

- `expo-sqlite` 의존성을 추가했다.
- 기존 `enqueueTrackPoint`, `takeQueuedTrackPoints`, `markQueuedTrackPointAttempt`, `removeQueuedTrackPoints`, `getQueuedTrackPointCount` API 이름은 유지했다.
- 내부 저장소를 SecureStore JSON queue에서 SQLite table `ride_track_queue`로 변경했다.
- `ridekorea.db`에 WAL mode를 적용하고, `journey_id, id` index를 추가했다.
- 기존 SecureStore queue가 남아 있으면 최초 DB 초기화 시 SQLite로 migration 후 legacy key를 삭제한다.
- queue size 80 제한을 제거해 장거리 라이딩에서 더 안전하게 track point를 보존할 수 있게 했다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

결과:

- `tsc --noEmit` 통과
- `lint` 통과
- `test:utils` 통과

주의:

- `npm install expo-sqlite` 후 `npm audit`에서 moderate severity 11건이 표시되었다.
- 이번 작업의 직접 오류는 아니지만, 배포 전 별도 dependency audit 작업으로 확인한다.

다음 작업:

- P3 라이딩 복구 UX 연결
- SQLite outbox에 ride metadata와 photo pin queue까지 확장

### 완료: P3 라이딩 복구 UX 1차

적용 파일:

- `frontend/src/services/local-ride-session.ts`
- `frontend/src/services/offline-track-queue.ts`
- `frontend/src/hooks/use-journey-ride.ts`
- `frontend/src/app/index.tsx`

완료 내용:

- SQLite `ride_meta` table을 추가해 진행 중인 Journey metadata를 저장한다.
- 공식 코스/공유 루트 Journey 시작 시 active ride session을 local DB에 저장한다.
- Journey 완료 시 active ride session을 삭제한다.
- 앱 시작 후 로그인 상태가 확인되면 local active ride session을 읽어 복구 여부를 묻는다.
- 복구 선택 시 서버 Journey를 최신 상태로 확인하고 `riding` 상태로 되돌린다.
- 가져온 공유 루트 Journey는 원본 공유 루트도 다시 불러와 지도에 표시한다.
- 삭제 선택 시 서버 Journey를 `paused`로 바꾸고, 해당 Journey의 local queued track point와 active session을 삭제한다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

결과:

- `tsc --noEmit` 통과
- `lint` 통과
- `test:utils` 통과

남은 보완:

- ride photo pin queue를 SQLite에 저장하는 확장

다음 작업:

- P4 Naver Map incremental update adapter 정리
- 또는 P3 보강으로 복구 시 track point redraw와 finalize flush 강화

### 완료: P3 보강 - 복구 시 track point redraw

적용 파일:

- `frontend/src/hooks/use-journey-map.ts`
- `frontend/src/hooks/use-rider-location.ts`
- `frontend/src/app/index.tsx`

완료 내용:

- 지도 훅에 `setTrackPoints` API와 cached track point 상태를 추가했다.
- WebView가 `MAP_LOADED`를 다시 보내도 cached route, spots와 함께 track points를 다시 그린다.
- 주행 중 서버 저장에 성공한 track points를 직접 WebView에 보내는 대신 지도 훅을 통해 저장/전송한다.
- 라이딩 복구 시 `GET /journeys/{id}/track-points`를 호출해 기존 서버 track points를 지도에 다시 표시한다.
- off-route point는 기존 `is_off_route` 값을 유지하므로 정상 구간/이탈 구간 색상 구분도 복구된다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

결과:

- `tsc --noEmit` 통과
- `lint` 통과
- `test:utils` 통과

다음 작업:

- P3 보강: 완료 직전 pending queue flush/finalize 강화
- 또는 P4 Naver Map incremental update adapter 정리

### 완료: P3 보강 - 완료 전 pending queue flush

적용 파일:

- `frontend/src/services/track-point-sync.ts`
- `frontend/src/hooks/use-rider-location.ts`
- `frontend/src/hooks/use-journey-ride.ts`
- `frontend/src/app/index.tsx`

완료 내용:

- queued track point 전송 로직을 `flushJourneyTrackQueue` 공통 서비스로 분리했다.
- 주행 중 위치 저장과 Journey 완료 직전 flush가 같은 sync 경로를 사용한다.
- Journey 완료 버튼을 누르면 먼저 SQLite pending queue를 서버에 반영한다.
- pending queue flush가 실패하면 Journey를 `completed`로 닫지 않고 사용자에게 재시도를 안내한다.
- flush 성공 시 지도 track cache도 최신 서버 응답 기준으로 갱신한다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

결과:

- `tsc --noEmit` 통과
- `lint` 통과
- `test:utils` 통과

남은 보완:

- 완료 시 마지막 GPS fix를 한 번 더 기록하는 UX 검토

다음 작업:

- P4 Naver Map incremental update adapter 정리
- 또는 P3 보강: ride photo pin queue SQLite 확장

### 완료: P4 Naver Map incremental update adapter 1차

적용 파일:

- `backend/app/main.py`
- `frontend/src/config/env.ts`
- `frontend/assets/naver-map.html`

완료 내용:

- `/map?provider=naver` 요청 시 `frontend/assets/naver-map.html`을 서빙하도록 백엔드를 확장했다.
- `EXPO_PUBLIC_NAVER_CLIENT_ID`가 설정되면 프론트 기본 `MAP_URL`이 자동으로 `provider=naver&clientId=...` 쿼리를 붙인다.
- Naver Client ID가 없으면 기존 Kakao 기반 `map.html` fallback을 계속 사용한다.
- Naver WebView HTML에서 기존 앱 메시지 계약을 유지했다.
  - `DRAW_ROUTE`
  - `SET_TRACK_POINTS`
  - `CLEAR_TRACK_POINTS`
  - `UPDATE_MY_LOCATION`
  - `PAN_TO_LOCATION`
  - `SET_SPOTS`
  - `SET_DIARIES`
  - `SET_TRAVEL_POIS`
  - `ADD_LOCAL_MOMENT_MARKER`
  - `MAP_BOUNDS_CHANGED`
- track point update는 기존과 같이 전체 HTML reload 없이 WebView message로 갱신된다.
- 정상 구간/이탈 구간은 기존 `is_off_route` 기준으로 파란색/분홍색을 유지한다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
```

```powershell
$env:PYTHONPATH='backend'; venv\Scripts\python.exe -m unittest discover -s backend\tests
venv\Scripts\python.exe -m compileall -f backend/app backend/alembic
```

결과:

- frontend typecheck 통과
- frontend lint 통과
- backend unittest 31개 통과
- backend compileall 통과

사용자 준비 필요:

- Naver Cloud Platform Maps Client ID 발급
- Web Dynamic Map 사용 설정
- 로컬/개발 서버 도메인 등록
- Android package, iOS bundle 등록
- `frontend/.env`에 아래 값 추가

```env
EXPO_PUBLIC_NAVER_CLIENT_ID=발급받은_CLIENT_ID
EXPO_PUBLIC_MAP_PROVIDER=naver
```

주의:

- 실제 Naver 지도 렌더링은 Client ID와 NCP 콘솔 도메인/앱 등록이 필요하므로, 현재는 정적 검증과 기존 fallback 보존까지 완료된 상태다.

다음 작업:

- Naver Client ID 입력 후 실기기/WebView 렌더링 QA
- 또는 P3 보강: ride photo pin queue SQLite 확장

### 완료: P3 보강 - ride photo pin queue SQLite 확장

적용 파일:

- `frontend/src/services/local-diary-queue.ts`
- `frontend/src/hooks/use-journey-ride.ts`

완료 내용:

- SQLite `spot_diary_queue` table을 추가했다.
- 사진/글/위치 기반 다이어리 저장이 네트워크 문제로 실패하면 로컬 queue에 임시 저장한다.
- 로컬 queue에는 Journey ID, spot ID, 원본 공유 루트 stop ID, 제목, 본문, 사진 URI, 위치, 공개 상태, retry metadata를 보존한다.
- 로컬 저장된 다이어리는 지도에 임시 로컬 마커로 남겨 사용자가 기록이 사라졌다고 느끼지 않게 했다.
- Journey 완료 전에 `flushQueuedSpotDiaries`로 pending 다이어리 동기화를 한 번 더 시도한다.
- 동기화된 다이어리는 SQLite queue에서 삭제하고, 실패한 항목은 다음 재시도를 위해 남긴다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

결과:

- `tsc --noEmit` 통과
- `lint` 통과
- `test:utils` 통과

남은 보완:

- 완료 시 마지막 GPS fix를 한 번 더 기록하는 UX 검토
- pending diary count를 HUD 또는 My Path에 표시할지 결정
- 앱 시작 시 전체 pending diary background sync 정책 검토

다음 작업:

- P5 지오펜스 기반 바우처 감지
- 또는 Naver Client ID 입력 후 실기기/WebView 렌더링 QA
