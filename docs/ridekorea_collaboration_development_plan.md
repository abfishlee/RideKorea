# RideKorea 협업 고도화 개발 계획서

작성일: 2026-06-29  
목적: 기존 Markdown 기획/아키텍처 문서를 분석해, Codex와 함께 실제로 개발해 나갈 순서와 사용자 직접 준비 항목을 분리한다.

---

## 1. 현재 문서 분석 요약

### 1.1 서비스 방향

RideKorea는 한국 자전거 종주를 원하는 외국인 라이더를 위한 지도 기반 여행 앱이다.

핵심 가치는 다음 4개다.

- 한국 자전거 종주 코스와 인증센터를 외국인이 이해하기 쉽게 제공
- 스팟별 사진/다이어리 기록과 공개 피드 제공
- 지자체/소상공인 바우처를 통한 지역 상생 구조 제공
- 향후 코스 추천, 오프라인 지도, 교통/숙박/캠핑 정보까지 확장

### 1.2 현재 구현 상태

문서 기준으로 다음 기능은 이미 MVP 형태로 구현되어 있다.

- FastAPI + PostgreSQL/PostGIS 기반 백엔드
- 서울-부산 코스 및 인증센터 시딩
- 지도 WebView 브릿지
- Mock/Google 로그인 흐름 일부
- 사진 일지 업로드 및 공개 다이어리 지도 마커
- 바우처 설정/발급/어드민 관리
- 홈서버 개발 배포 가이드 및 CI/CD 방향

현재 코드 구조상 프론트엔드의 많은 기능이 `frontend/src/app/index.tsx` 한 파일에 집중되어 있어, 고도화 전 첫 리팩토링 대상이다.

### 1.3 문서 간 충돌 지점

지도 관련 문서에 서로 다른 방향이 섞여 있다.

- 초기 문서: 카카오맵 WebView 중심
- 세부 실행 계획: 네이버 지도 RN SDK 전면 교체
- 지도 제공자 결정 문서: 네이버 Web Dynamic Map + WebView, 라우팅은 자체 OSM 엔진

실제 개발 안정성, Expo 호환성, 비용 통제, 기존 WebView 구조 재사용성을 고려하면 1차 고도화에서는 **네이버 Web Dynamic Map을 WebView 기반 Provider로 붙이고, 지도 추상화 계층을 먼저 정리**하는 방향이 가장 안전하다.

---

## 2. 확정 개발 원칙

### 2.1 지도 전략

1차 목표는 네이버 지도로 전환하되, 특정 지도 업체에 종속되지 않게 한다.

- `MapProvider` 추상화 계층을 유지한다.
- 기본 지도는 네이버 Web Dynamic Map(WebView)로 구현한다.
- 기존 카카오 WebView 브릿지에서 검증된 메시지 구조를 재사용한다.
- 자전거 경로 계산은 네이버/카카오 자동차 길찾기 API에 의존하지 않는다.
- 공식 종주 코스는 자체 GPX/GeoJSON/PostGIS 데이터로 오버레이한다.
- 일반 자전거 라우팅은 이후 GraphHopper/BRouter/OSM 기반으로 붙인다.

### 2.2 앱 구조 전략

바로 큰 기능을 더하기보다 먼저 앱을 나눠 개발 가능한 구조로 바꾼다.

- `index.tsx`의 지도, 인증, 다이어리, 바우처, 어드민 로직을 단계적으로 분리한다.
- Expo Router 기반 탭 구조를 도입한다.
- UI는 지도 중심, 정보는 하단 시트/탭/모달로 정리한다.
- 디자인 시스템은 현재 의존성에 맞춰 우선 `StyleSheet` + 공통 theme로 시작하고, NativeWind는 필요 시 별도 도입한다.

### 2.3 출시 전략

초기 출시는 기능 욕심보다 현장 검증 가능한 MVP에 집중한다.

- 서울-부산 국토종주 코스를 우선 완성한다.
- 영어 UI와 지도/스팟 정보 품질을 우선한다.
- 실사용 전 보안, 개인정보, 위치 권한, 바우처 법무 리스크를 반드시 정리한다.

