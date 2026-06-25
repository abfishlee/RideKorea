# RideKorea 구동 및 실행 가이드 (로컬 및 원격 홈서버 개발환경)

본 문서는 **RideKorea** 프로젝트의 로컬 개발 환경 및 원격 홈서버(개발) 인프라 환경에서 각 서비스(데이터베이스, 백엔드 API, 프론트엔드 모바일 앱)를 실행하고 관리하는 방법을 설명합니다.

---

## 1. 💻 로컬 개발 환경 (Local Development) 실행 방법

로컬 PC(Windows)에서 데이터베이스와 백엔드 API, 프론트엔드 앱을 모두 실행하는 방법입니다.

### 1) PostgreSQL / PostGIS 데이터베이스 기동
로컬 PC에 **Docker Desktop**이 실행되고 있어야 합니다.
```bash
# 프로젝트 루트(e:/dev/RideKorea) 경로에서 실행
docker compose up -d
```
* **동작 확인**: Docker Desktop에서 `ridekorea-db` 컨테이너가 정상 실행 중인지 확인합니다. (로컬 포트 `5435`번으로 PostgreSQL 포트가 포워딩되어 상주합니다.)

### 2) 백엔드 API 서버 (FastAPI) 기동
1. 터미널을 열고 파이썬 가상환경(`venv`)을 활성화합니다.
   ```powershell
   # PowerShell 기준
   cd e:/dev/RideKorea
   .\venv\Scripts\Activate.ps1
   ```
2. 데이터베이스 스키마 및 초기 지형 데이터를 마이그레이션/적재합니다:
   ```powershell
   cd backend
   # Alembic 최신 스키마 갱신
   alembic upgrade head
   # 초기 자전거 코스 및 인증센터 공간 데이터 주입
   python -m app.seed
   ```
3. Uvicorn 개발 서버를 구동합니다:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   * **동작 확인**: 웹 브라우저를 열고 `http://localhost:8000/docs` 주소에 접속하여 Swagger API 문서 창이 정상적으로 표시되는지 확인합니다.

### 3) 프론트엔드 모바일 앱 (Expo) 기동
1. 새로운 터미널 창을 열고 프론트엔드 폴더로 이동합니다.
   ```powershell
   cd e:/dev/RideKorea/frontend
   ```
2. Expo 개발 서버를 시작합니다.
   * **안드로이드 에뮬레이터에서 구동 시**:
     ```powershell
     npm run android
     ```
   * **스마트폰 실기기(Expo Go 앱)에서 구동 시 (QR 코드 스캔)**:
     ```powershell
     npx expo start
     ```
3. **API 주소 설정**: 로컬에서 구동할 때 [frontend/src/app/index.tsx](file:///e:/dev/RideKorea/frontend/src/app/index.tsx)의 `BACKEND_BASE` 및 `MAP_URL` 주소는 `Platform.select` 설정(기본값인 `localhost` 및 에뮬레이터용 `10.0.2.2`)을 유지하면 됩니다.

---

## 2. 🌐 개발 환경 (원격 홈서버) 관리 및 배포 방법

원격 홈서버(`183.122.64.233:2222`)는 깃허브와 연동하여 자동 배포되도록 구성되어 있습니다.

### 1) 자동 배포 (CI/CD) 트리거
* 로컬에서 작업한 내용을 Commit 하고 원격 저장소에 Push 하면, 홈서버에 기동 중인 **GitHub Actions Runner**가 감지하여 자동으로 무중단 배포를 진행합니다.
  ```bash
  git add .
  git commit -m "작업 내용 요약"
  git push origin master
  ```

### 2) 원격 홈서버 수동 상태 확인 및 진단
배포가 정상적으로 동작했는지, 서버가 잘 돌고 있는지 홈서버 내에서 확인하고 싶을 때 사용하는 SSH 기반의 진단 명령어 리스트입니다. (원격 접속 비밀번호는 `.gitignore`에 등록된 `secrets.json` 파일을 참조하세요.)

* **도커 DB 컨테이너 상태 조회**:
  ```bash
  docker ps --filter name=ridekorea
  ```
* **백엔드 FastAPI 프로세스 구동 확인**:
  ```bash
  ps -ef | grep uvicorn | grep -v grep
  ```
* **오픈 포트 리스닝 상태 확인**:
  ```bash
  ss -tulnp | grep -E '(8000|5435)'
  ```
* **Uvicorn 실시간 출력 로그 확인**:
  ```bash
  tail -f ~/actions-runner/_work/RideKorea/RideKorea/backend/uvicorn.log
  ```
* **GitHub Actions Runner 서비스 상태 점검**:
  ```bash
  sudo systemctl status actions.runner.abfishlee-RideKorea.fishnoon.service
  ```

### 3) 프론트엔드가 홈서버 백엔드를 바라보게 하는 방법 (원격 연동)
스마트폰이나 로컬 컴퓨터에서 홈서버에 탑재된 DB와 백엔드를 테스트 용도로 연동하고 싶을 때 설정하는 방법입니다.

* **동일 공유기 내부망(와이파이) 내에서 테스트 시**:
  [frontend/src/app/index.tsx](file:///e:/dev/RideKorea/frontend/src/app/index.tsx) 상단의 URL 구성을 홈서버 내부 IP 주소로 지정합니다.
  ```typescript
  const BACKEND_BASE = 'http://172.30.1.131:8000/api/v1';
  const MAP_URL = 'http://172.30.1.131:8000/map';
  ```
* **외부 통신(포트포워딩 완료 후 외부 LTE/5G망) 테스트 시**:
  공유기 관리자 설정에서 외부 `8000`번 포트가 홈서버 `8000`번으로 연결(포트포워딩)되어 있다면, 외부 공인 IP 주소로 변경하여 테스트합니다.
  ```typescript
  const BACKEND_BASE = 'http://183.122.64.233:8000/api/v1';
  const MAP_URL = 'http://183.122.64.233:8000/map';
  ```
