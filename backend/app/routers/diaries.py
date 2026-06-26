from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import SpotDiaryResponse, SpotDiaryCreate, SpotDiaryFeedResponse
from ..api.deps import get_current_user
from ..services import diary_service

router = APIRouter(prefix="/diaries", tags=["Spot Diaries"])


@router.post("/", response_model=SpotDiaryResponse, status_code=status.HTTP_201_CREATED)
async def create_diary(
    payload: SpotDiaryCreate,
    journey_id: UUID = Query(..., description="Associated journey ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Write a new spot diary entry (notes/photos) during a journey.

    Issues a regional voucher automatically if the spot is voucher-active.
    """
    return await diary_service.create_diary(db, current_user, journey_id, payload)


@router.post("/upload-photos", response_model=List[str])
async def upload_photos(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload images for a diary entry and return relative URLs."""
    return await diary_service.save_photos(files)


@router.get("/public", response_model=List[SpotDiaryResponse])
async def list_public_diaries_in_map_bounds(
    min_lat: float = Query(..., description="Minimum bounding latitude"),
    min_lng: float = Query(..., description="Minimum bounding longitude"),
    max_lat: float = Query(..., description="Maximum bounding latitude"),
    max_lng: float = Query(..., description="Maximum bounding longitude"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve public diaries within the map's current bounding box coordinates."""
    return await diary_service.list_public_in_bounds(db, min_lat, min_lng, max_lat, max_lng)


@router.get("/spot/{spot_id}", response_model=List[SpotDiaryFeedResponse])
async def get_spot_public_diaries(spot_id: UUID, db: AsyncSession = Depends(get_db)):
    """Retrieve public diaries with author profile info for a specific certification spot."""
    return await diary_service.get_spot_public_diaries(db, spot_id)
