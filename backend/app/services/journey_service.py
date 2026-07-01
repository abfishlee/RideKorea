"""Journey (riding record) domain logic and data access."""
from datetime import datetime, timezone
import math
from uuid import UUID

from sqlalchemy import cast, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from geoalchemy2 import Geography

from ..models import Course, Journey, JourneyTrackPoint, User
from ..schemas import (
    JourneyCreate,
    JourneyTrackBatchCreate,
    JourneyTrackPointResponse,
    JourneyTrackSummaryResponse,
    JourneyUpdate,
)
from ..core.geo import geojson_to_latlng_dict, latlng_to_point_wkt
from ..core.constants import JourneyStatus, Visibility
from ..core.exceptions import NotFoundError, PermissionDeniedError

OFF_ROUTE_THRESHOLD_METERS = 80
GPS_JUMP_THRESHOLD_KM = 1


async def create_journey(db: AsyncSession, user: User, payload: JourneyCreate) -> Journey:
    journey = Journey(
        user_id=user.id,
        course_id=payload.course_id,
        title=payload.title,
        status=JourneyStatus.PLANNING.value,
        visibility=payload.visibility,
    )
    db.add(journey)
    await db.commit()
    await db.refresh(journey)
    return journey


async def list_my_journeys(db: AsyncSession, user: User) -> list[Journey]:
    result = await db.execute(
        select(Journey)
        .options(selectinload(Journey.diaries))
        .where(Journey.user_id == user.id)
        .order_by(Journey.created_at.desc())
    )
    return result.scalars().all()


async def get_journey(db: AsyncSession, user: User, journey_id: UUID) -> Journey:
    result = await db.execute(
        select(Journey)
        .options(selectinload(Journey.diaries))
        .where(Journey.id == journey_id)
    )
    journey = result.scalars().first()
    if not journey:
        raise NotFoundError("Journey not found")
    # Only the owner may view a private journey.
    if journey.visibility == Visibility.PRIVATE.value and journey.user_id != user.id:
        raise PermissionDeniedError("You do not have permission to view this journey")
    return journey


def _apply_status_timestamps(journey: Journey, new_status: str) -> None:
    now = datetime.now(timezone.utc)
    if new_status == JourneyStatus.RIDING.value and journey.status != JourneyStatus.RIDING.value:
        journey.started_at = now
    elif new_status == JourneyStatus.COMPLETED.value and journey.status != JourneyStatus.COMPLETED.value:
        journey.completed_at = now


async def update_journey(
    db: AsyncSession, user: User, journey_id: UUID, payload: JourneyUpdate
) -> Journey:
    result = await db.execute(
        select(Journey)
        .options(selectinload(Journey.diaries))
        .where(Journey.id == journey_id, Journey.user_id == user.id)
    )
    journey = result.scalars().first()
    if not journey:
        raise NotFoundError("Journey not found or you do not have permission to modify it")

    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data:
        _apply_status_timestamps(journey, update_data["status"])
    for key, value in update_data.items():
        setattr(journey, key, value)

    await db.commit()
    await db.refresh(journey)
    return journey


async def add_track_points(
    db: AsyncSession,
    user: User,
    journey_id: UUID,
    payload: JourneyTrackBatchCreate,
) -> list[JourneyTrackPointResponse]:
    journey = await _get_owned_journey(db, user, journey_id)

    track_points = []
    for point in payload.points:
        point_wkt = latlng_to_point_wkt(point.location.lat, point.location.lng)
        is_off_route = point.is_off_route

        if journey.course_id:
            is_off_route = await _is_point_off_course(
                db,
                journey.course_id,
                point_wkt,
            )

        track_points.append(
            JourneyTrackPoint(
                journey_id=journey.id,
                location=func.ST_GeographyFromText(point_wkt),
                speed_kmh=point.speed_kmh,
                altitude_m=point.altitude_m,
                is_off_route=is_off_route,
                recorded_at=point.recorded_at,
            )
        )

    db.add_all(track_points)
    await db.commit()

    return await list_track_points(db, user, journey_id)


