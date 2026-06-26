from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import SocialLoginRequest, Token, UserResponse
from ..core.security import create_access_token
from ..api.deps import get_current_user
from ..services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/social-login", response_model=Token)
async def social_login(payload: SocialLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate or register a user using an OAuth ID Token (Google or Apple)."""
    user = await auth_service.authenticate_social(db, payload.id_token, payload.provider)
    return {"access_token": create_access_token(subject=str(user.id)), "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the profile of the currently authenticated user."""
    return current_user
