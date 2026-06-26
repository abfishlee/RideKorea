"""Backward-compatibility shim.

Authentication concerns were split into dedicated modules:
  - app.core.security      -> JWT create/decode (``create_access_token``)
  - app.services.oauth     -> provider verification (Google/Apple/...)
  - app.api.deps           -> ``get_current_user`` FastAPI dependency

This module re-exports the previously public names so any lingering
``from app.auth import ...`` imports keep working. Prefer importing from the
modules above in new code.
"""
from .core.security import create_access_token  # noqa: F401
from .api.deps import get_current_user, oauth2_scheme  # noqa: F401
from .services.oauth import get_verifier


def _verify(provider: str, token: str) -> dict:
    user = get_verifier(provider).verify(token)
    return {
        "sub": user.social_id,
        "email": user.email,
        "name": user.display_name,
        "picture": user.profile_photo_url,
    }


def verify_google_token(token: str) -> dict:
    """Deprecated: use ``app.services.oauth.get_verifier('google').verify``."""
    return _verify("google", token)


def verify_apple_token(token: str) -> dict:
    """Deprecated: use ``app.services.oauth.get_verifier('apple').verify``."""
    return _verify("apple", token)
