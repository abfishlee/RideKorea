"""Spot diary domain logic: writing entries, photo uploads, and public feeds."""
from typing import List
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select, cast, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geometry

from ..models import SpotDiary, SharedRouteStop, Spot, Journey, User
from ..schemas import SpotDiaryCreate
from ..core.constants import Visibility
from ..core.geo import geojson_to_latlng, latlng_to_point_wkt
from ..core.exceptions import NotFoundError, ValidationError
from . import voucher_service
from .storage import get_storage


async def create_diary(
    db: AsyncSession, user: User, journey_id: UUID, payload: SpotDiaryCreate
) -> SpotDiary:
    # 1. The diary may only be attached to a journey the user owns.
    journey = (
        await db.execute(
            select(Journey).where(Journey.id == journey_id, Journey.user_id == user.id)
        )
    ).scalars().first()
    if not journey:
        raise NotFoundError(
            "Journey not found or you do not have permission to add entries to it"
        )

    # 2. If a spot is referenced, it must exist.
    if payload.spot_id:
        spot = (
            await db.execute(select(Spot).where(Spot.id == payload.spot_id))
        ).scalars().first()
        if not spot:
            raise NotFoundError("Spot not found")

    if payload.source_shared_route_stop_id:
        shared_route_stop = (
            await db.execute(
                select(SharedRouteStop).where(
                    SharedRouteStop.id == payload.source_shared_route_stop_id,
                    SharedRouteStop.shared_route_id == journey.source_shared_route_id,
                )
            )
        ).scalars().first()
        if not shared_route_stop:
            raise NotFoundError("Imported route stop not found for this journey")

    # 3. Persist the diary entry.
    diary = SpotDiary(
        journey_id=journey_id,
        spot_id=payload.spot_id,
        source_shared_route_stop_id=payload.source_shared_route_stop_id,
        user_id=user.id,
        location=(
            func.ST_GeographyFromText(
                latlng_to_point_wkt(payload.location.lat, payload.location.lng)
            )
            if payload.location
            else None
        ),
        title=payload.title,
        diary_text=payload.diary_text,
        photo_urls=payload.photo_urls,
        visibility=payload.visibility,
    )
    if payload.visited_at:
        diary.visited_at = payload.visited_at

    db.add(diary)
    await db.commit()
    await db.refresh(diary)
    if payload.location:
        diary.lat = payload.location.lat
        diary.lng = payload.location.lng

    # 4. Issue a regional voucher if this spot is voucher-active.
    if diary.spot_id:
        await voucher_service.issue_for_diary(db, user.id, diary.spot_id)

    return diary


async def save_photos(files: List[UploadFile]) -> List[str]:
    storage = get_storage()
    return [storage.save_image(f.file, f.filename) for f in files]


async def update_diary_visibility(
    db: AsyncSession, user: User, diary_id: UUID, visibility: str
) -> SpotDiary:
    if visibility not in {Visibility.PRIVATE.value, Visibility.PUBLIC.value}:
        raise ValidationError("Visibility must be either private or public")

    diary = (
        await db.execute(
            select(SpotDiary).where(SpotDiary.id == diary_id, SpotDiary.user_id == user.id)
        )
    ).scalars().first()
    if not diary:
        raise NotFoundError("Diary not found")

    diary.visibility = visibility
    await db.commit()
    await db.refresh(diary)
    return diary


async def list_public_in_bounds(
    db: AsyncSession, min_lat: float, min_lng: float, max_lat: float, max_lng: float
) -> List[SpotDiary]:
    """Public diaries whose spot falls inside the current map viewport box."""
    diary_location = func.coalesce(Spot.location, SpotDiary.location)
    query = (
        select(SpotDiary, func.ST_AsGeoJSON(diary_location).label("location_geojson"))
        .outerjoin(Spot, SpotDiary.spot_id == Spot.id)
        .where(
            SpotDiary.visibility == Visibility.PUBLIC.value,
            diary_location.isnot(None),
            func.ST_Contains(
                func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326),
                cast(diary_location, Geometry),
            ),
        )
        .order_by(SpotDiary.created_at.desc())
    )

    rows = (await db.execute(query)).all()
    diaries: List[SpotDiary] = []
    for diary, geojson_str in rows:
        if geojson_str:
            diary.lat, diary.lng = geojson_to_latlng(geojson_str)
        diaries.append(diary)
    return diaries


async def list_recent_public(db: AsyncSession, limit: int = 30) -> List[SpotDiary]:
    """Latest public diary entries for the Moments feed."""
    diary_location = func.coalesce(Spot.location, SpotDiary.location)
    query = (
        select(SpotDiary, func.ST_AsGeoJSON(diary_location).label("location_geojson"))
        .options(selectinload(SpotDiary.user))
        .outerjoin(Spot, SpotDiary.spot_id == Spot.id)
        .where(SpotDiary.visibility == Visibility.PUBLIC.value)
        .order_by(SpotDiary.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(query)).all()
    diaries: List[SpotDiary] = []
    for diary, geojson_str in rows:
        if geojson_str:
            diary.lat, diary.lng = geojson_to_latlng(geojson_str)
        diaries.append(diary)
    return diaries


async def get_public_diary(db: AsyncSession, diary_id: UUID) -> SpotDiary:
    """Single public diary for deep-linking from Moments to the Journey map."""
    diary_location = func.coalesce(Spot.location, SpotDiary.location)
    query = (
        select(SpotDiary, func.ST_AsGeoJSON(diary_location).label("location_geojson"))
        .options(selectinload(SpotDiary.user))
        .outerjoin(Spot, SpotDiary.spot_id == Spot.id)
        .where(
            SpotDiary.id == diary_id,
            SpotDiary.visibility == Visibility.PUBLIC.value,
        )
    )
    row = (await db.execute(query)).first()
    if not row:
        raise NotFoundError("Public diary not found")

    diary, geojson_str = row
    if geojson_str:
        diary.lat, diary.lng = geojson_to_latlng(geojson_str)
    return diary


async def get_spot_public_diaries(db: AsyncSession, spot_id: UUID) -> List[SpotDiary]:
    """Public diaries (with author profile) for a single spot's story feed."""
    query = (
        select(SpotDiary)
        .options(selectinload(SpotDiary.user))
        .where(
            SpotDiary.spot_id == spot_id,
            SpotDiary.visibility == Visibility.PUBLIC.value,
        )
        .order_by(SpotDiary.created_at.desc())
    )
    return (await db.execute(query)).scalars().all()
