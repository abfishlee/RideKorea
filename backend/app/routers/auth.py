from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User
from ..schemas import SocialLoginRequest, Token, UserResponse
from ..auth import verify_google_token, verify_apple_token, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/social-login", response_model=Token)
async def social_login(payload: SocialLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate or register a user using an OAuth ID Token (Google or Apple)."""
    # 1. Verify token with provider
    if payload.provider == "google":
        user_info = verify_google_token(payload.id_token)
    elif payload.provider == "apple":
        user_info = verify_apple_token(payload.id_token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported login provider"
        )
    
    social_id = user_info.get("sub")
    email = user_info.get("email")
    display_name = user_info.get("name")
    profile_photo_url = user_info.get("picture")

    if not social_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user info from social provider"
        )

    # 2. Check if user already exists
    result = await db.execute(select(User).where(User.social_id == social_id))
    user = result.scalars().first()

    if not user:
        # Create new user
        user = User(
            social_id=social_id,
            provider=payload.provider,
            email=email,
            display_name=display_name,
            profile_photo_url=profile_photo_url
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update user profile information if changed
        user.email = email
        if display_name:
            user.display_name = display_name
        if profile_photo_url:
            user.profile_photo_url = profile_photo_url
        await db.commit()
        await db.refresh(user)

    # 3. Create access token
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the profile of the currently authenticated user."""
    return current_user
