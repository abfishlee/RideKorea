"""Import and validate external travel POI datasets."""
from __future__ import annotations

import csv
import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from ..models import TravelPoi

TRAVEL_POI_CATEGORIES = {"repair", "food", "lodging", "scenic", "transport", "culture"}
TRAVEL_POI_REVIEW_STATUSES = {"approved", "needs-review", "rejected"}


@dataclass
class TravelPoiImportRow:
    name: str
    name_en: str
    category: str
    lat: float
    lng: float
    description: str | None = None
    description_en: str | None = None
    address: str | None = None
    phone: str | None = None
    source: str = "external"
    external_id: str | None = None
    source_url: str | None = None
    source_name: str | None = None
    license_type: str | None = None
    attribution: str | None = None
    retrieved_at: datetime | None = None
    review_status: str = "approved"
    transport_mode: str | None = None
    route_name: str | None = None
    bike_policy: str | None = None
    bike_policy_en: str | None = None
    packing_required: bool | None = None
    packing_notes: str | None = None
    packing_notes_en: str | None = None
    booking_url: str | None = None
    is_active: bool = True


@dataclass
class TravelPoiLicenseReview:
    source: str
    external_id: str
    source_url: str
    source_name: str
    license_type: str
    attribution: str | None = None
    retrieved_at: datetime | None = None
    review_status: str = "needs-review"


@dataclass
class TravelPoiImportIssue:
    row_number: int
    message: str


@dataclass
class TravelPoiImportResult:
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    issues: list[TravelPoiImportIssue] = field(default_factory=list)


def load_poi_rows(
    path: str | Path,
    default_source: str = "external",
    license_sidecar_path: str | Path | None = None,
) -> tuple[list[TravelPoiImportRow], list[TravelPoiImportIssue]]:
    file_path = Path(path)
    raw_rows = _load_raw_rows(file_path, "Travel POI import")

    rows: list[TravelPoiImportRow] = []
    issues: list[TravelPoiImportIssue] = []

    for index, raw_row in enumerate(raw_rows, start=1):
        try:
            rows.append(_normalize_row(raw_row, default_source))
        except ValueError as exc:
            issues.append(TravelPoiImportIssue(row_number=index, message=str(exc)))

    if license_sidecar_path:
        reviews, review_issues = load_license_reviews(license_sidecar_path, default_source)
        issues.extend(review_issues)
        _apply_license_reviews(rows, reviews, issues)

    return rows, issues


def load_license_reviews(
    path: str | Path,
    default_source: str = "external",
) -> tuple[list[TravelPoiLicenseReview], list[TravelPoiImportIssue]]:
    file_path = Path(path)
    raw_rows = _load_raw_rows(file_path, "Travel POI license review")

    reviews: list[TravelPoiLicenseReview] = []
    issues: list[TravelPoiImportIssue] = []

    for index, raw_row in enumerate(raw_rows, start=1):
        try:
            reviews.append(_normalize_license_review(raw_row, default_source))
        except ValueError as exc:
            issues.append(TravelPoiImportIssue(row_number=index, message=f"license sidecar: {exc}"))

    return reviews, issues


async def import_poi_rows(
    db: "AsyncSession",
    rows: list[TravelPoiImportRow],
    dry_run: bool = False,
) -> TravelPoiImportResult:
    from sqlalchemy import select

    from ..models import TravelPoi

    result = TravelPoiImportResult()

    for index, row in enumerate(rows, start=1):
        if row.review_status != "approved":
            result.skipped += 1
            result.issues.append(
                TravelPoiImportIssue(
                    row_number=index,
                    message="review_status must be approved before import",
                )
            )
            continue

        if not row.external_id:
            result.skipped += 1
            result.issues.append(
                TravelPoiImportIssue(
                    row_number=index,
                    message="external_id is required for stable upsert",
                )
            )
            continue

        existing = (
            await db.execute(
                select(TravelPoi).where(
                    TravelPoi.source == row.source,
                    TravelPoi.external_id == row.external_id,
                )
            )
        ).scalars().first()

        if existing:
            result.updated += 1
            if not dry_run:
                _apply_row(existing, row)
            continue

        result.inserted += 1
        if not dry_run:
            db.add(_create_poi(row))

    if not dry_run:
        await db.commit()

    return result


