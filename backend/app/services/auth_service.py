"""Authentication domain logic: social login -> user upsert."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Course, Journey, JourneyTrackPoint, SpotDiary, User
from ..core.exceptions import ValidationError
from ..core.constants import JourneyStatus, Visibility
from ..core.geo import latlng_to_point_wkt
from .oauth import get_verifier


async def authenticate_social(db: AsyncSession, id_token: str, provider: str) -> User:
    """Verify a provider ID token, then create or update the matching user.

    The verifier is resolved from the provider registry, so this function never
    changes when new providers (Kakao, Naver, ...) are added.
    """
    verifier = get_verifier(provider)
    social_user = verifier.verify(id_token)

    if not social_user.social_id or not social_user.email:
        raise ValidationError("Invalid user info from social provider")

    user = (
        await db.execute(select(User).where(User.social_id == social_user.social_id))
    ).scalars().first()

    if not user:
        user = User(
            social_id=social_user.social_id,
            provider=provider,
            email=social_user.email,
            display_name=social_user.display_name,
            profile_photo_url=social_user.profile_photo_url,
        )
        db.add(user)
    else:
        user.email = social_user.email
        if social_user.display_name:
            user.display_name = social_user.display_name
        if social_user.profile_photo_url:
            user.profile_photo_url = social_user.profile_photo_url

    await db.commit()
    await db.refresh(user)
    return user


async def _ensure_dev_preview_data(db: AsyncSession, user: User) -> None:
    existing_journey = (
        await db.execute(select(Journey.id).where(Journey.user_id == user.id).limit(1))
    ).scalars().first()
    if existing_journey:
        return

    course_id = (
        await db.execute(select(Course.id).order_by(Course.created_at.asc()).limit(1))
    ).scalars().first()

    started_at = datetime.now(timezone.utc) - timedelta(days=2, hours=4)
    completed_at = started_at + timedelta(hours=3, minutes=18)
    journey = Journey(
        user_id=user.id,
        course_id=course_id,
        title="Dev Preview: Geumgang riverside ride",
        status=JourneyStatus.COMPLETED.value,
        visibility=Visibility.PRIVATE.value,
        started_at=started_at,
        completed_at=completed_at,
    )
    db.add(journey)
    await db.flush()

    sample_points = [
        (36.01370, 126.73450, 0, False),
        (36.05310, 126.78970, 38, False),
        (36.08960, 126.85030, 76, True),
        (36.12880, 126.91720, 114, False),
    ]
    db.add_all([
        JourneyTrackPoint(
            journey_id=journey.id,
            location=func.ST_GeographyFromText(latlng_to_point_wkt(lat, lng)),
            speed_kmh=18.4 + index,
            altitude_m=12 + index,
            is_off_route=is_off_route,
            recorded_at=started_at + timedelta(minutes=minutes),
        )
        for index, (lat, lng, minutes, is_off_route) in enumerate(sample_points)
    ])

    db.add(SpotDiary(
        journey_id=journey.id,
        user_id=user.id,
        location=func.ST_GeographyFromText(latlng_to_point_wkt(36.05310, 126.78970)),
        title="First riverside pause",
        diary_text="Development preview record for My Path cards, GPS summary, and diary preview.",
        photo_urls=[],
        visibility=Visibility.PRIVATE.value,
        visited_at=started_at + timedelta(minutes=42),
    ))

    await db.commit()


async def authenticate_dev_user(db: AsyncSession) -> User:
    """Create or update a stable local-development user.

    This is intentionally separate from social auth so production OAuth behavior
    remains untouched while local UI work can bypass external providers.
    """
    dev_social_id = "ridekorea-dev-user"
    dev_email = "dev@ridekorea.local"

    user = (
        await db.execute(select(User).where(User.social_id == dev_social_id))
    ).scalars().first()

    if not user:
        user = (
            await db.execute(select(User).where(User.email == dev_email))
        ).scalars().first()

    if not user:
        user = User(
            social_id=dev_social_id,
            provider="dev",
            email=dev_email,
            display_name="Dev Rider",
            profile_photo_url=None,
            preferred_language="ko",
        )
        db.add(user)
    else:
        user.social_id = dev_social_id
        user.provider = "dev"
        user.email = dev_email
        user.display_name = user.display_name or "Dev Rider"
        user.preferred_language = user.preferred_language or "ko"

    await db.commit()
    await db.refresh(user)
    await _ensure_dev_preview_data(db, user)
    return user
