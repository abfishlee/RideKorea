# RideKorea 홈서버 배포 및 구성 가이드 (Homeserver Deployment Guide)

본 가이드는 개발 완료된 **RideKorea** 프로젝트(React Native + FastAPI + PostgreSQL/PostGIS)를 개인 홈서버(Linux/Ubuntu, Synology, Windows Server 등 Docker 및 Node.js 환경이 가능한 서버)에 설치하고 구동하기 위한 세부 절차를 정의합니다.

---

## 1. 홈서버 요구 사양 및 필수 패키지

홈서버 환경에 아래의 인프라 도구들이 사전에 설치되어 있어야 합니다.

* **Docker & Docker Compose**: 데이터베이스(PostgreSQL + PostGIS) 및 백엔드를 컨테이너 기반으로 격리하여 운영하기 위해 필수적입니다.
* **Node.js 18+ & npm**: 프론트엔드 웹 빌드 및 서빙용.
* **Python 3.10+** (선택 사항): 백엔드를 Docker 없이 호스트에 직접 구동할 경우 필요합니다.
* **외부 도메인 / DDNS**: 외부(모바일 앱 단말기)에서 홈서버에 접속하기 위한 고정 주소가 필요합니다. (예: DuckDNS, Synology DDNS 등)

---

## 2. 프로젝트 소스 코드 다운로드 및 구조

GitHub에 푸시한 저장소로부터 홈서버로 소스를 복제(Clone)합니다.

```bash
git clone <GitHub 저장소 URL>
cd RideKorea
```

**전체 프로젝트 디렉터리 구조:**
```text
RideKorea/
├── docker-compose.yml           # 데이터베이스(PostGIS) Docker 설정 파일
├── .gitignore                   # 버전 관리 제외 파일 정의
├── homeserver_deployment_guide.md # 본 배포 가이드 문서
├── backend/                     # FastAPI 백엔드 프로젝트
│   ├── app/                     # API 애플리케이션 코드
│   ├── alembic/                 # 마이그레이션 이력 관리 폴더
│   ├── requirements.txt         # 백엔드 라이브러리 목록
│   └── uploads/                 # 사용자가 업로드한 라이딩 사진 저장소
└── frontend/                    # React Native Expo 프론트엔드 프로젝트
    ├── src/                     # React Native 코드 소스
    ├── assets/                  # 웹뷰용 카카오 지도 HTML 및 이미지 자산
    └── package.json             # 패키지 의존성 목록
```

---

## 3. 데이터베이스 (PostgreSQL + PostGIS) 배포

홈서버에서 Docker Compose를 실행하여 공간 데이터베이스 환경을 구축합니다.

### 3.1 Docker Compose 기동
프로젝트 루트 디렉터리에 있는 `docker-compose.yml`을 사용하여 데이터베이스 컨테이너를 실행합니다.

```bash
# 백그라운드 모드로 DB 기동
docker compose up -d
```

* **포트 포워딩 주의**: 기본 설정상 외부 포트는 **`5435`**로 뚫려 있습니다. 홈서버의 방화벽 설정 및 포트가 열려 있는지 확인하세요.

---

## 4. 백엔드 API 서버 (FastAPI) 배포

백엔드는 가상환경(venv)을 구성하여 호스트 상에서 직접 실행하거나, PM2 프로세스 매니저를 사용하여 무중단으로 구동합니다.

### 4.1 의존성 설치 및 환경 변수 설정
```bash
cd backend
python -m venv venv

# 가상환경 활성화 (Linux/macOS)
source venv/bin/activate
# 가상환경 활성화 (Windows PowerShell)
# .\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 4.2 `.env` 환경 변수 파일 생성
`backend/` 폴더 내부에 `.env` 파일을 생성하고 홈서버 환경에 맞춰 비밀키 및 호스트 정보를 입력합니다.
```env
PROJECT_NAME="RideKorea API"
API_V1_STR="/api/v1"
SECRET_KEY="YOUR_HOMESERVER_SUPER_SECRET_JWT_KEY_STRING"
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# 홈서버 DB 커넥션 정보 (docker-compose.yml 설정에 맞춤)
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5435/ridekorea"
```

### 4.3 데이터베이스 마이그레이션 및 기초 데이터 주입 (Seeding)
FastAPI 앱을 구동하기 전에 테이블을 생성하고 기본 자전거 코스 및 스팟 정보를 데이터베이스에 세팅합니다.

```bash
# 1. DB 테이블 생성 (Alembic 마이그레이션 실행)
alembic upgrade head

