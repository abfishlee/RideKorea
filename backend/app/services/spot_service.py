"""Spot domain logic and data access (PostGIS-backed)."""
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Spot, VoucherConfig
from ..schemas import SpotResponse, SpotCreate
from ..core.geo import geojson_to_latlng_dict, latlng_to_point_wkt


# Common projection: every spot row carries its location (as GeoJSON) plus the
# joined voucher activation state so the map can render the 🎁 badge in one pass.
def _spot_query():
    return select(
        Spot,
        func.ST_AsGeoJSON(Spot.location).label("location_geojson"),
        VoucherConfig.is_active,
        VoucherConfig.reward_amount,
    ).outerjoin(VoucherConfig, Spot.id == VoucherConfig.spot_id)


def _to_response(spot: Spot, geojson_str: str, is_active, amount) -> SpotResponse:
    return SpotResponse(
        id=spot.id,
        course_id=spot.course_id,
        name=spot.name,
        name_en=spot.name_en,
        type=spot.type,
        location=geojson_to_latlng_dict(geojson_str),
        description=spot.description,
        description_en=spot.description_en,
        is_voucher_active=bool(is_active),
        voucher_amount=amount or 0,
        created_at=spot.created_at,
    )


async def list_spots(db: AsyncSession, course_id: Optional[UUID] = None) -> list[SpotResponse]:
    query = _spot_query()
    if course_id:
        query = query.where(Spot.course_id == course_id)
    rows = (await db.execute(query)).all()
    return [_to_response(r[0], r[1], r[2], r[3]) for r in rows]


async def find_nearby(
    db: AsyncSession, lat: float, lng: float, radius_meters: float
) -> list[SpotResponse]:
    point = func.ST_GeographyFromText(latlng_to_point_wkt(lat, lng))
    query = (
        _spot_query()
        .where(func.ST_DWithin(Spot.location, point, radius_meters))
        .order_by(func.ST_Distance(Spot.location, point))
    )
    rows = (await db.execute(query)).all()
    return [_to_response(r[0], r[1], r[2], r[3]) for r in rows]


async def create_spot(db: AsyncSession, payload: SpotCreate) -> SpotResponse:
    new_spot = Spot(
        course_id=payload.course_id,
        name=payload.name,
        name_en=payload.name_en,
        type=payload.type,
        location=func.ST_GeographyFromText(
            latlng_to_point_wkt(payload.location.lat, payload.location.lng)
        ),
        description=payload.description,
        description_en=payload.description_en,
    )
    db.add(new_spot)
    await db.commit()

    query = select(
        Spot, func.ST_AsGeoJSON(Spot.location).label("location_geojson")
    ).where(Spot.id == new_spot.id)
    spot, location_geojson = (await db.execute(query)).first()
    return _to_response(spot, location_geojson, False, 0)
