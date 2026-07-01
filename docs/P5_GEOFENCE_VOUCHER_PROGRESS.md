# P5 Geofence Voucher Progress

작성일: 2026-07-01

## 완료: 지오펜스 기반 바우처 감지 1차

이번 작업은 사용자가 공식 코스 주행 중 활성 바우처 spot 반경에 들어오면 앱이 자동으로 바우처를 claim하는 뼈대를 만든 작업이다.

적용 파일:

- `backend/app/schemas.py`
- `backend/app/routers/vouchers.py`
- `backend/app/services/voucher_service.py`
- `frontend/src/services/api.ts`
- `frontend/src/types/ridekorea.ts`
- `frontend/src/utils/geofence-core.ts`
- `frontend/src/utils/geofence-core.test.ts`
- `frontend/src/hooks/use-journey-map.ts`
- `frontend/src/app/index.tsx`
- `frontend/package.json`

완료 내용:

- `/vouchers/claim` API를 추가했다.
- 서버는 라이더 위치와 spot ID를 받아 PostGIS `ST_DWithin`으로 실제 반경 내 위치인지 검증한다.
- 동일 사용자가 같은 spot에서 이미 받은 바우처가 있으면 중복 발급하지 않고 기존 바우처를 반환한다.
- 클라이언트에 `findNearestGeofenceHit` 순수 유틸을 추가했다.
- Journey 화면은 선택된 공식 코스의 활성 바우처 spot을 감시한다.
- 주행 중 현재 위치가 바우처 spot 반경에 들어오면 자동으로 claim API를 호출한다.
- claim 성공 시 `지역 바우처가 도착했어요` 알림을 표시한다.
- geofence 유틸 테스트를 `test:utils`에 포함했다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

```powershell
$env:PYTHONPATH='backend'; .\venv\Scripts\python.exe -m unittest discover -s backend\tests
.\venv\Scripts\python.exe -m compileall -f backend\app backend\alembic
```

검증 결과:

- frontend typecheck 통과
- frontend lint 통과
- frontend test:utils 통과
- backend unittest 31개 통과
- backend compileall 통과

남은 보완:

- Wallet 화면에서 새로 받은 바우처를 refresh하거나 unread 상태로 보여주는 UX
- 운영용 abuse control: per-user cooldown, device/account cap, claim 실패 cooldown
- 실제 제휴처 QR/코드 사용, merchant redemption, 정산 흐름
- 백그라운드 위치 권한을 켠 상태에서 앱이 뒤에 있을 때의 지오펜스 알림 정책

다음 작업 후보:

1. Wallet UX refresh/unread 상태 보강
2. Naver Client ID 입력 후 실제 기기 WebView 렌더링 QA
3. 바우처 abuse control과 redemption API 설계

## 완료: Wallet UX refresh/unread 상태 보강

적용 파일:

- `frontend/src/app/compass.tsx`
- `frontend/src/components/voucher/VoucherWalletModal.tsx`
- `frontend/src/types/ridekorea.ts`

완료 내용:

- 지갑을 열 때마다 `/vouchers/me`를 다시 호출해 주행 중 자동 발급된 바우처가 바로 보이도록 했다.
- 지갑 모달에 새로고침 버튼과 pull-to-refresh를 추가했다.
- `VoucherWalletModal`의 `any[]` 타입을 제거하고 `Voucher[]` 타입으로 정리했다.
- 사용 가능/사용 완료 개수를 상단 요약으로 분리했다.
- 최근 24시간 내 발급된 바우처에는 `신규` 배지를 표시한다.
- 사용 가능/사용 완료 상태 배지를 카드에 표시한다.
- 서버 응답의 `reward_amount`, `created_at`, `is_redeemed` 필드를 타입에 반영했다.
- 고정 금액 `5,000 KRW` 대신 바우처의 실제 `reward_amount`를 표시한다.
- 만료일과 D-day를 함께 표시한다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

검증 결과:

- frontend typecheck 통과
- frontend lint 통과
- frontend test:utils 통과

남은 보완:

- 서버에 실제 redemption API와 QR/코드 사용 처리 추가
- Wallet 화면을 단순 모달에서 별도 화면으로 확장할지 결정
- 바우처 발급 직후 Compass 탭 badge/count를 전역 상태로 즉시 반영할지 검토

## 완료: 바우처 사용 완료 처리 1차

적용 파일:

- `backend/app/routers/vouchers.py`
- `backend/app/services/voucher_service.py`
- `frontend/src/services/api.ts`
- `frontend/src/app/compass.tsx`
- `frontend/src/components/voucher/VoucherWalletModal.tsx`

완료 내용:

- `POST /vouchers/{voucher_id}/redeem` API를 추가했다.
- 서버는 현재 로그인 사용자의 바우처인지 확인한 뒤 사용 완료 처리한다.
- 이미 사용 완료된 바우처는 중복 호출해도 기존 상태를 반환한다.
- 만료된 바우처는 사용 완료 처리하지 않고 오류를 반환한다.
- 프론트 API 클라이언트에 `redeemVoucher`를 추가했다.
- Wallet 모달의 사용 가능 바우처 카드에 `사용 완료 처리` 버튼을 추가했다.
- 사용 완료 처리 전 확인 Alert를 표시해 실수로 누르는 위험을 줄였다.
- 처리 성공 시 지갑 목록의 해당 바우처를 즉시 사용 완료 상태로 갱신한다.

검증:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:utils
```

```powershell
$env:PYTHONPATH='backend'; .\venv\Scripts\python.exe -m unittest discover -s backend\tests
.\venv\Scripts\python.exe -m compileall -f backend\app backend\alembic
```

검증 결과:

- frontend typecheck 통과
- frontend lint 통과
- frontend test:utils 통과
- backend unittest 31개 통과
- backend compileall 통과

남은 보완:

- 제휴처/머천트 계정 권한 모델 추가
- QR 스캔 기반 코드 검증 및 merchant redemption API 분리
- 사용 완료 시각, 사용 매장, 정산 상태를 저장하는 DB 컬럼/테이블 추가
- 실제 운영에서는 사용자 자가 처리보다 가맹점 승인 흐름을 우선 적용해야 한다.
