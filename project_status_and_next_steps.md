# RideKorea 개발 히스토리 및 잔여 작업 정의서 (Project Status & Next Steps)

본 문서는 **RideKorea** 자전거 종주 앱 프로젝트를 다른 개발 환경에서 이어서 작업하거나, 향후 잔여 작업을 진행할 때 개발 컨텍스트(Context)를 신속하게 복원할 수 있도록 작성된 **인수인계 및 가이드 문서**입니다.

---

## 1. 프로젝트 개요 및 기술 아키텍처

* **프로젝트명**: RideKorea (외국인 라이더를 위한 자전거 종주 지도 및 상생 바우처 플랫폼)
* **프론트엔드**: React Native (Expo) + Kakao Map Web API (WebView Bridge 연동)
* **백엔드**: Python FastAPI (SQLAlchemy ORM + Alembic 마이그레이션)
* **데이터베이스**: PostgreSQL + PostGIS (공간 쿼리 및 지리 데이터 처리)

---

## 2. 현재까지 완료된 작업 히스토리 (Progress History)

### Phase 1 ~ 4: 코어 인프라 및 다이어리 피드 구축
* **백엔드 DB 셋업**: Docker Compose 기반 PostGIS 컨테이너 구성 및 Alembic 테이블 생성 완료.
* **코스 데이터 시딩**: 서울-부산 코스 선형(LineString) 정보 및 26개 인증센터 스팟 좌표 일괄 시딩 완료.
* **지도 WebView 브릿지 연동**: 카카오 지도 로더 에러 핸들링 및 marker 클릭 시 `panTo` 중심 이동 구현.
* **소셜 로그인 MVP**: Mock Social Login(개발자용 토큰 우회 로그인) 구축.
* **사진 일지 작성**: multipart/form-data 기반 이미지 업로드 API, 일지 작성 및 썸네일 노출, 풀스크린 확대용 라이트박스(Lightbox) 컴포넌트 탑재.

### Phase 5: 지자체 상생 바우처 어드민 관리 (옵션 제어 고도화)
* **동적 정책 발급**: 하드코딩된 지역 구분이 아닌, 데이터베이스 `voucher_configs` 테이블의 `is_active` 상태 및 금액 정보에 따라 바우처를 실시간 발급하는 백엔드 로직 완성.
* **어드민 패널 모달 구축**: 로그인 상태 시 헤더 영역에 `⚙️ Admin` 버튼을 신설하여, 코스의 모든 인증센터 목록을 불러오고 토글 스위치와 인풋 폼으로 바우처를 ON/OFF 및 보상 세부정책(한/영 명칭, 금액, 만료기간)을 편집하여 DB에 저장하는 어드민 대시보드 UI를 완성.
* **지자체 제휴 배지 동적화**: 지도 상세 BottomSheet 내의 `🎁 지자체 상생 제휴` 배지를 DB 활성화 상태에 따라 실시간 렌더링하고, 바우처 금액을 동적으로 표기하도록 개선.

### Phase 6: 지도 뷰포트 범위 공개 피드 통합
* **공간 쿼리 고도화**: 지도의 min/max 위경도 영역 내에 속한 공개 일지와 그 일지가 연동된 인증센터의 위치 좌표를 조인해 반환하는 Bounding Box API(`GET /diaries/public`) 최적화.
* **뷰포트 감지 브릿지**: 지도(html)의 드래그/줌이 멈췄을 때 `idle` 이벤트를 감지해 RN으로 영역 정보(`MAP_BOUNDS_CHANGED`)를 전송하는 브릿지 구현.
* **Rider Story 마커 노출**: 수신 영역 내의 공개 다이어리 좌표에 별 모양 특수 마커(`SET_DIARIES`)를 동적으로 띄우고, 마커 클릭 시 해당 스팟 피드가 아래에서 스라이딩하여 펼쳐지도록 연동 완료.

---

## 3. 핵심 소스 코드 주요 경로

* **백엔드 데이터 모델**: [backend/app/models.py](file:///e:/dev/RideKorea/backend/app/models.py) (`User`, `SpotDiary`, `Voucher`, `VoucherConfig` 등)
* **어드민 바우처 API 라우터**: [backend/app/routers/admin_vouchers.py](file:///e:/dev/RideKorea/backend/app/routers/admin_vouchers.py) (`GET/POST /admin/voucher-configs`)
* **지도 피드 API 라우터**: [backend/app/routers/diaries.py](file:///e:/dev/RideKorea/backend/app/routers/diaries.py) (`GET /diaries/public` Bounding Box 처리)
* **카카오맵 WebView HTML**: [frontend/assets/map.html](file:///e:/dev/RideKorea/frontend/assets/map.html) (양방향 이벤트 리스너 및 마커 처리기)
* **프론트엔드 메인 스크린**: [frontend/src/app/index.tsx](file:///e:/dev/RideKorea/frontend/src/app/index.tsx) (전체 상태 관리, 모달 및 UI 레이아웃)
* **홈서버 배포 가이드**: [homeserver_deployment_guide.md](file:///e:/dev/RideKorea/homeserver_deployment_guide.md)

---

## 4. 향후 잔여 작업 로드맵 (Next Steps)

### Task 1. SNS 정식 API 연동 로그인 개발 (예정)
* **클라이언트 흐름 교체**: Mock 로그인 버튼을 걷어내고, 구글/애플/카카오/네이버 공식 SDK 및 OAuth 인증창을 통해 유저의 실제 `idToken` 및 `accessToken`을 발급받도록 연동.
* **백엔드 토큰 검증기 교체** (`auth.py`):
  * Google OAuth API, Apple Public Key JWK 디코딩, Kakao/Naver 토큰 정보조회 API 연동을 통해 토큰 서명과 만료기간을 직접 검증하도록 로직 고도화.
  * 검증 성공 시에만 데이터베이스 `User` 생성 및 JWT 리턴.

### Task 2. 홈서버 이관 및 실서버 배포
* **Nginx 역방향 프록시 세팅**: 홈서버 포트 80/443과 내부 FastAPI 8000포트를 리다이렉션하여 프론트엔드 정적 웹 리소스와 백엔드를 통합 서빙하도록 구성.
* **SSL/TLS 적용**: 무료 Let's Encrypt SSL 인증서를 발급하여 백엔드 API 주소 및 WebView 통신 경로를 HTTPS 보안 프로토콜로 강제 적용.
* **Kakao Console 도메인 등록**: 카카오 개발자 콘솔 Web 플랫폼 설정에 홈서버의 실 도메인 주소 등록.

### Task 3. 모바일 APK/IPA 빌드 및 현장 검증
* **Expo EAS Build**: 개발자 계정을 활용해 빌드 파이프라인을 구동하고 Android(APK), iOS(AdHoc/TestFlight) 배포본 빌드.
* **로케이션 및 카메라 연동**: 인증센터 현장에서 카메라 기기를 활용해 실제 사진을 찍어 스탬프를 인증하고, 실시간 할인 바코드가 정상 발급되는지 시나리오 테스트.