---

## 3. 협업 역할 분담

### 3.1 Codex가 주도할 작업

- 기존 코드 분석 및 리팩토링
- 프론트엔드 화면/컴포넌트 분리
- 백엔드 API 추가/수정
- DB 모델 및 Alembic 마이그레이션 작성
- 지도 WebView 브릿지 구현
- 테스트, 빌드, 타입 체크, 린트 수정
- 문서 업데이트 및 작업 체크리스트 관리

### 3.2 사용자가 직접 해야 하는 작업

외부 계정, 약관 동의, 실명 인증, 결제 수단, 콘솔 접근이 필요한 항목은 사용자가 직접 진행해야 한다.

- NAVER Cloud Platform 계정 생성 및 Maps API 신청
- 네이버 지도 Web Dynamic Map Client ID 발급
- 네이버 콘솔에서 앱 패키지명, 번들 ID, Web 서비스 URL, 허용 도메인 등록
- 네이버 API 사용량 알림/월 한도/결제 차단 정책 설정
- Google OAuth Client ID 발급
- Apple Developer 계정 및 Sign in with Apple 설정은 iOS 출시 준비 단계에서 진행
- Kakao/Naver 소셜 로그인 사용 시 각 개발자 콘솔 앱 생성
- 홈서버 도메인, DNS, 공유기 포트포워딩, SSL 인증서 발급 승인
- 앱스토어/플레이스토어 개발자 계정 등록
- 개인정보 처리방침, 위치정보 이용 고지, 사진 업로드 정책, 바우처 법무/정산 검토
- 공공데이터포털, TourAPI, TAGO 등 API 키 발급

### 3.3 함께 결정할 작업

- 네이버 지도는 WebView 우선인지, RN 네이티브 SDK까지 갈지
- 하단 탭 이름: Journey / Moments / My Path / Compass 유지 여부
- 첫 로그인 화면의 브랜드 문구와 Google 로그인 UX
- 1차 출시 언어: 영어 우선 + 한국어 관리자용인지, 영어/한국어 동시 지원인지
- 바우처를 실제 금전성 쿠폰으로 갈지, MVP에서는 데모/리워드 코드로 제한할지
- 홈서버를 계속 쓸지, MVP 공개 전 클라우드/VPS로 옮길지

---

## 4. 단계별 개발 로드맵

### Phase D. 디자인 전면 개편

목표: 기존 기능을 보존하면서 RideKorea의 첫인상을 상용 MVP 수준으로 재설계한다.

- [ ] 디자인 가이드를 코드 토큰으로 변환
- [ ] 비로그인 첫 화면을 Google SNS 로그인 화면으로 설계
- [ ] `Home/Explore` 탭을 `Journey/Moments/My Path/Compass`로 재구성
- [ ] 로그인 후 첫 화면인 지도 중심 Journey 화면 설계
- [ ] 공개 다이어리 Moments 화면 설계
- [ ] 내 기록/바우처 My Path 화면 설계
- [ ] 설정/Admin Compass 화면 설계
- [ ] 공통 버튼, 아이콘 버튼, 상태 pill, 카드, 바텀시트 컴포넌트 구축

상세 문서:

- [RideKorea 디자인 전면 개편 계획서](./ridekorea_design_overhaul_plan.md)

### Phase 0. 기준선 점검

목표: 현재 앱이 로컬에서 재현 가능하고, 어디가 깨졌는지 확인한다.

- [ ] `docker compose up -d`로 PostGIS 구동
- [ ] `alembic upgrade head` 실행
- [ ] `python -m app.seed` 실행
- [ ] FastAPI `/docs` 확인
- [ ] Expo 앱 실행 확인
- [ ] 현재 `index.tsx` 기능 목록화
- [ ] 하드코딩된 IP/API URL 정리 대상 표시

산출물:

- 현재 실행 상태 리포트
- 고장/미구현/환경 의존 항목 목록

