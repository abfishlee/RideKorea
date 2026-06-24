from datetime import datetime
from typing import List, Optional, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

# --- Location Schemas ---
class LocationSchema(BaseModel):
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")


# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    preferred_language: str = "en"

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class SocialLoginRequest(BaseModel):
    id_token: str = Field(..., description="OAuth 2.0 ID Token from Google or Apple")
    provider: str = Field(..., description="Social login provider: google or apple")


# --- Spot Schemas ---
class SpotBase(BaseModel):
    name: str
    name_en: str
    type: str
    description: Optional[str] = None
    description_en: Optional[str] = None

class SpotCreate(SpotBase):
    course_id: Optional[UUID] = None
    location: LocationSchema

class SpotResponse(SpotBase):
    id: UUID
    course_id: Optional[UUID] = None
    location: LocationSchema  # Reserialized to lat/lng format
    is_voucher_active: bool = False
    voucher_amount: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# --- Course Schemas ---
class CourseBase(BaseModel):
    name: str
    name_en: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    distance_km: float
    estimated_days_min: int
    estimated_days_max: int
    difficulty: str

class CourseCreate(CourseBase):
    route_geometry: Any # GeoJSON dict input

class CourseResponse(CourseBase):
    id: UUID
    route_geometry: Any # GeoJSON dict output
    created_at: datetime

    class Config:
        from_attributes = True

class CourseListResponse(CourseBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# --- Spot Diary Schemas ---
class SpotDiaryBase(BaseModel):
    diary_text: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    visibility: str = "private"

class SpotDiaryCreate(SpotDiaryBase):
    spot_id: Optional[UUID] = None
    visited_at: Optional[datetime] = None

class SpotDiaryResponse(SpotDiaryBase):
    id: UUID
    journey_id: UUID
    spot_id: Optional[UUID] = None
    user_id: UUID
    lat: Optional[float] = None
    lng: Optional[float] = None
    visited_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class DiaryAuthor(BaseModel):
    display_name: Optional[str] = None
    profile_photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class SpotDiaryFeedResponse(SpotDiaryBase):
    id: UUID
    journey_id: UUID
    spot_id: Optional[UUID] = None
    user_id: UUID
    visited_at: datetime
    created_at: datetime
    user: DiaryAuthor

    class Config:
        from_attributes = True


# --- Journey (Riding Record) Schemas ---
class JourneyBase(BaseModel):
    title: str
    status: str = "planning"
    visibility: str = "private"

class JourneyCreate(BaseModel):
    course_id: Optional[UUID] = None
    title: str
    visibility: str = "private"

class JourneyUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    visibility: Optional[str] = None

class JourneyResponse(JourneyBase):
    id: UUID
    user_id: UUID
    course_id: Optional[UUID] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    diaries: List[SpotDiaryResponse] = []

    class Config:
        from_attributes = True


# --- Voucher Schemas ---
class VoucherResponse(BaseModel):
    id: UUID
    user_id: UUID
    spot_id: UUID
    title: str
    title_en: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    code: str
    is_redeemed: bool
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


# --- Voucher Config Schemas ---
class VoucherConfigResponse(BaseModel):
    id: UUID
    spot_id: UUID
    is_active: bool
    reward_title: str
    reward_title_en: str
    reward_amount: int
    valid_days: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VoucherConfigUpsert(BaseModel):
    spot_id: UUID
    is_active: bool
    reward_title: str
    reward_title_en: str
    reward_amount: int = 5000
    valid_days: int = 90


class VoucherConfigAdminResponse(BaseModel):
    id: Optional[UUID] = None
    spot_id: UUID
    spot_name: str
    spot_name_en: str
    is_active: bool
    reward_title: str
    reward_title_en: str
    reward_amount: int
    valid_days: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
