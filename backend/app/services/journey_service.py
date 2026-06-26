"""Journey (riding record) domain logic and data access."""
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Journey, User
from ..schemas import JourneyCreate, JourneyUpdate
from ..core.constants import JourneyStatus, Visibility
from ..core.exceptions import NotFoundError, PermissionDeniedError


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
        .where(Journey.user_id == user.id)
        .order_by(Journey.created_at.desc())
    )
    return result.scalars().all()


async def get_journey(db: AsyncSession, user: User, journey_id: UUID) -> Journey:
    result = await db.execute(select(Journey).where(Journey.id == journey_id))
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
        select(Journey).where(Journey.id == journey_id, Journey.user_id == user.id)
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