### Phase 1. 프론트엔드 구조 리팩토링

목표: 모든 기능이 한 화면에 몰린 구조를 개발 가능한 단위로 나눈다.

- [ ] `src/services/api.ts` 생성 및 API 호출 분리
- [ ] `src/types` 생성 및 Course/Spot/Diary/Voucher 타입 분리
- [ ] `src/components/map`, `src/components/diary`, `src/components/voucher`, `src/components/admin` 분리
- [ ] Expo Router 탭 구조 도입
- [ ] 지도 화면, Moments 피드, My Path, Compass/Admin 화면 분리
- [ ] 기존 기능 동작 유지 확인

산출물:

- 기능 보존 리팩토링 PR 단위
- 화면별 책임이 분리된 프론트 구조

### Phase 2. 지도 추상화 및 네이버 지도 전환

목표: 네이버 지도를 붙이되, 향후 Mapbox/카카오/Google 교체가 가능하게 한다.

- [ ] 현재 `frontend/src/map` 구조 점검
- [ ] `MapProvider` 명령/이벤트 규격 확정
- [ ] 네이버 Web Dynamic Map용 `map.html` 또는 별도 HTML 작성
- [ ] `INIT_MAP`, `DRAW_ROUTE`, `SET_SPOTS`, `SET_DIARIES`, `MAP_BOUNDS_CHANGED`, `MARKER_CLICKED` 메시지 호환
- [ ] 네이버 Client ID 환경변수 주입
- [ ] 자전거 레이어/스팟 마커/다이어리 마커 표시
- [ ] 비용 발생 API 호출과 무료/유료 범위 문서화

사용자 준비:

- NAVER Cloud Platform Maps Client ID
- 허용 도메인/패키지 등록
- 사용량 제한 설정

산출물:

- 네이버 지도 Provider
- 지도 제공자 결정 문서 업데이트

### Phase 3. 인증 실서비스화

목표: Mock 로그인과 임시 흐름을 실제 OAuth 검증 흐름으로 대체한다.

- [ ] 현재 `backend/app/auth.py`, `services/oauth.py`, `routers/auth.py` 점검
- [ ] Auth Gate 구현: 저장 토큰 확인 후 Login 또는 Journey로 분기
- [ ] Google 로그인 화면 구현
- [ ] Google ID Token 검증 완성
- [ ] Apple 로그인은 iOS 출시 준비 단계로 보류
- [ ] Kakao/Naver 로그인은 필요 시 후순위로 추가
- [ ] JWT Secret 환경변수화
- [ ] SecureStore 토큰 저장/복구 안정화
- [ ] 로그아웃/토큰 만료 처리

사용자 준비:

- Google OAuth Client ID
- Apple Developer 계정 및 Services ID/App ID는 Apple 로그인 착수 시점에 준비
- 실제 앱 번들 ID 확정

산출물:

- Google 실로그인 가능한 앱
- 인증 환경변수 문서

### Phase 4. 지도 기반 피드와 다이어리 UX 고도화

목표: RideKorea의 감성적 차별점인 지도 위 경험 기록을 더 매끄럽게 만든다.

- [ ] 지도 바운딩 박스 기반 공개 다이어리 조회 안정화
- [ ] 스팟 상세 Bottom Sheet 컴포넌트화
- [ ] 다이어리 작성/사진 업로드 UX 개선
- [ ] 공개/비공개 상태 표시
- [ ] Moments 탭에 공개 피드 리스트 구성
- [ ] 이미지 업로드 용량/확장자 제한

산출물:

- 지도 마커와 피드가 연결된 커뮤니티 경험

### Phase 5. 주행 추적 및 내 기록

목표: 사용자가 실제로 달린 기록을 저장한다.

- [ ] `expo-location` 포그라운드 위치 추적
- [ ] 라이딩 시작/일시정지/종료 상태 관리
- [ ] 좌표 샘플링 기준 설정
- [ ] 백엔드 `journeys`에 LineString 저장
- [ ] My Path 탭에서 내 기록 표시
- [ ] 배터리/백그라운드 권한은 별도 단계로 확장

