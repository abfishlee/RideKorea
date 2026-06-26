# RideKorea 홈서버 깃 푸시 자동 배포 가이드 (Homeserver CI/CD Guide)

본 가이드는 로컬 개발 PC에서 코드를 수정하고 `git push`를 보냈을 때, 사용자님의 개인 홈서버에도 실시간으로 소스코드가 내려받아지고 데이터베이스 및 백엔드가 **자동으로 재구동(Auto-Deployment)**되도록 CI/CD 파이프라인을 구축하는 방안을 설명합니다.

개인 홈서버 환경에 가장 적합한 **두 가지 최적의 자동 배포 방식**을 제안합니다.

---

## 💡 제안 1. GitHub Actions + Self-Hosted Runner (권장 🌟)

GitHub에서 제공하는 무료 CI/CD 러너(데몬)를 홈서버 내부 백그라운드 프로세스로 띄워두는 방식입니다. 

### 1) 작동 원리 및 장점
* **방화벽 통과 방식을 통한 보안**: 외부에서 홈서버로 접속하는 웹훅 포트포워딩을 추가로 열 필요가 없습니다. 홈서버에 기동된 GitHub 러너가 GitHub 서버를 아웃바운드로 감시하다가, Push 감지 시 코드를 가져와서 로컬 배포 스크립트를 직접 실행합니다.
* **비밀번호 유출 없음**: SSH 비밀번호를 외부에 노출하지 않고 안전하게 배포가 가능합니다.

### 2) 홈서버에 Runner(에이전트) 설치 단계
1. 사용자님의 GitHub `RideKorea` 저장소 페이지에 접속합니다.
2. `Settings` -> `Actions` -> `Runners` 메뉴로 이동하여 **`New self-hosted runner`** 버튼을 누릅니다.
3. Runner OS 사양으로 **`Linux`** 및 **`x64`**를 선택합니다.
4. 홈서버 SSH 터미널에 접속하여 카카오가 화면에 보여주는 다운로드 및 설정 쉘 명령어를 순서대로 복사하여 붙여넣습니다:
   ```bash
   # (예시 명령어 - 실제 토큰 값은 깃허브 웹 화면에 나타납니다)
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/...
   tar xzf ./actions-runner-linux-x64.tar.gz
   ./config.sh --url https://github.com/abfishlee/RideKorea --token YOUR_RUNNER_TOKEN
   ```
5. 설치 설정 중 `work folder` 등은 기본값으로 유지합니다.
6. 러너를 홈서버 백그라운드 서비스로 등록하여 부팅 시 자동 시작되도록 설정합니다:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

### 3) GitHub Workflows 스크립트 작성
프로젝트 루트 폴더에 `.github/workflows/deploy.yml` 파일을 만들고 아래 코드를 기입해 커밋/푸시합니다.
```yaml
name: Homeserver Continuous Deployment

on:
  push:
    branches:
      - master  # 또는 main

jobs:
  deploy:
    runs-on: self-hosted  # 홈서버에 설치된 self-hosted 러너 지정
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Restart Services with Docker & Uvicorn
        run: |
          # 1. DB 컨테이너 동기화
          docker compose up -d --build
          
          # 2. 백엔드 가상환경 의존성 설치 및 DB 마이그레이션
          cd backend
          python3 -m venv venv
          venv/bin/pip install -r requirements.txt
          venv/bin/alembic upgrade head
          venv/bin/python3 -m app.seed
          
          # 3. 백엔드 Uvicorn 서버 백그라운드 재시작
          pkill -f uvicorn || true
          nohup venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > uvicorn.log 2>&1 &
```

---

## 💡 제안 2. GitHub Webhook + FastAPI 배포 웹훅 (초경량 방식)

우리의 FastAPI 백엔드 프로젝트 내부에 `/api/v1/admin/deploy-webhook` 엔드포인트를 간단하게 개설하여, GitHub Push 시 웹훅(HTTP POST)을 호출받으면 홈서버 자체적으로 코드를 업데이트하는 방식입니다.

### 1) 작동 원리
1. 로컬에서 GitHub에 push 합니다.
2. GitHub이 등록된 홈서버 주소(예: `http://183.122.64.233:8000/api/v1/admin/deploy-webhook`)로 신호를 보냅니다.
3. FastAPI 백엔드가 이 신호를 감지하고 내부 OS 서브프로세스(`subprocess`)를 열어 `git pull && docker compose up -d && restart backend`를 호출합니다.

### 2) 장점
* 추가적인 설치 패키지(Actions Runner 등)가 없으므로 홈서버 자원(RAM 등)을 극도로 아낄 수 있습니다.

### 3) 구현 절차
* **FastAPI 엔드포인트 코드 예시** (`admin_vouchers.py` 또는 신규 배포 라우터에 추가):
  ```python
  import subprocess
  from fastapi import APIRouter, Header, HTTPException, status
  
  router = APIRouter(prefix="/admin", tags=["Admin Webhook"])
  
  @router.post("/deploy-webhook")
  async def github_deploy_webhook(x_github_event: str = Header(None)):
      if x_github_event != "push":
          raise HTTPException(status_code=400, detail="Invalid event type")
          
      # 백그라운드 쉘 스크립트 실행 (git pull 및 리스타트)
      # 보안용 시크릿 토큰 검증 로직 추가 권장
      try:
          subprocess.Popen(["/bin/bash", "./deploy.sh"])
          return {"status": "deployment triggered"}
      except Exception as e:
          raise HTTPException(status_code=500, detail=str(e))
  ```
* **원격 홈서버의 `deploy.sh` 쉘 스크립트 내용:**
  ```bash
  #!/bin/bash
  cd ~/RideKorea
  git pull origin master
  docker compose up -d
  cd backend
  venv/bin/pip install -r requirements.txt
  venv/bin/alembic upgrade head
  pkill -f uvicorn || true
  nohup venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > uvicorn.log 2>&1 &
  ```

---

## 📢 개발자 에이전트의 강력 추천
보안성 및 안정성, 그리고 가시적인 배포 이력(GitHub 웹페이지에서 배포 성공/실패와 에러 로그를 한눈에 볼 수 있음)을 고려할 때 **제안 1 (GitHub Actions + Self-Hosted Runner)**을 1순위로 구축하시는 것을 강력하게 추천해 드립니다!
