"""Reusable FastAPI dependencies (authentication / authorization)."""
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import User
from ..core.security import decode_access_token
from ..core.exceptions import UnauthorizedError, PermissionDeniedError

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/social-login", auto_error=False
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the bearer JWT."""
    user_id = decode_access_token(token)
    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalars().first()
    if user is None:
        raise UnauthorizedError()
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Authorize an admin user.

    Admins are identified by an email allowlist (``settings.ADMIN_EMAILS``).
    For MVP parity, when the allowlist is empty any authenticated user is treated
    as admin -- set ADMIN_EMAILS in the environment to lock the admin panel down
    for production. (Roadmap: replace with a proper role/RBAC model.)
    """
    if settings.ADMIN_EMAILS and current_user.email not in settings.ADMIN_EMAILS:
        raise PermissionDeniedError("Admin privileges required")
    return current_user
