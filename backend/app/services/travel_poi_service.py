"""Travel POI domain logic for repair, food, lodging, scenic, transport, and culture data."""
from datetime import datetime, timezone
from typing import List
from uuid import UUID

from geoalchemy2 import Geometry
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions import NotFoundError, ValidationError
from ..core.geo import geojson_to_latlng_dict, latlng_to_point_wkt
from ..models import TravelPoi, TravelPoiFeedback, TravelPoiReport, User
from ..schemas import (
    TravelPoiAdminUpdate,
    TravelPoiCreate,
    TravelPoiReportCreate,
    TravelPoiReportResponse,
    TravelPoiResponse,
)

TRAVEL_POI_REVIEW_STATUSES = {"approved", "needs-review", "rejected"}
TRAVEL_POI_REPORT_STATUSES = {"open", "resolved", "dismissed"}


def _to_response(
    poi: TravelPoi,
    location_geojson: str | None,
    my_feedback: str | None = None,
) -> TravelPoiResponse:
    return TravelPoiResponse(
        id=poi.id,
        name=poi.name,
        name_en=poi.name_en,
        category=poi.category,
        location=geojson_to_latlng_dict(location_geojson),
        description=poi.description,
        description_en=poi.description_en,
        address=poi.address,
        phone=poi.phone,
        source=poi.source,
        external_id=poi.external_id,
        source_url=poi.source_url,
        source_name=poi.source_name,
        license_type=poi.license_type,
        attribution=poi.attribution,
        retrieved_at=poi.retrieved_at,
        review_status=poi.review_status,
        transport_mode=poi.transport_mode,
        route_name=poi.route_name,
        bike_policy=poi.bike_policy,
        bike_policy_en=poi.bike_policy_en,
        packing_required=poi.packing_required,
        packing_notes=poi.packing_notes,
        packing_notes_en=poi.packing_notes_en,
        booking_url=poi.booking_url,
        recommend_count=poi.recommend_count,
        caution_count=poi.caution_count,
        my_feedback=my_feedback,
        is_active=poi.is_active,
        created_at=poi.created_at,
    )


async def _get_feedback_type(db: AsyncSession, poi_id: UUID, user: User | None) -> str | None:
    if not user:
        return None

    feedback = (
        await db.execute(
            select(TravelPoiFeedback.feedback_type).where(
                TravelPoiFeedback.poi_id == poi_id,
                TravelPoiFeedback.user_id == user.id,
            )
        )
    ).scalars().first()
    return feedback


async def _get_poi_response(
    db: AsyncSession,
    poi_id: UUID,
    user: User | None = None,
) -> TravelPoiResponse:
    result = await db.execute(
        select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))
        .where(TravelPoi.id == poi_id, TravelPoi.is_active.is_(True))
    )
    row = result.first()
    if not row:
        raise NotFoundError("Travel POI not found")

    poi, location_geojson = row
    return _to_response(poi, location_geojson, await _get_feedback_type(db, poi.id, user))


def _apply_feedback_delta(poi: TravelPoi, feedback_type: str, delta: int) -> None:
    if feedback_type == "recommend":
        poi.recommend_count = max(0, (poi.recommend_count or 0) + delta)
        return

    if feedback_type == "caution":
        poi.caution_count = max(0, (poi.caution_count or 0) + delta)
        return

    raise ValidationError("Feedback type must be recommend or caution")


def _report_to_response(
    report: TravelPoiReport,
    poi: TravelPoi,
    location_geojson: str | None,
    author: User,
) -> TravelPoiReportResponse:
    return TravelPoiReportResponse(
        id=report.id,
        poi_id=report.poi_id,
        user_id=report.user_id,
        report_type=report.report_type,
        note=report.note,
        status=report.status,
        created_at=report.created_at,
        resolved_at=report.resolved_at,
        poi=_to_response(poi, location_geojson),
        author=author,
    )


async def list_in_bounds(
    db: AsyncSession,
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
    category: str | None = None,
    user: User | None = None,
) -> List[TravelPoiResponse]:
    query = (
        select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))
        .where(
            TravelPoi.is_active.is_(True),
            TravelPoi.review_status == "approved",
            func.ST_Contains(
                func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326),
                cast(TravelPoi.location, Geometry),
            ),
        )
        .order_by(TravelPoi.created_at.desc())
    )
    if category:
        query = query.where(TravelPoi.category == category)

    rows = (await db.execute(query)).all()
    return [
        _to_response(poi, location_geojson, await _get_feedback_type(db, poi.id, user))
        for poi, location_geojson in rows
    ]


