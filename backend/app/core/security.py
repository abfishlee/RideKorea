"""JWT token creation and decoding.

Pure token mechanics, decoupled from FastAPI request handling and from the
OAuth provider verification. ``get_current_user`` lives in ``app.api.deps`` and
builds on ``decode_access_token`` here.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError

from ..config import settings
from .exceptions import UnauthorizedError


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT for the given subject (user id)."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"sub": str(subject), "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    """Decode a JWT and return the subject (user id).

    Raises ``UnauthorizedError`` if the token is missing, malformed, expired,
    or lacks a subject claim.
    """
    if not token:
        raise UnauthorizedError()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise UnauthorizedError()

    subject = payload.get("sub")
    if subject is None:
        raise UnauthorizedError()
    return subject