# 2. 서울-부산 코스 및 인증센터 데이터 시딩
python -m app.seed
```

### 4.4 백엔드 서버 구동 (PM2 활용 추천)
홈서버 백그라운드에서 백엔드를 무중단 구동하기 위해 Node.js의 `pm2` 패키지 또는 systemd 서비스를 활용합니다.

```bash
# pm2가 설치되어 있지 않은 경우 설치
npm install -g pm2

# pm2를 이용한 FastAPI 서버 무중단 구동
pm2 start "venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000" --name "ridekorea-backend"

# 서버 재부팅 시 자동 시작 설정
pm2 save
pm2 startup
```

* 백엔드는 이제 홈서버의 **`8000`** 포트에서 외부의 요청을 처리합니다.

---

## 5. 프론트엔드 (React Native / Expo Web) 배포 및 설정

해외 라이더가 실제 모바일 폰으로 접속하거나 웹 브라우저로 지도를 확인할 수 있도록 프론트엔드를 빌드합니다.

### 5.1 백엔드 IP 주소 변경
`frontend/src/app/index.tsx` 파일 상단에 정의된 백엔드 API 주소를 홈서버의 **외부 도메인/DDNS 주소**로 변경합니다.

```typescript
// frontend/src/app/index.tsx (라인 21-30 부근)
const BACKEND_BASE = 'https://your-homeserver-domain.com/api/v1';
const MAP_URL = 'https://your-homeserver-domain.com/map';
```

### 5.2 카카오 지도 API 자격 증명 등록
카카오 개발자 콘솔(`https://developers.kakao.com`)에 로그인한 뒤, 내 애플리케이션의 **플랫폼 설정** 영역에 홈서버의 **외부 도메인 주소**를 반드시 "Web 플랫폼 도메인"으로 추가 등록해야 지도가 정상 작동합니다.

### 5.3 의존성 설치 및 웹/앱 빌드
```bash
cd frontend
npm install

# 1. 모바일 앱 로컬 시뮬레이터 구동 테스트 시
npx expo start

# 2. 웹 버전으로 빌드하여 서빙할 경우 (홈서버에 웹사이트 형태로 노출)
npx expo export --platform web
```
`npx expo export --platform web` 명령을 실행하면 `frontend/dist/` 폴더에 정적 HTML/JS 빌드 파일이 생성됩니다. 이 폴더를 Nginx나 Apache 웹서버로 연결하여 홈서버의 80/443 포트로 서빙하면 브라우저를 통해 완벽한 웹앱 접속이 가능해집니다.

---

## 6. 외부 포트포워딩 및 보안 설정 (SSL/TLS)

모바일 앱 및 카카오맵 API가 HTTPS 환경이 아닐 경우 보안 예외가 발생하거나 차단될 수 있으므로, SSL 적용을 권장합니다.

1. **공유기 포트 포워딩 설정**:
   * 외부 포트 `80` / `443` -> 홈서버 내부 Nginx 역방향 프록시 포트로 바인딩.
   * 외부 포트 `8000` -> 홈서버 내부 FastAPI 포트(8000) 바인딩 (Nginx 프록시를 통해 80/443으로 묶어 내보내는 것을 추천).
2. **Nginx 역방향 프록시 (Reverse Proxy) & Let's Encrypt**:
   * 홈서버 앞단에 Nginx를 두어 `https://your-homeserver-domain.com` 접속 시 내부 8000번 포트(FastAPI) 및 frontend/dist 웹앱 정적 리소스로 라우팅되도록 설정합니다.
   * `certbot`을 이용하여 무료 SSL 인증서를 적용합니다.