async def find_nearby(
    db: AsyncSession,
    lat: float,
    lng: float,
    radius_meters: float = 5000.0,
    category: str | None = None,
    user: User | None = None,
) -> List[TravelPoiResponse]:
    reference = func.ST_GeographyFromText(latlng_to_point_wkt(lat, lng))
    query = (
        select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))
        .where(
            TravelPoi.is_active.is_(True),
            TravelPoi.review_status == "approved",
            func.ST_DWithin(TravelPoi.location, reference, radius_meters),
        )
        .order_by(func.ST_Distance(TravelPoi.location, reference).asc())
    )
    if category:
        query = query.where(TravelPoi.category == category)

    rows = (await db.execute(query)).all()
    return [
        _to_response(poi, location_geojson, await _get_feedback_type(db, poi.id, user))
        for poi, location_geojson in rows
    ]


async def admin_list(
    db: AsyncSession,
    review_status: str | None = None,
    category: str | None = None,
    source: str | None = None,
    is_active: bool | None = None,
    limit: int = 100,
) -> List[TravelPoiResponse]:
    query = select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))

    if review_status:
        query = query.where(TravelPoi.review_status == review_status)
    if category:
        query = query.where(TravelPoi.category == category)
    if source:
        query = query.where(TravelPoi.source == source)
    if is_active is not None:
        query = query.where(TravelPoi.is_active.is_(is_active))

    query = query.order_by(TravelPoi.created_at.desc()).limit(limit)
    rows = (await db.execute(query)).all()
    return [_to_response(poi, location_geojson) for poi, location_geojson in rows]


async def admin_update(
    db: AsyncSession,
    poi_id: UUID,
    payload: TravelPoiAdminUpdate,
) -> TravelPoiResponse:
    result = await db.execute(
        select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))
        .where(TravelPoi.id == poi_id)
    )
    row = result.first()
    if not row:
        raise NotFoundError("Travel POI not found")

    poi, _location_geojson = row
    updates = payload.model_dump(exclude_unset=True)

    next_review_status = updates.get("review_status")
    if next_review_status and next_review_status not in TRAVEL_POI_REVIEW_STATUSES:
        raise ValidationError("Review status must be approved, needs-review, or rejected")

    for field, value in updates.items():
        setattr(poi, field, value)

    await db.commit()
    await db.refresh(poi)

    result = await db.execute(
        select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))
        .where(TravelPoi.id == poi.id)
    )
    updated_poi, location_geojson = result.one()
    return _to_response(updated_poi, location_geojson)


async def create_poi(db: AsyncSession, payload: TravelPoiCreate) -> TravelPoiResponse:
    poi = TravelPoi(
        name=payload.name,
        name_en=payload.name_en,
        category=payload.category,
        location=func.ST_GeographyFromText(
            latlng_to_point_wkt(payload.location.lat, payload.location.lng)
        ),
        description=payload.description,
        description_en=payload.description_en,
        address=payload.address,
        phone=payload.phone,
        source=payload.source,
        external_id=payload.external_id,
        source_url=payload.source_url,
        source_name=payload.source_name,
        license_type=payload.license_type,
        attribution=payload.attribution,
        retrieved_at=payload.retrieved_at,
        review_status=payload.review_status,
        transport_mode=payload.transport_mode,
        route_name=payload.route_name,
        bike_policy=payload.bike_policy,
        bike_policy_en=payload.bike_policy_en,
        packing_required=payload.packing_required,
        packing_notes=payload.packing_notes,
        packing_notes_en=payload.packing_notes_en,
        booking_url=payload.booking_url,
        is_active=payload.is_active,
    )
    db.add(poi)
    await db.commit()
    await db.refresh(poi)
    result = await db.execute(
        select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))
        .where(TravelPoi.id == poi.id)
    )
    created_poi, location_geojson = result.one()
    return _to_response(created_poi, location_geojson)


