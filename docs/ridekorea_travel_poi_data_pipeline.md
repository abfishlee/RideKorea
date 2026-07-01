# RideKorea Travel POI Data Pipeline

작성일: 2026-06-30

## 목적

외부 공공데이터, 제휴 데이터, 운영자가 정리한 CSV/JSON 파일을 `travel_pois` 테이블로 안정적으로 적재한다.

실제 운영 데이터는 반드시 [POI Data Sources and License Register](./ridekorea_poi_data_sources_and_licenses.md)를 먼저 통과해야 한다. 출처, 라이선스, 상업적 이용 가능 여부, 출처표시 문구가 확인되지 않은 데이터는 임포트하지 않는다.

## 지원 파일

- POI 본문: CSV 또는 JSON
- 라이선스 검수 sidecar: CSV 또는 JSON
- CSV 인코딩: UTF-8 또는 UTF-8 BOM
- JSON 형태: 배열 또는 `{ "items": [...] }`

## POI 본문 필드

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `external_id` | 필수 | 원천 데이터의 안정적인 고유 ID. `source + external_id` 기준으로 upsert한다. |
| `source` | 선택 | 데이터 출처. 없으면 CLI의 `--source` 값이 들어간다. |
| `name` | 필수 | 한국어 이름 |
| `name_en` | 선택 | 영어 이름. 없으면 `name`으로 대체한다. |
| `category` | 필수 | `repair`, `food`, `lodging`, `scenic`, `transport`, `culture` 중 하나 |
| `lat` | 필수 | 위도 |
| `lng` | 필수 | 경도 |
| `description` | 선택 | 한국어 설명 |
| `description_en` | 선택 | 영어 설명 |
| `address` | 선택 | 주소 |
| `phone` | 선택 | 전화번호 |
| `is_active` | 선택 | `true/false`, `1/0`, `yes/no`, `active/inactive` |

## Transport POI 확장 필드

`category=transport`인 행은 아래 필드를 함께 넣을 수 있다. 공항, 철도, 버스, 여객선 등 자전거 이동 규정이 바뀔 수 있는 데이터는 `retrieved_at`과 공식 `source_url`을 반드시 함께 관리한다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `transport_mode` | 선택 | `airport`, `rail`, `bus`, `ferry`, `taxi`, `transfer` 등 |
| `route_name` | 선택 | 노선, 터미널, 출발지-도착지 이름 |
| `bike_policy` | 선택 | 한국어 자전거 반입/포장/탑승 규정 요약 |
| `bike_policy_en` | 선택 | 영어 규정 요약 |
| `packing_required` | 선택 | 자전거 포장 필요 여부 |
| `packing_notes` | 선택 | 한국어 포장/대형수하물/조립 공간 메모 |
| `packing_notes_en` | 선택 | 영어 포장 메모 |
| `booking_url` | 선택 | 공식 예약 또는 규정 안내 URL |

## 라이선스 Sidecar 필드

sidecar 파일은 `source + external_id`로 POI 본문 행과 연결된다. `--license-sidecar`를 사용하면 본문 행의 라이선스 메타데이터보다 sidecar 값이 우선한다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `external_id` | 필수 | POI 본문 행과 매칭되는 ID |
| `source` | 선택 | POI 본문 행과 매칭되는 출처. 없으면 CLI의 `--source` 값 사용 |
| `source_url` | 필수 | 원천 데이터셋 또는 공식 안내 페이지 URL |
| `source_name` | 필수 | 제공기관 또는 데이터셋 이름 |
| `license_type` | 필수 | 예: KOGL-0, KOGL-1, partner-contract, user-generated |
| `commercial_use_allowed` | 필수 | `approved` 행은 반드시 true |
| `derivative_allowed` | 필수 | `approved` 행은 반드시 true |
| `attribution` | 조건부 필수 | 앱에 표시할 출처표시 문구 |
| `retrieved_at` | 조건부 필수 | `approved` 행은 반드시 ISO-8601 날짜/시간 필요 |
| `review_status` | 필수 | `approved`, `needs-review`, `rejected` 중 하나 |

`review_status=approved`가 아니거나 sidecar 행이 없는 POI는 임포트 단계에서 skip된다.

## 실행

백엔드 디렉터리에서 실행한다.

POI 본문만 검증:

```bash
python -m app.import_travel_pois ../docs/samples/travel_pois_sample.csv --source demo --dry-run
```

라이선스 sidecar까지 함께 검증:

```bash
python -m app.import_travel_pois ../docs/samples/travel_pois_sample.csv --source demo --license-sidecar ../docs/samples/travel_poi_license_reviews_sample.csv --dry-run
```

검증 후 실제 저장:

```bash
python -m app.import_travel_pois ../docs/samples/travel_pois_sample.csv --source demo --license-sidecar ../docs/samples/travel_poi_license_reviews_sample.csv
```

## 정제 원칙

- 좌표가 없거나 범위를 벗어나면 적재하지 않는다.
- 카테고리가 허용 목록에 없으면 적재하지 않는다.
- `external_id`가 없으면 중복 갱신 기준이 없으므로 적재하지 않는다.
- sidecar를 사용하는 경우 `source + external_id`에 맞는 검수 행이 없으면 적재하지 않는다.
- `approved` 검수 행은 상업적 이용과 파생 이용이 모두 가능해야 한다.
- 기존 POI의 추천/주의 카운트와 사용자 피드백은 보존하고, 장소 기본 정보만 갱신한다.
- 공공누리 제2유형, 제4유형처럼 상업적 이용이 제한된 데이터는 기본적으로 운영 DB에 적재하지 않는다.
- 제3자 권리가 포함될 수 있는 사진, 상세 리뷰, 지도 제공사 검색 결과는 별도 허락 없이 저장하지 않는다.

## 운영 흐름

1. 데이터 후보를 고른다.
2. 라이선스 레지스터에 출처, 이용허락, 출처표시, 수집일을 기록한다.
3. POI 본문 CSV/JSON을 정규화한다.
4. 라이선스 sidecar CSV/JSON을 작성한다.
5. 운영자가 승인 가능한 행만 `review_status=approved`로 둔다.
6. `--dry-run`으로 본문과 sidecar를 함께 검증한다.
7. 실제 DB에 적재한다.
8. 샘플 지도 화면에서 좌표, 이름, 카테고리, 상세 액션, 출처표시를 확인한다.

## 다음 확장

- 운영자 검수 화면에서 sidecar 파일 없이 승인, 숨김, 폐업, 위험 신고 처리
- POI 데이터셋별 갱신 배치 스케줄러
- 데이터 출처별 품질 점수와 오류 신고 통계
