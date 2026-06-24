from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from ..database import get_db
from ..models import Journey, User
from ..schemas import JourneyResponse, JourneyCreate, JourneyUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/journeys", tags=["Journeys"])

@router.post("/", response_model=JourneyResponse, status_code=status.HTTP_201_CREATED)
async def create_journey(
    payload: JourneyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start or plan a new riding journey."""
    new_journey = Journey(
        user_id=current_user.id,
        course_id=payload.course_id,
        title=payload.title,
        status="planning",
        visibility=payload.visibility
    )
    
    db.add(new_journey)
    await db.commit()
    await db.refresh(new_journey)
    
    # Eager load relationships for response serialization
    result = await db.execute(
        select(Journey)
        .where(Journey.id == new_journey.id)
    )
    return result.scalars().first()


@router.get("/", response_model=List[JourneyResponse])
async def list_my_journeys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all journeys belonging to the authenticated user."""
    result = await db.execute(
        select(Journey)
        .where(Journey.user_id == current_user.id)
        .order_by(Journey.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{journey_id}", response_model=JourneyResponse)
async def get_journey_detail(
    journey_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific journey, including written diaries."""
    result = await db.execute(
        select(Journey)
        .where(Journey.id == journey_id)
    )
    journey = result.scalars().first()
    
    if not journey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journey not found"
        )
        
    # Check authorization (only owner can view private journeys)
    if journey.visibility == "private" and journey.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this journey"
        )
        
    return journey


@router.patch("/{journey_id}", response_model=JourneyResponse)
async def update_journey(
    journey_id: UUID,
    payload: JourneyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a journey's title, status (e.g. riding, completed), or visibility."""
    result = await db.execute(
        select(Journey)
        .where(Journey.id == journey_id, Journey.user_id == current_user.id)
    )
    journey = result.scalars().first()
    
    if not journey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journey not found or you do not have permission to modify it"
        )
    
    # Update fields dynamically
    update_data = payload.dict(exclude_unset=True)
    
    # Handle status changes to set timestamps
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == "riding" and journey.status != "riding":
            journey.started_at = datetime.utcnow()
        elif new_status == "completed" and journey.status != "completed":
            journey.completed_at = datetime.utcnow()
            
    for key, value in update_data.items():
        setattr(journey, key, value)
        
    await db.commit()
    await db.refresh(journey)
    
    return journey
