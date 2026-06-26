"""Pluggable OAuth provider verification.

Each social provider implements :class:`OAuthVerifier` and registers itself in
``_REGISTRY``. The rest of the app only talks to ``get_verifier(provider)`` and
the normalized :class:`SocialUser` result, so adding Kakao / Naver later is a
matter of writing one verifier class and registering it -- no changes to the
auth service, routers, or schemas.

Each verifier keeps the existing development bypass: a token prefixed with
``dev-token-<provider>`` returns a deterministic mock identity so the app can be
exercised end-to-end before real OAuth client credentials are wired up.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

import requests
from jose import jwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from ..config import settings
from ..core.constants import AuthProvider
from ..core.exceptions import UnauthorizedError, ValidationError


@dataclass
class SocialUser:
    """Provider-agnostic identity returned by every verifier."""
    social_id: str
    email: Optional[str]
    display_name: Optional[str] = None
    profile_photo_url: Optional[str] = None


def _mock_identity(provider: str, token: str) -> SocialUser:
    """Deterministic dev identity derived from a ``dev-token-<provider>-<n>`` token."""
    user_num = token.split("-")[-1]
    return SocialUser(
        social_id=f"{provider}_social_id_{user_num}",
        email=f"{provider}_user_{user_num}@ridekorea.com",
        display_name=f"{provider.capitalize()} Rider {user_num}",
        profile_photo_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={provider}{user_num}",
    )


class OAuthVerifier(ABC):
    provider: AuthProvider
    dev_token_prefix: str  # e.g. "dev-token-google"

    def verify(self, token: str) -> SocialUser:
        if token.startswith(self.dev_token_prefix):
            return _mock_identity(self.provider.value, token)
        return self._verify_real(token)

    @abstractmethod
    def _verify_real(self, token: str) -> SocialUser:
        """Verify a real provider token. Raise UnauthorizedError on failure."""
        raise NotImplementedError


class GoogleVerifier(OAuthVerifier):
    provider = AuthProvider.GOOGLE
    dev_token_prefix = "dev-token-google"

    def _verify_real(self, token: str) -> SocialUser:
        try:
            info = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                audience=[
                    settings.GOOGLE_CLIENT_ID_WEB,
                    settings.GOOGLE_CLIENT_ID_ANDROID,
                    settings.GOOGLE_CLIENT_ID_IOS,
                ],
            )
        except Exception as e:  # noqa: BLE001 - normalize any verification failure
            raise UnauthorizedError(f"Google token validation failed: {e}")
        return SocialUser(
            social_id=info.get("sub"),
            email=info.get("email"),
            display_name=info.get("name"),
            profile_photo_url=info.get("picture"),
        )


class AppleVerifier(OAuthVerifier):
    provider = AuthProvider.APPLE
    dev_token_prefix = "dev-token-apple"
    _APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"
    _ISSUER = "https://appleid.apple.com"

    def _verify_real(self, token: str) -> SocialUser:
        try:
            public_keys = requests.get(self._APPLE_KEYS_URL, timeout=10).json().get("keys", [])
            kid = jwt.get_unverified_header(token).get("kid")
            key = next((k for k in public_keys if k.get("kid") == kid), None)
            if not key:
                raise UnauthorizedError("Matching Apple public key not found")
            decoded = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=settings.APPLE_CLIENT_ID,
                issuer=self._ISSUER,
            )
        except UnauthorizedError:
            raise
        except Exception as e:  # noqa: BLE001
            raise UnauthorizedError(f"Apple token validation failed: {e}")
        return SocialUser(
            social_id=decoded.get("sub"),
            email=decoded.get("email"),
            display_name=decoded.get("name"),
            profile_photo_url=decoded.get("picture"),
        )


# --- Provider registry -------------------------------------------------------
# To add a new provider: implement OAuthVerifier and append an instance here.
_REGISTRY: dict[str, OAuthVerifier] = {
    v.provider.value: v for v in (GoogleVerifier(), AppleVerifier())
}


def get_verifier(provider: str) -> OAuthVerifier:
    verifier = _REGISTRY.get(provider)
    if verifier is None:
        raise ValidationError(f"Unsupported login provider: {provider}")
    return verifier