함께 결정:

- 5초 간격인지, 10m 이동 기준인지
- 오프라인 임시 저장을 1차에 넣을지

산출물:

- 내 실제 주행 기록 저장 MVP

### Phase 6. 다국어 및 외국인 친화 UX

목표: 외국인 대상 서비스로 보이는 수준까지 끌어올린다.

- [ ] i18n 구조 도입
- [ ] 영어 UI 우선 정리
- [ ] 스팟/코스 설명 `name_en`, `description_en` 표시 강화
- [ ] 언어 선택 저장
- [ ] 인증센터/종주 문화 설명 카드 추가
- [ ] 위치 권한/사진 권한 안내 문구 영어화

산출물:

- 영어 사용자 기준으로 자연스러운 MVP

### Phase 7. 배포/보안/출시 준비

목표: 외부 테스트가 가능한 안정 상태로 만든다.

- [ ] `secrets.json` git history 노출 여부 점검
- [ ] 민감값 `.env`/환경변수로 이동
- [ ] 홈서버 HTTPS 적용
- [ ] API URL 환경별 분리
- [ ] 이미지 저장소 백업 전략 수립
- [ ] 앱 권한 문구 정리
- [ ] EAS Build 구성
- [ ] Android 내부 테스트 빌드

사용자 준비:

- 도메인/DNS/SSL 설정 승인
- Google Play Console 등록
- Apple Developer Program 등록
- 개인정보 처리방침 URL 준비

산출물:

- 테스트 배포 가능한 Android/iOS 빌드

---

## 5. 첫 개발 스프린트 제안

첫 스프린트는 기능 추가보다 구조 정리에 집중한다.

### Sprint 1 목표

`frontend/src/app/index.tsx`를 안전하게 쪼개고, Google Login/Auth Gate와 지도 Provider 전환 준비를 끝낸다.

### Sprint 1 작업

- [ ] 현재 `index.tsx`의 상태/함수/모달을 기능별로 분류
- [ ] 인증 상태 확인과 Google 로그인 UI를 별도 화면/컴포넌트로 분리
- [ ] API URL을 설정 파일로 이동
- [ ] API 호출 함수를 `src/services/api.ts`로 이동
- [ ] 타입을 `src/types`로 이동
- [ ] Admin/Voucher/Diary 컴포넌트 분리
- [ ] 기존 앱 동작 확인
- [ ] 네이버 지도 전환 작업 목록을 코드 기준으로 재산정

### Sprint 1 완료 기준

- 기존 기능이 깨지지 않는다.
- `index.tsx` 또는 Journey 화면이 지도 화면 역할에 집중한다.
- 비로그인 사용자는 Google Login 화면을 먼저 본다.
- 다음 스프린트에서 네이버 지도 Provider를 붙일 준비가 된다.

---

## 6. 즉시 확인해야 할 리스크

- `secrets.json`이 현재 루트에 존재한다. git 추적 여부와 과거 커밋 노출 여부를 먼저 확인해야 한다.
- `frontend/src/app/index.tsx`에 로컬 IP가 하드코딩되어 있다. 환경별 설정으로 분리해야 한다.
- 바우처는 실제 금전성 혜택으로 운영하면 법무/정산/부정사용 방지 설계가 필요하다.
- 네이버 지도 비용 정책은 콘솔 기준으로 사용량 제한을 반드시 걸어야 한다.
- 홈서버 공개 운영 전 HTTPS와 민감값 관리가 필요하다.
- 위치 추적은 앱스토어 심사에서 민감하다. 권한 설명과 백그라운드 사용 목적을 명확히 해야 한다.

---

## 7. 다음 액션

1. Phase 0 기준선 점검을 실행한다.
2. `secrets.json` 추적/노출 여부를 확인한다.
3. Sprint 1 리팩토링 브랜치를 만든다.
4. 프론트 API/타입/컴포넌트 분리를 진행한다.
5. 사용자는 NAVER Cloud Platform Maps Client ID 발급을 준비한다.
