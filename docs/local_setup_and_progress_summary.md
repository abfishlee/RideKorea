# RideKorea Local Setup and Progress Summary

작성일: 2026-07-01

이 문서는 다른 PC, 특히 집 로컬 환경에서 RideKorea 개발을 이어가기 위한 세팅 방법과 현재까지 구현한 작업을 정리한다.

## 1. 저장소 받기

```powershell
git clone https://github.com/abfishlee/RideKorea.git
cd RideKorea
```

이미 clone한 저장소가 있다면:

```powershell
git pull origin master
```

## 2. 필수 도구

- Git
- Docker Desktop
- Node.js 24.x 또는 현재 프로젝트에서 사용 중인 Node 런타임
- Python 3.14 또는 프로젝트 가상환경과 호환되는 Python 3.x
- Android Studio 또는 Expo Go

## 3. 데이터베이스 실행

프로젝트 루트에서 PostGIS 컨테이너를 실행한다.

```powershell
docker compose up -d
```

기본 DB 설정:

- Host: `127.0.0.1`
- Port: `5435`
- Database: `ridekorea`
- User: `postgres`
- Password: `postgrespassword`

## 4. 백엔드 세팅

프로젝트 루트에서 가상환경을 만든다.

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

필요하면 루트 또는 `backend` 폴더에 `.env`를 만들고 값을 덮어쓴다.

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgrespassword
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5435
POSTGRES_DB=ridekorea
JWT_SECRET=change-this-in-local-dev
SQL_ECHO=false
CORS_ORIGINS=*
GOOGLE_CLIENT_ID_WEB=
GOOGLE_CLIENT_ID_ANDROID=
GOOGLE_CLIENT_ID_IOS=
APPLE_CLIENT_ID=
OSM_ROUTING_BASE_URL=
ADMIN_EMAILS=
```

마이그레이션과 시드 데이터를 적용한다.

```powershell
cd backend
..\venv\Scripts\alembic.exe upgrade head
..\venv\Scripts\python.exe -m app.seed
```

백엔드 서버를 실행한다.

```powershell
..\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```

확인 URL:

- API docs: `http://127.0.0.1:8000/docs`
- Map HTML: `http://127.0.0.1:8000/map`

## 5. 프론트엔드 세팅

새 터미널에서:

```powershell
cd frontend
npm install
```

필요하면 `frontend/.env`를 만든다.

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
EXPO_PUBLIC_MAP_URL=http://127.0.0.1:8000/map
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_AUTH_PROXY_URI=https://auth.expo.io/@abfishlee/frontend
EXPO_PUBLIC_NAVER_CLIENT_ID=
EXPO_PUBLIC_MAPBOX_TOKEN=
```

Android 에뮬레이터에서는 API 주소를 다음처럼 잡는 것이 보통 편하다.

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api/v1
EXPO_PUBLIC_MAP_URL=http://10.0.2.2:8000/map
```

Expo 실행:

```powershell
npm run android
```

또는:

```powershell
npx expo start
```

## 6. 현재 검증 명령

백엔드:

```powershell
$env:PYTHONPATH='backend'; venv\Scripts\python.exe -m unittest discover -s backend/tests
venv\Scripts\python.exe -m compileall -f backend/app backend/alembic
```

프론트엔드:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

## 7. 현재까지 구현한 주요 내용

- 로그인 우선 UX와 Google OAuth 기반 로그인 골격
- 지도 중심 Journey 화면
- 공식 코스, 스팟, 지도 마커 표시 구조
- 사용자 공유 루트 탐색, 상세, 댓글, 좋아요, 공유 수
- 공유 루트 가져오기와 My Path 연결
- 가져온 공유 루트의 원본 스팟 표시/숨김 토글
- 라이딩 시작, 위치 추적, 속도/거리/시간 HUD
- Journey track point 저장 API와 주행 요약 카드
- 오프라인 위치 큐와 재시도 메타데이터
- 사진 일지, 공개 일지, 지도 마커 연동
- Travel POI 모델/API/UI, 피드백/신고, 관리자 검수 구조
- POI CSV/JSON importer와 라이선스 sidecar 지원
- 교통 POI 자전거 포장/운송 정책 필드
- 바우처 설정/발급 골격
- `ko/en/ja` 언어 타입과 dictionary 구조
- Moments, My Path, 주변 POI 주요 문구의 `ko/en/ja` 확장
- 백엔드 서비스 단위 테스트와 프론트 순수 유틸 테스트

## 8. 이번 푸시에 포함되는 최신 보강

- `frontend/src/i18n/index.ts`
  - `momentsCopy`, `myPathCopy`, `poiCopy` 추가
  - Moments, My Path, 주변 POI에서 공통 `t(lang, copy)` 패턴을 재사용
- `frontend/src/app/moments.tsx`
  - 화면 내 언어 토글 추가
  - 피드 제목, 설명, 탭, 로딩/오류/빈 상태, Alert, 일지 기본 문구를 `ko/en/ja`로 확장
- `frontend/src/app/my-path.tsx`
  - 화면 내 언어 토글 추가
  - 통계 카드, 가져온 루트, Journey 기록, 삭제 확인 Alert, 날짜/거리/시간 포맷을 언어별로 표시
- `frontend/src/components/journey/NearbyTravelPoiPanel.tsx`
  - 주변 POI 패널 제목, 상태 문구, 카테고리 라벨을 `ko/en/ja` dictionary로 연결
- `docs/ridekorea_sasaki_scenario_qa_checklist.md`
  - 사사키 시나리오 기준 완성도 96%로 갱신
  - 다음 우선순위를 My Path 서버 집계 API로 정리

## 9. 아직 사용자가 준비해야 하는 외부 의존 작업

- Naver Map Client ID 발급과 앱/도메인 등록
- Google OAuth 운영 Client ID와 redirect URI 확정
- Apple Developer 계정 및 Sign in with Apple 설정
- 한국 자전거길 공식 GPX/GeoJSON/인증센터 데이터 확보
- 수리점, 숙소, 식당, 교통 데이터 출처와 라이선스 확인
- 바우처 제휴처, 사용 조건, 정산/법무 정책
- 위치정보와 사진 업로드에 대한 개인정보 처리방침

## 10. 다음 추천 작업

외부 키 없이 바로 이어갈 수 있는 다음 작업은 My Path 요약을 서버 집계 API로 최적화하는 것이다.

현재 My Path는 각 Journey의 track point를 화면에서 여러 번 가져와 요약한다. 기록이 늘어나면 API 호출 수와 모바일 계산량이 커지므로, 서버에서 거리, 시간, 포인트 수, 이탈 포인트 수를 집계해 내려주는 방식으로 바꾸는 것이 좋다.
