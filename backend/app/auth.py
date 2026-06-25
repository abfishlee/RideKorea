from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .config import settings
from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/social-login", auto_error=False)

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT token for the user session."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"sub": str(subject), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_google_token(token: str) -> dict:
    """Verify Google OAuth2 ID Token."""
    # Development Bypass
    if token.startswith("dev-token-google"):
        user_num = token.split("-")[-1]
        return {
            "email": f"google_user_{user_num}@ridekorea.com",
            "sub": f"google_social_id_{user_num}",
            "name": f"Google Rider {user_num}",
            "picture": f"https://api.dicebear.com/7.x/bottts/svg?seed=google{user_num}"
        }

    try:
        id_info = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            audience=[
                settings.GOOGLE_CLIENT_ID_WEB, 
                settings.GOOGLE_CLIENT_ID_ANDROID,
                settings.GOOGLE_CLIENT_ID_IOS
            ]
        )
        return id_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token validation failed: {str(e)}"
        )


def verify_apple_token(token: str) -> dict:
    """Verify Apple OAuth2 ID Token."""
    # Development Bypass
    if token.startswith("dev-token-apple"):
        user_num = token.split("-")[-1]
        return {
            "email": f"apple_user_{user_num}@ridekorea.com",
            "sub": f"apple_social_id_{user_num}",
            "name": f"Apple Rider {user_num}",
            "picture": f"https://api.dicebear.com/7.x/bottts/svg?seed=apple{user_num}"
        }

    try:
        # Fetch Apple's public keys to verify signature
        apple_keys_url = "https://appleid.apple.com/auth/keys"
        res = requests.get(apple_keys_url)
        public_keys = res.json().get("keys", [])

        # Unverified decode to extract kid (Key ID)
        unverified_headers = jwt.get_unverified_header(token)
        kid = unverified_headers.get("kid")

        # Find key that matches kid
        key_to_use = None
        for key in public_keys:
            if key.get("kid") == kid:
                key_to_use = key
                break

        if not key_to_use:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Matching Apple public key not found"
            )

        # Full verification with signature checking
        decoded = jwt.decode(
            token,
            key_to_use,
            algorithms=["RS256"],
            audience=settings.APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com"
        )
        return decoded
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Apple token validation failed: {str(e)}"
        )


async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> User:
    """FastAPI dependency to retrieve the authenticated user from JWT header."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Query user from DB
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user
