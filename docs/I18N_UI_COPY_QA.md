# I18N UI Copy QA

## 2026-07-01 진행

- [x] Compass 화면의 깨진 한글 문자열 1차 정리
- [x] Compass 화면의 주요 Alert 문구를 번역 키 기반으로 전환
- [x] Compass 화면 언어 선택을 KO/EN/JA 3개 언어로 확장
- [x] 제휴처 바우처 코드 처리, 정산 요약, 바우처 지갑 진입 문구 QA
- [x] `frontend/src/i18n/index.ts`에 Compass 전용 `compassScreenCopy` 추가
- [x] `frontend/src/app/compass.tsx`가 화면 문구를 직접 문자열이 아닌 copy key로 읽도록 변경
- [x] Auth/Login 화면의 KO/EN/JA 문구 QA
- [x] 로그인 화면 언어 선택을 KO/EN/JA 세그먼트 컨트롤로 변경
- [x] Google 로그인 성공, 실패, 검증 실패, 토큰 누락 Alert를 `authCopy` 기반으로 전환
- [x] Journey 화면 핵심 주행 Alert 문구를 KO/EN/JA copy key 기반으로 전환
- [x] JourneyHeader 언어 선택을 KO/EN/JA 세그먼트 컨트롤로 변경
- [x] 인증 스팟 시트와 가져온 루트 시트의 깨진 직접 문구 1차 정리
- [x] Journey Diary 작성 모달의 KO/EN/JA 문구 및 샘플 사진 라벨 정리
- [x] Travel POI 상세 시트의 카테고리, 교통 안내, 액션, 신고, 출처 문구 정리

## QA 기준

- 한국어는 앱 운영자와 일반 사용자가 바로 이해할 수 있는 자연스러운 문장으로 정리한다.
- 영어는 외국인 라이더가 한국 종주 여행 중 이해하기 쉬운 실용 문장으로 유지한다.
- 일본어는 사사키 시나리오 기준의 일본 사용자에게 어색하지 않은 안내 문구를 우선한다.
- 버튼, 제목, 상태값은 짧게 유지하고, 설명 문구는 행동 전에 필요한 맥락만 담는다.

## 남은 작업

- [x] Journey 화면의 기록, 경로, 인증센터 문구 QA 1차
- [x] Journey 화면의 Diary 작성 모달 및 상세 POI 시트 문구 QA 2차
- [ ] Journey 화면의 공개 일지/공유 루트 스팟 시트 문구 QA 3차
- [ ] Moments/Diary 화면의 사진 스팟, 댓글, 공유 문구 QA
- [ ] My Path 화면의 공유 루트/가져오기 문구 QA
- [ ] Admin 모달 내부 문구의 KO/EN/JA coverage 점검
- [ ] 앱 전체에서 깨진 문자 패턴을 자동 탐지하는 i18n QA 스크립트 추가 검토

## 검증

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run test:utils`
- `python -m unittest discover -s backend/tests`
- `python -m compileall -f backend/app backend/alembic`
