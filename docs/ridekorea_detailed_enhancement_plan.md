# RideKorea 주말 리팩토링 세부 실행 계획서 (Detailed Implementation Plan)

이 문서는 이전에 작성한 '고도화 로드맵'을 바탕으로, **실제 코드를 어떻게 분리하고 작성해야 하는지** 가장 구체적인 순서와 세부 태스크를 정의한 엔지니어링 가이드입니다. 주말 작업 시 이 문서의 체크리스트를 순서대로 하나씩 지워나가시면 됩니다!

---

## 🏗️ Phase 1. 네비게이션 구조 개편 및 파일 분리 (가장 먼저 할 일)

현재 하나로 뭉쳐있는 `app/index.tsx`를 쪼개어, 확장 가능한 하단 탭(Bottom Tabs) 구조로 재편합니다.

- [ ] **1. 폴더 구조 셋업**
  - `src/app/(tabs)` 디렉토리를 생성합니다.
  - `src/app/(tabs)/_layout.tsx` 파일을 생성하여 Expo Router의 `<Tabs>` 네비게이션을 구성합니다. (하단에 지도, 피드, 마이페이지 탭 아이콘 배치)
- [ ] **2. 스크린 분리 작업**
  - **`app/(tabs)/index.tsx` (지도 화면)**: 맵 렌더링과 실시간 라이딩(GPS 추적) 로직만 남깁니다.
  - **`app/(tabs)/diary.tsx` (다이어리 피드)**: 전 세계 라이더들이 올린 인증샷과 다이어리 목록(Instagram Feed 형태)을 보여주는 화면을 만듭니다.
  - **`app/(tabs)/profile.tsx` (마이페이지)**: 내 정보, 내가 획득한 바우처(쿠폰), 세팅, 로그아웃 버튼을 분리합니다.
- [ ] **3. UI 프레임워크 세팅**
  - 깔끔한 UI를 위해 `NativeWind (TailwindCSS for React Native)`를 설치하고 `tailwind.config.js`를 구성합니다. 

---

## 🗺️ Phase 2. 지도 엔진 전면 교체 (카카오맵 걷어내고 네이버 지도로!)

한국 내 최강의 아웃도어 데이터를 보유하고 있는 **네이버 지도(Naver Map)**로 전면 교체합니다.

- [ ] **1. 의존성 청소 및 설치**
  - 기존 카카오맵 HTML 통신 로직(`handleWebViewMessage`, `<WebView>`)을 과감하게 전부 삭제합니다.
  - 터미널에서 `@mj-studio/react-native-naver-map` (또는 최신 네이버 지도 RN 래퍼) 패키지를 설치합니다.
- [ ] **2. 네이버 지도 초기 설정**
  - Naver Cloud Platform (NCP) 콘솔에서 Client ID를 발급받습니다.
  - `app.json` 안드로이드 설정에 네이버 맵 Client ID 메타데이터를 등록합니다.
- [ ] **3. 네이버 맵 렌더링 및 자전거 레이어 활성화**
  - `NaverMapView`를 화면에 가득 채우고, 네이버 지도가 자랑하는 `isBicycleLayerEnabled={true}` 속성을 켜서 자전거 전용도로와 경사도 표시를 즉시 활성화합니다.
  - `showLocationButton` 등을 활성화하여 내 GPS 위치를 추적합니다.
- [ ] **4. 다국어 설정 연동**
  - 네이버 지도의 표시 언어 속성을 앱 내부의 다국어(i18n) 설정과 연동하여, 외국인 사용자에게는 자동으로 영문 지도 텍스트가 표출되도록 구현합니다.

---

## 🚴 Phase 3. 나만의 코스 주행 추적 및 공유 (가장 핵심 가치)

단방향 코스 안내를 넘어, 유저가 스스로 길을 개척하고 저장하는 기능을 만듭니다.

- [ ] **1. 백그라운드 GPS 권한 획득**
  - `app.json`에 안드로이드 `ACCESS_BACKGROUND_LOCATION` 권한을 추가합니다.
  - `expo-location`의 `requestBackgroundPermissionsAsync`를 호출하는 로직을 작성합니다.
- [ ] **2. 라이딩 추적 태스크 등록**
  - `Location.startLocationUpdatesAsync`를 호출하여 앱을 내린 상태(백그라운드)에서도 좌표가 수집되도록 합니다.
  - 수집된 좌표(Array)는 Zustand 등의 상태 관리 라이브러리를 통해 메모리에 누적시킵니다.
- [ ] **3. 백엔드 주행 데이터 전송**
  - 라이딩 '종료' 버튼을 누르면 누적된 GPS Array 데이터를 묶어 백엔드 API (`POST /journeys/custom`)로 쏩니다.
  - 백엔드(FastAPI)에서는 이 좌표들을 `PostGIS LineString`으로 변환하여 DB에 깔끔하게 저장합니다.

---

## 🌍 Phase 4. 글로벌 다국어(i18n) 시스템 통합

외국인도 거부감 없이 사용할 수 있도록 제대로 된 언어팩을 설정합니다.

- [ ] **1. 다국어 라이브러리 세팅**
  - `i18next`, `react-i18next`, `expo-localization`을 설치합니다.
- [ ] **2. 로컬라이제이션 파일 구성**
  - `src/locales/ko.json`, `en.json`, `ja.json`, `zh.json` 파일을 만듭니다.
  - 예: `"start_riding": "라이딩 시작"` / `"start_riding": "Start Riding"`
- [ ] **3. 텍스트 일괄 교체**
  - 앱 내의 모든 `<Text>라이딩 시작</Text>` 하드코딩 텍스트를 `<Text>{t('start_riding')}</Text>` 형식으로 리팩토링합니다.

---

## ✨ Phase 5. 앱 구동 플로우 (스플래시 스크린 UX) 최적화

초기 실행 시 뚝뚝 끊기는 화면 전환을 부드럽고 프로페셔널하게 바꿉니다.

- [ ] **1. 스플래시 제어권 가져오기**
  - 최상단 `_layout.tsx`에서 `SplashScreen.preventAutoHideAsync()`를 호출하여 앱 로딩 화면이 사라지지 않게 꽉 잡고 있습니다.
- [ ] **2. 폰트/데이터/GPS 로딩 완료 대기**
  - 로그인 토큰 확인, 다국어 파일 로딩, GPS 초기 좌표 권한 획득 등 필수 데이터가 모두 로딩될 때까지 기다립니다. (Promise.all 활용)
- [ ] **3. 부드러운 전환 (Fade Out)**
  - 모든 준비가 끝난 시점에 비로소 `SplashScreen.hideAsync()`를 호출합니다.
  - 이때 지도의 초기 좌표를 앞서 받아둔 내 GPS 위치로 맞춰두었기 때문에, 화면이 열리자마자 대한민국 전체 지도가 줌아웃되는 어색함 없이 완벽하게 현재 위치에 맞춰서 렌더링됩니다.
