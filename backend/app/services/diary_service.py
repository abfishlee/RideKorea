"""Spot diary domain logic: writing entries, photo uploads, and public feeds."""
from typing import List
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select, cast, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geometry

from ..models import SpotDiary, Spot, Journey, User
from ..schemas import SpotDiaryCreate
from ..core.constants import Visibility
from ..core.geo import geojson_to_latlng
from ..core.exceptions import NotFoundError
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

    # 3. Persist the diary entry.
    diary = SpotDiary(
        journey_id=journey_id,
        spot_id=payload.spot_id,
        user_id=user.id,
        diary_text=payload.diary_text,
        photo_urls=payload.photo_urls,
        visibility=payload.visibility,
    )
    if payload.visited_at:
        diary.visited_at = payload.visited_at

    db.add(diary)
    await db.commit()
    await db.refresh(diary)

    # 4. Issue a regional voucher if this spot is voucher-active.
    if diary.spot_id:
        await voucher_service.issue_for_diary(db, user.id, diary.spot_id)

    return diary


async def save_photos(files: List[UploadFile]) -> List[str]:
    storage = get_storage()
    return [storage.save_image(f.file, f.filename) for f in files]


async def list_public_in_bounds(
    db: AsyncSession, min_lat: float, min_lng: float, max_lat: float, max_lng: float
) -> List[SpotDiary]:
    """Public diaries whose spot falls inside the current map viewport box."""
    query = (
        select(SpotDiary, func.ST_AsGeoJSON(Spot.location).label("location_geojson"))
        .join(Spot, SpotDiary.spot_id == Spot.id)
        .where(
            SpotDiary.visibility == Visibility.PUBLIC.value,
            func.ST_Contains(
                func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326),
                cast(Spot.location, Geometry),
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