def _load_raw_rows(path: Path, label: str) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".csv":
        return _load_csv(path)
    if path.suffix.lower() == ".json":
        return _load_json(path)
    raise ValueError(f"{label} supports only .csv and .json files")


def _load_csv(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def _load_json(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("items"), list):
        return payload["items"]
    raise ValueError("JSON travel POI data must be an array or an object with an items array")


def _apply_license_reviews(
    rows: list[TravelPoiImportRow],
    reviews: list[TravelPoiLicenseReview],
    issues: list[TravelPoiImportIssue],
) -> None:
    review_by_key = {(review.source, review.external_id): review for review in reviews}

    for index, row in enumerate(rows, start=1):
        if not row.external_id:
            continue

        review = review_by_key.get((row.source, row.external_id))
        if not review:
            row.review_status = "needs-review"
            issues.append(
                TravelPoiImportIssue(
                    row_number=index,
                    message="license sidecar row is required for this source + external_id",
                )
            )
            continue

        row.source_url = review.source_url
        row.source_name = review.source_name
        row.license_type = review.license_type
        row.attribution = review.attribution
        row.retrieved_at = review.retrieved_at
        row.review_status = review.review_status


def _normalize_row(raw_row: dict[str, Any], default_source: str) -> TravelPoiImportRow:
    name = _required_text(raw_row, "name")
    name_en = _optional_text(raw_row, "name_en") or name
    category = _required_text(raw_row, "category")
    if category not in TRAVEL_POI_CATEGORIES:
        raise ValueError(f"category must be one of {sorted(TRAVEL_POI_CATEGORIES)}")

    lat = _required_float(raw_row, "lat")
    lng = _required_float(raw_row, "lng")
    if not -90 <= lat <= 90:
        raise ValueError("lat must be between -90 and 90")
    if not -180 <= lng <= 180:
        raise ValueError("lng must be between -180 and 180")

    review_status = _optional_text(raw_row, "review_status") or "approved"
    if review_status not in TRAVEL_POI_REVIEW_STATUSES:
        raise ValueError(f"review_status must be one of {sorted(TRAVEL_POI_REVIEW_STATUSES)}")

    return TravelPoiImportRow(
        name=name,
        name_en=name_en,
        category=category,
        lat=lat,
        lng=lng,
        description=_optional_text(raw_row, "description"),
        description_en=_optional_text(raw_row, "description_en"),
        address=_optional_text(raw_row, "address"),
        phone=_optional_text(raw_row, "phone"),
        source=_optional_text(raw_row, "source") or default_source,
        external_id=_optional_text(raw_row, "external_id"),
        source_url=_optional_text(raw_row, "source_url"),
        source_name=_optional_text(raw_row, "source_name"),
        license_type=_optional_text(raw_row, "license_type"),
        attribution=_optional_text(raw_row, "attribution"),
        retrieved_at=_optional_datetime(raw_row, "retrieved_at"),
        review_status=review_status,
        transport_mode=_optional_text(raw_row, "transport_mode"),
        route_name=_optional_text(raw_row, "route_name"),
        bike_policy=_optional_text(raw_row, "bike_policy"),
        bike_policy_en=_optional_text(raw_row, "bike_policy_en"),
        packing_required=_optional_bool(raw_row, "packing_required", False) if _optional_text(raw_row, "packing_required") is not None else None,
        packing_notes=_optional_text(raw_row, "packing_notes"),
        packing_notes_en=_optional_text(raw_row, "packing_notes_en"),
        booking_url=_optional_text(raw_row, "booking_url"),
        is_active=_optional_bool(raw_row, "is_active", True),
    )


def _normalize_license_review(raw_row: dict[str, Any], default_source: str) -> TravelPoiLicenseReview:
    source = _optional_text(raw_row, "source") or default_source
    external_id = _required_text(raw_row, "external_id")
    source_url = _required_text(raw_row, "source_url")
    source_name = _required_text(raw_row, "source_name")
    license_type = _required_text(raw_row, "license_type")
    retrieved_at = _optional_datetime(raw_row, "retrieved_at")
    review_status = _optional_text(raw_row, "review_status") or "needs-review"
    commercial_use_allowed = _optional_bool(raw_row, "commercial_use_allowed", False)
    derivative_allowed = _optional_bool(raw_row, "derivative_allowed", False)

    if review_status not in TRAVEL_POI_REVIEW_STATUSES:
        raise ValueError(f"review_status must be one of {sorted(TRAVEL_POI_REVIEW_STATUSES)}")

    if review_status == "approved":
        if not commercial_use_allowed:
            raise ValueError("approved rows require commercial_use_allowed=true")
        if not derivative_allowed:
            raise ValueError("approved rows require derivative_allowed=true")
        if not retrieved_at:
            raise ValueError("approved rows require retrieved_at")

    return TravelPoiLicenseReview(
        source=source,
        external_id=external_id,
        source_url=source_url,
        source_name=source_name,
        license_type=license_type,
        attribution=_optional_text(raw_row, "attribution"),
        retrieved_at=retrieved_at,
        review_status=review_status,
    )


def _create_poi(row: TravelPoiImportRow) -> "TravelPoi":
    from ..models import TravelPoi

    poi = TravelPoi()
    _apply_row(poi, row)
    return poi


def _apply_row(poi: "TravelPoi", row: TravelPoiImportRow) -> None:
    from geoalchemy2.shape import from_shape
    from shapely.geometry import Point

    poi.name = row.name
    poi.name_en = row.name_en
    poi.category = row.category
    poi.location = from_shape(Point(row.lng, row.lat), srid=4326)
    poi.description = row.description
    poi.description_en = row.description_en
    poi.address = row.address
    poi.phone = row.phone
    poi.source = row.source
    poi.external_id = row.external_id
    poi.source_url = row.source_url
    poi.source_name = row.source_name
    poi.license_type = row.license_type
    poi.attribution = row.attribution
    poi.retrieved_at = row.retrieved_at
    poi.review_status = row.review_status
    poi.transport_mode = row.transport_mode
    poi.route_name = row.route_name
    poi.bike_policy = row.bike_policy
    poi.bike_policy_en = row.bike_policy_en
    poi.packing_required = row.packing_required
    poi.packing_notes = row.packing_notes
    poi.packing_notes_en = row.packing_notes_en
    poi.booking_url = row.booking_url
    poi.is_active = row.is_active


def _required_text(raw_row: dict[str, Any], key: str) -> str:
    value = _optional_text(raw_row, key)
    if value is None:
        raise ValueError(f"{key} is required")
    return value


def _optional_text(raw_row: dict[str, Any], key: str) -> str | None:
    value = raw_row.get(key)
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def _required_float(raw_row: dict[str, Any], key: str) -> float:
    value = raw_row.get(key)
    if value is None or str(value).strip() == "":
        raise ValueError(f"{key} is required")
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{key} must be a number") from exc


def _optional_datetime(raw_row: dict[str, Any], key: str) -> datetime | None:
    value = _optional_text(raw_row, key)
    if value is None:
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError(f"{key} must be ISO-8601 datetime") from exc


def _optional_bool(raw_row: dict[str, Any], key: str, default: bool) -> bool:
    value = raw_row.get(key)
    if value is None or str(value).strip() == "":
        return default

    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "y", "active"}:
        return True
    if normalized in {"0", "false", "no", "n", "inactive"}:
        return False
    raise ValueError(f"{key} must be true or false")
