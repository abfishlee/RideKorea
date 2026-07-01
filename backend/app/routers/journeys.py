from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    JourneyResponse,
    JourneyCreate,
    JourneyTrackBatchCreate,
    JourneyTrackPointResponse,
    JourneyTrackSummaryResponse,
    JourneyUpdate,
)
from ..api.deps import get_current_user
from ..services import journey_service

router = APIRouter(prefix="/journeys", tags=["Journeys"])


@router.post("/", response_model=JourneyResponse, status_code=status.HTTP_201_CREATED)
async def create_journey(
    payload: JourneyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start or plan a new riding journey."""
    return await journey_service.create_journey(db, current_user, payload)


@router.get("/", response_model=List[JourneyResponse])
async def list_my_journeys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all journeys belonging to the authenticated user."""
    return await journey_service.list_my_journeys(db, current_user)


@router.get("/summaries", response_model=List[JourneyTrackSummaryResponse])
async def list_my_journey_summaries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return lightweight track summaries for all journeys belonging to the user."""
    return await journey_service.list_my_journey_summaries(db, current_user)


@router.get("/{journey_id}", response_model=JourneyResponse)
async def get_journey_detail(
    journey_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed information about a specific journey, including written diaries."""
    return await journey_service.get_journey(db, current_user, journey_id)


@router.patch("/{journey_id}", response_model=JourneyResponse)
async def update_journey(
    journey_id: UUID,
    payload: JourneyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a journey's title, status (e.g. riding, completed), or visibility."""
    return await journey_service.update_journey(db, current_user, journey_id, payload)


@router.post("/{journey_id}/track-points", response_model=List[JourneyTrackPointResponse])
async def add_track_points(
    journey_id: UUID,
    payload: JourneyTrackBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Append GPS track points recorded while riding a journey."""
    return await journey_service.add_track_points(db, current_user, journey_id, payload)


@router.get("/{journey_id}/track-points", response_model=List[JourneyTrackPointResponse])
async def list_track_points(
    journey_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List GPS track points for a journey in recorded order."""
    return await journey_service.list_track_points(db, current_user, journey_id)
