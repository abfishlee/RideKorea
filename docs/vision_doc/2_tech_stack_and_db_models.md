# 2. 기술 스택 및 DB 모델 (Tech Stack & DB Models)

## 🛠 하이브리드 기술 스택 (Hybrid Tech Stack)
개발 속도 극대화와 인프라 관리 최소화를 위해 프론트엔드와 BaaS, 그리고 마이크로서비스를 결합한 하이브리드 구조를 채택합니다.

### 1. Frontend (Mobile App)
* **Framework**: React Native (Expo SDK 56)
* **Language**: TypeScript
* **State Management**: Zustand (전역 상태), React Query (서버 상태 및 캐싱)
* **Map Engine**: `@mj-studio/react-native-naver-map` (한국 최적화 자전거/경사도 레이어)

### 2. Main Backend (BaaS)
* **Service**: Supabase
* **Core Roles**: 
  * Auth (구글/애플 소셜 로그인)
  * Database (PostgreSQL + PostGIS 공간 데이터)
  * Storage (여행 중 찍은 고해상도 사진 저장)
  * Realtime (친구의 라이딩 궤적 실시간 확인)

### 3. Sub Backend (Data Processor)
* **Service**: Python (FastAPI)
* **Core Roles**: 
  * 월 1회 공공데이터(식당, 자전거 수리소, 기차역 등) 스크래핑 및 Supabase DB 자동 업데이트 배치(Batch) 작업.
  * 향후 고도화될 경로 분석 알고리즘 및 데이터 처리를 위한 백엔드로 대기. (현재 1차 MVP 단계에서는 백엔드 로직의 90%를 Supabase가 직접 처리함)

---

## 🗄️ 데이터베이스 모델 (Supabase PostgreSQL 스키마 설계)
**(AI 주의사항: 반드시 `create extension postgis;`를 실행하여 PostGIS 확장을 켜고 작업할 것. `users` 테이블은 Supabase Auth의 `auth.users`와 연동되는 Trigger 함수를 작성할 것.)**

### Table: `users`
* `id` (uuid, PK): Supabase Auth 연동 (auth.users id 참조)
* `nationality` (varchar): 국가 (예: JP, US)
* `profile_image_url` (text): 프로필 사진
* `total_distance` (float): 총 누적 주행 거리

### Table: `routes` (유저가 생성한 기행문/루트)
* `id` (uuid, PK)
* `user_id` (uuid, FK, ON DELETE CASCADE)
* `title` (text): 여행기 제목 (예: 베어링과 함께한 대전 투어)
* `path_geom` (geometry(LineString, 4326)): 주행 궤적 (PostGIS)
* `deviated_geom` (geometry(MultiLineString, 4326)): 원래 계획에서 이탈한 '나만의 핑크색 길' 궤적
* `likes_count` (int): 추천 수 (Default: 0)

### Table: `route_spots` (주행 중 찍은 사진과 메모)
* `id` (uuid, PK)
* `route_id` (uuid, FK, ON DELETE CASCADE)
* `location` (geometry(Point, 4326)): 사진 찍은 위치 좌표
* `photo_url` (text): Supabase Storage URL
* `memo` (text): 사사키가 남긴 감상평
* `spot_type` (enum): 'SCENERY', 'REPAIR', 'FOOD', 'DANGER'

### Table: `vouchers` (위치 기반 지역 쿠폰)
* `id` (uuid, PK)
* `region_polygon` (geometry(Polygon, 4326)): 바우처가 활성화되는 지리적 구역 (예: 부여군 경계)
* `title` (text): 예) 한우 국밥 20% 할인
* `discount_value` (int)
