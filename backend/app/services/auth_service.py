"""Authentication domain logic: social login -> user upsert."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import User
from ..core.exceptions import ValidationError
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
    return user