async def create_report(
    db: AsyncSession,
    user: User,
    poi_id: UUID,
    payload: TravelPoiReportCreate,
) -> TravelPoiReportResponse:
    if payload.report_type not in {"closed", "wrong_location", "danger", "other"}:
        raise ValidationError("Report type must be closed, wrong_location, danger, or other")

    result = await db.execute(
        select(TravelPoi, func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"))
        .where(TravelPoi.id == poi_id)
    )
    row = result.first()
    if not row:
        raise NotFoundError("Travel POI not found")

    poi, location_geojson = row
    report = TravelPoiReport(
        poi_id=poi.id,
        user_id=user.id,
        report_type=payload.report_type,
        note=payload.note,
        status="open",
    )
    db.add(report)

    if poi.review_status == "approved":
        poi.review_status = "needs-review"

    await db.commit()
    await db.refresh(report)
    await db.refresh(poi)
    return _report_to_response(report, poi, location_geojson, user)


async def set_feedback(
    db: AsyncSession,
    user: User,
    poi_id: UUID,
    feedback_type: str,
) -> tuple[str | None, TravelPoiResponse]:
    if feedback_type not in {"recommend", "caution"}:
        raise ValidationError("Feedback type must be recommend or caution")

    result = await db.execute(select(TravelPoi).where(TravelPoi.id == poi_id, TravelPoi.is_active.is_(True)))
    poi = result.scalars().first()
    if not poi:
        raise NotFoundError("Travel POI not found")

    existing_feedback = (
        await db.execute(
            select(TravelPoiFeedback).where(
                TravelPoiFeedback.poi_id == poi.id,
                TravelPoiFeedback.user_id == user.id,
            )
        )
    ).scalars().first()

    if existing_feedback and existing_feedback.feedback_type == feedback_type:
        _apply_feedback_delta(poi, feedback_type, -1)
        await db.delete(existing_feedback)
        next_feedback_type = None
    elif existing_feedback:
        _apply_feedback_delta(poi, existing_feedback.feedback_type, -1)
        existing_feedback.feedback_type = feedback_type
        _apply_feedback_delta(poi, feedback_type, 1)
        next_feedback_type = feedback_type
    else:
        db.add(
            TravelPoiFeedback(
                poi_id=poi.id,
                user_id=user.id,
                feedback_type=feedback_type,
            )
        )
        _apply_feedback_delta(poi, feedback_type, 1)
        next_feedback_type = feedback_type

    await db.commit()
    return next_feedback_type, await _get_poi_response(db, poi.id, user)


async def admin_list_reports(
    db: AsyncSession,
    status: str | None = "open",
    report_type: str | None = None,
    limit: int = 100,
) -> List[TravelPoiReportResponse]:
    query = (
        select(
            TravelPoiReport,
            TravelPoi,
            func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"),
            User,
        )
        .join(TravelPoi, TravelPoiReport.poi_id == TravelPoi.id)
        .join(User, TravelPoiReport.user_id == User.id)
        .order_by(TravelPoiReport.created_at.desc())
        .limit(limit)
    )

    if status:
        query = query.where(TravelPoiReport.status == status)
    if report_type:
        query = query.where(TravelPoiReport.report_type == report_type)

    rows = (await db.execute(query)).all()
    return [
        _report_to_response(report, poi, location_geojson, author)
        for report, poi, location_geojson, author in rows
    ]


async def admin_update_report_status(
    db: AsyncSession,
    report_id: UUID,
    status: str,
) -> TravelPoiReportResponse:
    if status not in TRAVEL_POI_REPORT_STATUSES:
        raise ValidationError("Report status must be open, resolved, or dismissed")

    result = await db.execute(
        select(
            TravelPoiReport,
            TravelPoi,
            func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"),
            User,
        )
        .join(TravelPoi, TravelPoiReport.poi_id == TravelPoi.id)
        .join(User, TravelPoiReport.user_id == User.id)
        .where(TravelPoiReport.id == report_id)
    )
    row = result.first()
    if not row:
        raise NotFoundError("Travel POI report not found")

    report, poi, _location_geojson, author = row
    report.status = status
    report.resolved_at = datetime.now(timezone.utc) if status in {"resolved", "dismissed"} else None
    await db.commit()
    await db.refresh(report)

    result = await db.execute(
        select(
            TravelPoiReport,
            TravelPoi,
            func.ST_AsGeoJSON(TravelPoi.location).label("location_geojson"),
            User,
        )
        .join(TravelPoi, TravelPoiReport.poi_id == TravelPoi.id)
        .join(User, TravelPoiReport.user_id == User.id)
        .where(TravelPoiReport.id == report.id)
    )
    updated_report, updated_poi, location_geojson, updated_author = result.one()
    return _report_to_response(updated_report, updated_poi, location_geojson, updated_author)
