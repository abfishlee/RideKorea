from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.deps import get_current_user, get_optional_current_user
from ..database import get_db
from ..models import User
from ..schemas import (
    TravelPoiCreate,
    TravelPoiFeedbackRequest,
    TravelPoiFeedbackResponse,
    TravelPoiReportCreate,
    TravelPoiReportResponse,
    TravelPoiResponse,
)
from ..services import travel_poi_service

router = APIRouter(prefix="/travel-pois", tags=["Travel POIs"])


@router.get("/", response_model=List[TravelPoiResponse])
async def list_travel_pois_in_bounds(
    min_lat: float = Query(..., description="Minimum bounding latitude"),
    min_lng: float = Query(..., description="Minimum bounding longitude"),
    max_lat: float = Query(..., description="Maximum bounding latitude"),
    max_lng: float = Query(..., description="Maximum bounding longitude"),
    category: Optional[str] = Query(None, description="Optional POI category filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """List active travel POIs inside the current map viewport."""
    return await travel_poi_service.list_in_bounds(
        db,
        min_lat,
        min_lng,
        max_lat,
        max_lng,
        category,
        current_user,
    )


@router.get("/nearby", response_model=List[TravelPoiResponse])
async def find_nearby_travel_pois(
    lat: float = Query(..., description="Latitude coordinate"),
    lng: float = Query(..., description="Longitude coordinate"),
    radius_meters: float = Query(5000.0, ge=1, le=50000, description="Search radius in meters"),
    category: Optional[str] = Query(None, description="Optional POI category filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Find active travel POIs near a coordinate."""
    return await travel_poi_service.find_nearby(
        db,
        lat,
        lng,
        radius_meters,
        category,
        current_user,
    )


@router.post("/{poi_id}/feedback", response_model=TravelPoiFeedbackResponse)
async def set_travel_poi_feedback(
    poi_id: UUID,
    payload: TravelPoiFeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle the current user's recommendation/caution feedback for a POI."""
    feedback_type, poi = await travel_poi_service.set_feedback(
        db,
        current_user,
        poi_id,
        payload.feedback_type,
    )
    return TravelPoiFeedbackResponse(feedback_type=feedback_type, poi=poi)


@router.post("/{poi_id}/reports", response_model=TravelPoiReportResponse)
async def create_travel_poi_report(
    poi_id: UUID,
    payload: TravelPoiReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Report a POI issue such as closure, wrong location, or danger."""
    return await travel_poi_service.create_report(db, current_user, poi_id, payload)


@router.post("/", response_model=TravelPoiResponse, include_in_schema=False)
async def create_travel_poi(payload: TravelPoiCreate, db: AsyncSession = Depends(get_db)):
    """Create a POI for seed/admin workflows."""
    return await travel_poi_service.create_poi(db, payload)
