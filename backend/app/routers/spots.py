import json
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models import Spot, VoucherConfig
from ..schemas import SpotResponse, SpotCreate

router = APIRouter(prefix="/spots", tags=["Spots"])

def parse_spot_location(spot: Spot, geojson_str: str, is_active: bool = False, amount: int = 0) -> SpotResponse:
    """Parse PostGIS Point GeoJSON representation into Lat/Lng response schema."""
    loc_dict = json.loads(geojson_str)
    # GeoJSON coordinates are in [longitude, latitude] format
    coords = loc_dict.get("coordinates", [0.0, 0.0])
    return SpotResponse(
        id=spot.id,
        course_id=spot.course_id,
        name=spot.name,
        name_en=spot.name_en,
        type=spot.type,
        location={"lat": coords[1], "lng": coords[0]},
        description=spot.description,
        description_en=spot.description_en,
        is_voucher_active=is_active,
        voucher_amount=amount,
        created_at=spot.created_at
    )


@router.get("/", response_model=List[SpotResponse])
async def list_spots(
    course_id: Optional[UUID] = None, 
    db: AsyncSession = Depends(get_db)
):
    """List spots, optionally filtered by a specific course."""
    query = select(
        Spot,
        func.ST_AsGeoJSON(Spot.location).label("location_geojson"),
        VoucherConfig.is_active,
        VoucherConfig.reward_amount
    ).outerjoin(
        VoucherConfig, Spot.id == VoucherConfig.spot_id
    )
    if course_id:
        query = query.where(Spot.course_id == course_id)
        
    result = await db.execute(query)
    rows = result.all()
    
    return [parse_spot_location(row[0], row[1], row[2] or False, row[3] or 0) for row in rows]


@router.get("/nearby", response_model=List[SpotResponse])
async def find_nearby_spots(
    lat: float = Query(..., description="Latitude coordinate"),
    lng: float = Query(..., description="Longitude coordinate"),
    radius_meters: float = Query(5000.0, description="Search radius in meters"),
    db: AsyncSession = Depends(get_db)
):
    """Find spots within a specific radius of a coordinate using PostGIS."""
    # Point string format for PostGIS: 'POINT(lng lat)'
    point_wkt = f"POINT({lng} {lat})"
    
    # Select spots within the radius, ordering by distance
    query = select(
        Spot,
        func.ST_AsGeoJSON(Spot.location).label("location_geojson"),
        VoucherConfig.is_active,
        VoucherConfig.reward_amount
    ).outerjoin(
        VoucherConfig, Spot.id == VoucherConfig.spot_id
    ).where(
        func.ST_DWithin(
            Spot.location, 
            func.ST_GeographyFromText(point_wkt), 
            radius_meters
        )
    ).order_by(
        func.ST_Distance(
            Spot.location, 
            func.ST_GeographyFromText(point_wkt)
        )
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [parse_spot_location(row[0], row[1], row[2] or False, row[3] or 0) for row in rows]


@router.post("/", response_model=SpotResponse, include_in_schema=False)
async def create_spot(payload: SpotCreate, db: AsyncSession = Depends(get_db)):
    """Create a new spot (for seeding/admin purposes)."""
    # Create Point WKT string
    point_wkt = f"POINT({payload.location.lng} {payload.location.lat})"
    
    new_spot = Spot(
        course_id=payload.course_id,
        name=payload.name,
        name_en=payload.name_en,
        type=payload.type,
        # Convert WKT string to PostGIS Geography Point
        location=func.ST_GeographyFromText(point_wkt),
        description=payload.description,
        description_en=payload.description_en
    )
    
    db.add(new_spot)
    await db.commit()
    
    # Query back to serialize properly
    query = select(
        Spot,
        func.ST_AsGeoJSON(Spot.location).label("location_geojson")
    ).where(Spot.id == new_spot.id)
    
    result = await db.execute(query)
    spot, location_geojson = result.first()
    
    return parse_spot_location(spot, location_geojson)
