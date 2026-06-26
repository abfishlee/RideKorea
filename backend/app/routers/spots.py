from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import SpotResponse, SpotCreate
from ..services import spot_service

router = APIRouter(prefix="/spots", tags=["Spots"])


@router.get("/", response_model=List[SpotResponse])
async def list_spots(course_id: Optional[UUID] = None, db: AsyncSession = Depends(get_db)):
    """List spots, optionally filtered by a specific course."""
    return await spot_service.list_spots(db, course_id)


@router.get("/nearby", response_model=List[SpotResponse])
async def find_nearby_spots(
    lat: float = Query(..., description="Latitude coordinate"),
    lng: float = Query(..., description="Longitude coordinate"),
    radius_meters: float = Query(5000.0, description="Search radius in meters"),
    db: AsyncSession = Depends(get_db),
):
    """Find spots within a specific radius of a coordinate using PostGIS."""
    return await spot_service.find_nearby(db, lat, lng, radius_meters)


@router.post("/", response_model=SpotResponse, include_in_schema=False)
async def create_spot(payload: SpotCreate, db: AsyncSession = Depends(get_db)):
    """Create a new spot (for seeding/admin purposes)."""
    return await spot_service.create_spot(db, payload)
