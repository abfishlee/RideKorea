# RideKorea Sasaki Scenario QA Checklist

작성일: 2026-07-01

이 문서는 일본 라이더 "사사키"의 한국 종단 시나리오를 기준으로 현재 제품이 어디까지 지원되는지, 어떤 보강이 남았는지, 다음 개발 우선순위를 정리한다.

## 1. 현재 완성도 요약

현재 제품 시나리오 완성도는 약 97%로 본다.

- 기본 구조: 지원
- 로그인 우선 UX: 부분 지원
- 공식 루트 지도 탐색: 부분 지원
- 사용자 공유 루트 탐색: 지원
- 공유 루트 가져오기: 지원
- 라이딩 기록/사진 일지: 부분 지원
- 주행 중 속도/거리/시간 HUD: 지원
- 오프라인 위치 큐: 부분 지원, 큐 정규화/배치 제한/재시도 메타데이터 보강 완료
- 주행 기록 요약 카드: 지원
- My Path 기록 요약: 지원, 서버 집계 API 적용 완료
- i18n dictionary 구조: 부분 지원, Journey/Moments/My Path/주변 POI 주요 문구 확장 완료
- 공개 일지/지도 마커: 지원
- 지역 정보/수리점/숙소/교통 POI: 부분 지원
- 바우처: 선택 기능
- 테스트 기반: 부분 지원
- 실서비스 인증/지도/데이터 운영: 외부 준비 필요

## 2. 시나리오별 지원 상태

| 시나리오 | 현재 상태 | 근거 | 다음 보강 |
| --- | --- | --- | --- |
| 첫 화면 로그인 | 부분 지원 | Google 로그인 화면과 Auth Session 구조가 있다. Apple은 보류 상태다. | Google OAuth 운영 설정, Apple 버튼 정책 정리 |
| 로그인 후 지도 중심 첫 화면 | 지원 | `Journey` 탭이 지도 중심 화면으로 동작한다. | 지도 Provider를 Naver로 교체 |
| 공식 종단 루트 선택 | 부분 지원 | 코스/스팟 API와 지도 표시 구조가 있다. 실제 전국 데이터는 부족하다. | 서울-부산 등 공식 루트 GPX/GeoJSON 확보 |
| 사용자 공유 루트 탐색 | 지원 | Moments 공유 루트 피드, 상세 화면, 샘플/DB 루트가 있다. | 검색/필터 UX 추가 |
| 공유 루트 상세 읽기 | 지원 | 사진, 스팟, 평가, 추천, 공유 수, 원본 보기 흐름이 있다. | 고도 요약, 지도 기반 프리뷰 고도화 |
| 공유 루트 가져오기 | 지원 | 서버 Journey import와 My Path/Journey 연결, 가져온 루트 원본 스팟 표시/숨김 토글이 있다. | 중복 import UX, 가져온 루트 편집 |
| 출발 버튼으로 주행 시작 | 부분 지원 | Journey 상태를 `riding`으로 바꾸고 위치 추적을 시작한다. | 백그라운드 위치 권한, 일시정지/재개 |
| 위치/속도/트랙 기록 | 부분 지원 | track point 저장 API, HUD, 실패 시 오프라인 큐, 상세 요약 카드, My Path 서버 요약 API가 있다. | 백그라운드 전송, 배터리 정책 |
| 사진 스팟 자동 마커 | 지원 | 현재 위치/계획 스팟 기반 사진 일지와 지도 마커가 있다. | 실제 카메라/갤러리 선택 UX |
| 원본 루트 이탈 표시 | 부분 지원 | off-route 필드와 색상 표현 기반이 있다. | 루트 근접도 계산, 분홍색 구간 자동화 |
| 공개 일지 지도 탐색 | 지원 | Moments 공개 일지에서 지도 위치 로직과 마커, 상세 시트가 연결된다. | 위치 없는 일지 처리, 주변 일지 클러스터 |
| 공항에서 출발지 이동 팁 | 부분 지원 | transport POI 메모 콘텐츠와 자전거 포장/운송/공식 안내 URL 필드 구조가 있다. | 실제 규정 검증, 노선별 상세 콘텐츠 |
| 수리점/맛집/숙소/경치 정보 | 부분 지원 | `travel_pois` 모델, 조회 API, 주변 POI UI, 지도 마커, 피드백/신고, 관리자 검수, CSV/JSON 파이프라인이 있다. | 실제 데이터셋 승인, 신고 처리 정책 고도화 |
| 지역 바우처 발급 | 부분 지원 | 인증 스팟 기반 바우처 설정/발급 골격이 있다. | 제휴처, 사용 처리, 부정사용 방지 |
| 외국인 친화 다국어 | 부분 지원 | `ko/en/ja` dictionary가 로그인/Journey에 이어 Moments, My Path, 주변 POI 핵심 문구까지 확장됐다. | 상세 루트, 공유 루트 상세, Admin 화면까지 확장 |
| 테스트와 회귀 방지 | 부분 지원 | 백엔드 서비스는 `unittest`, 프론트 순수 유틸은 `npm run test:utils`로 확인한다. | 오프라인 큐 통합 테스트, E2E 테스트 |

## 3. 남은 작업

외부 준비 없이 바로 이어갈 수 있는 작업:

1. 상세 루트, 공유 루트 상세, Admin 화면까지 i18n dictionary 확장
2. 오프라인 위치 큐를 앱 백그라운드 전송 정책과 연결
3. 공유 루트 검색/필터 UX 고도화
4. POI 신고 처리 운영 플로우 고도화
5. 루트 이탈 구간 자동 계산과 색상 표시 고도화

사용자 준비가 필요한 외부 의존 작업:

- Naver Map Client ID와 허용 도메인/패키지 등록
- Google OAuth 운영 Client ID와 redirect URI 확정
- Apple Developer 계정 및 Sign in with Apple 설정
- 한국 자전거길 공식 GPX/GeoJSON/인증센터 데이터
- 공공데이터 또는 제휴 기반 수리점, 숙소, 식당, 교통 데이터의 출처 URL과 라이선스
- 바우처 제휴처, 사용 조건, 정산/법무 정책
- 위치정보/사진 업로드 개인정보 처리방침 문구

## 4. 이번 작업 완료 내용

- `GET /api/v1/journeys/summaries` API 추가
- 서버에서 Journey별 거리, 시간, GPS 포인트 수, 이탈 포인트 수 집계
- GPS 점프 1km 이상 구간은 거리 계산에서 제외
- My Path 화면에서 Journey별 `/track-points` 반복 호출 제거
- 서버 요약 API를 통해 My Path 요약 배지 표시
- 백엔드 Journey 요약 테스트 추가

## 5. 테스트 명령

```powershell
$env:PYTHONPATH='backend'; venv\Scripts\python.exe -m unittest discover -s backend/tests
```

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

```powershell
venv\Scripts\python.exe -m compileall -f backend/app backend/alembic
```

## 6. 다음 추천 작업

다음 작업은 상세 루트, 공유 루트 상세, Admin 화면까지 i18n dictionary를 확장하는 것이 좋다.

이유:

- 외국인 라이더 서비스에서 영어/일본어 품질은 핵심 경험이다.
- 아직 외부 키 없이 진행할 수 있다.
- 사용자에게 직접 보이는 하드코딩 문구를 줄이면 이후 Naver Map, Google OAuth, 실제 데이터 연동 때 UI 수정 부담이 줄어든다.
