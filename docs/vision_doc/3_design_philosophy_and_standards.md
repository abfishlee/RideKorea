# 3. 디자인 철학 및 표준 (Design Philosophy & Standards)

## 🎨 3대 디자인 철학

1. **The Map is the Hero (지도가 주인공이다)**
   * 화면의 80% 이상은 항상 맵(Naver Map)이 차지해야 합니다. 불필요한 하얀색 배경의 UI 패널은 최소화하고, 모든 주요 정보(속도, 남은 거리, 스팟 핀)는 지도 위에 **Glassmorphism(투명도+블러)** 효과가 적용된 플로팅 UI로 떠 있어야 합니다.
2. **Glanceable & Safe-Stop UX (한눈에, 그리고 안전하게)**
   * 자전거 주행 중에는 화면을 세밀하게 조작할 수 없습니다. 글자는 크고 명확해야 하며, 주요 버튼(사진 찍기, 멈춤)은 장갑을 낀 상태에서도 누르기 쉽게 가로/세로 최소 `60px` 이상이어야 합니다.
3. **Positive Reinforcement (긍정적 강화 시각화)**
   * 길을 잃은 것을 실패가 아닌 '새로운 탐험'으로 느끼게 해야 합니다. 색상(Color)을 통해 이 감정을 조절합니다.

---

## 🖌️ 컬러 시스템 (Color Palette)

네이버 지도의 기본 베이스 톤(회색 도로, 녹색 자연)과 완벽하게 어우러지면서도 RideKorea만의 정체성을 보여주는 컬러 스키마입니다.

* **Primary (K-Indigo)**: `#1E3A8A`
  * 신뢰감을 주며 한국의 강과 바다를 상징합니다. 상단 헤더, 주요 버튼, 기본 마커에 사용합니다.
* **Accent (Aero Blue)**: `#0EA5E9`
  * 사용자가 올바르게 가고 있는 메인 주행 궤적(Line) 컬러입니다. 맑고 경쾌한 느낌을 줍니다.
* **Exploration (Adventure Pink)**: `#EC4899`
  * 기존 경로를 이탈하여 새롭게 개척한 길(Deviated Path)의 궤적 컬러입니다. 사용자에게 '탐험'의 긍정적인 감정을 부여합니다.
* **Warning (Alert Orange)**: `#F59E0B`
  * 위험 구간(포트홀, 급경사)을 경고할 때만 제한적으로 사용합니다. 빨간색은 배제합니다.
* **Background (Cloud White)**: `#F8FAFC`
  * 지도 외의 패널이나 바텀 시트 배경으로 사용하여 눈의 피로를 덜어줍니다. 

*(※ AI 개발 주의사항: 외부 스타일링 라이브러리(Tailwind/NativeWind 등)를 피하고, 성능 최적화를 위해 React Native의 기본 `StyleSheet`를 사용하여 구현하십시오.)*

---

## 🔠 타이포그래피 (다국어 최적화)

글로벌 인바운드 앱의 핵심은 '다국어 렌더링이 깨지지 않는 것'입니다. `expo-font` 패키지를 사용하여 커스텀 폰트를 앱 로드 시(App.tsx) 캐싱해야 합니다.

* **English (기본 언어)**: `Inter` (숫자와 가독성이 가장 중요하므로 속도계 폰트로 활용)
* **Japanese**: `Noto Sans JP`
* **Chinese**: `Noto Sans SC/TC`
* **Korean**: `Pretendard`

*(※ AI 개발 팁: 속도계 숫자가 덜덜 떨리는 현상(Jitter)을 방지하기 위해, `fontVariant: ['tabular-nums']` 스타일 속성을 반드시 적용하십시오.)*