async def list_track_points(
    db: AsyncSession,
    user: User,
    journey_id: UUID,
) -> list[JourneyTrackPointResponse]:
    await _get_owned_journey(db, user, journey_id)

    result = await db.execute(
        select(
            JourneyTrackPoint,
            func.ST_AsGeoJSON(JourneyTrackPoint.location).label("location_geojson"),
        )
        .where(JourneyTrackPoint.journey_id == journey_id)
        .order_by(JourneyTrackPoint.recorded_at.asc())
    )

    responses: list[JourneyTrackPointResponse] = []
    for track_point, location_geojson in result.all():
        responses.append(
            JourneyTrackPointResponse(
                id=track_point.id,
                journey_id=track_point.journey_id,
                location=geojson_to_latlng_dict(location_geojson),
                speed_kmh=float(track_point.speed_kmh) if track_point.speed_kmh is not None else None,
                altitude_m=float(track_point.altitude_m) if track_point.altitude_m is not None else None,
                is_off_route=track_point.is_off_route,
                recorded_at=track_point.recorded_at,
                created_at=track_point.created_at,
            )
        )

    return responses


async def list_my_journey_summaries(
    db: AsyncSession,
    user: User,
) -> list[JourneyTrackSummaryResponse]:
    journey_result = await db.execute(
        select(Journey.id)
        .where(Journey.user_id == user.id)
        .order_by(Journey.created_at.desc())
    )
    journey_ids = list(journey_result.scalars().all())
    if not journey_ids:
        return []

    result = await db.execute(
        select(
            JourneyTrackPoint.journey_id,
            JourneyTrackPoint.recorded_at,
            JourneyTrackPoint.is_off_route,
            func.ST_AsGeoJSON(JourneyTrackPoint.location).label("location_geojson"),
        )
        .where(JourneyTrackPoint.journey_id.in_(journey_ids))
        .order_by(JourneyTrackPoint.journey_id.asc(), JourneyTrackPoint.recorded_at.asc())
    )

    grouped_points: dict[UUID, list[dict]] = {journey_id: [] for journey_id in journey_ids}
    for journey_id, recorded_at, is_off_route, location_geojson in result.all():
        grouped_points.setdefault(journey_id, []).append(
            {
                "location": geojson_to_latlng_dict(location_geojson),
                "recorded_at": recorded_at,
                "is_off_route": bool(is_off_route),
            }
        )

    return [
        _summarize_track_points(journey_id, grouped_points.get(journey_id, []))
        for journey_id in journey_ids
    ]


def _summarize_track_points(
    journey_id: UUID,
    points: list[dict],
) -> JourneyTrackSummaryResponse:
    if not points:
        return JourneyTrackSummaryResponse(journey_id=journey_id)

    sorted_points = sorted(points, key=lambda point: point["recorded_at"])
    distance_km = 0.0
    for index, point in enumerate(sorted_points):
        if index == 0:
            continue
        segment_km = _distance_km_between_locations(
            sorted_points[index - 1]["location"],
            point["location"],
        )
        if segment_km < GPS_JUMP_THRESHOLD_KM:
            distance_km += segment_km

    first_recorded_at = sorted_points[0]["recorded_at"]
    last_recorded_at = sorted_points[-1]["recorded_at"]
    duration_seconds = max(0, int((last_recorded_at - first_recorded_at).total_seconds()))

    return JourneyTrackSummaryResponse(
        journey_id=journey_id,
        distance_km=round(distance_km, 4),
        duration_seconds=duration_seconds,
        point_count=len(sorted_points),
        off_route_count=sum(1 for point in sorted_points if point["is_off_route"]),
    )


def _distance_km_between_locations(from_location: dict, to_location: dict) -> float:
    earth_radius_km = 6371
    d_lat = math.radians(to_location["lat"] - from_location["lat"])
    d_lng = math.radians(to_location["lng"] - from_location["lng"])
    lat1 = math.radians(from_location["lat"])
    lat2 = math.radians(to_location["lat"])
    a = (
        math.sin(d_lat / 2) * math.sin(d_lat / 2)
        + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) * math.sin(d_lng / 2)
    )
    return earth_radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _get_owned_journey(db: AsyncSession, user: User, journey_id: UUID) -> Journey:
    result = await db.execute(
        select(Journey).where(Journey.id == journey_id, Journey.user_id == user.id)
    )
    journey = result.scalars().first()
    if not journey:
        raise NotFoundError("Journey not found or you do not have permission to modify it")
    return journey


async def _is_point_off_course(db: AsyncSession, course_id: UUID, point_wkt: str) -> bool:
    point = func.ST_GeographyFromText(point_wkt)
    result = await db.execute(
        select(
            func.ST_DWithin(
                cast(Course.route_geometry, Geography),
                point,
                OFF_ROUTE_THRESHOLD_METERS,
            )
        ).where(Course.id == course_id)
    )
    is_near_course = result.scalar()
    return not bool(is_near_course)
