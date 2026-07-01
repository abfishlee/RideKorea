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


# --- Travel POI Schemas ---
class TravelPoiBase(BaseModel):
    name: str
    name_en: str
    category: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    external_id: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    license_type: Optional[str] = None
    attribution: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    review_status: str = "approved"
    transport_mode: Optional[str] = None
    route_name: Optional[str] = None
    bike_policy: Optional[str] = None
    bike_policy_en: Optional[str] = None
    packing_required: Optional[bool] = None
    packing_notes: Optional[str] = None
    packing_notes_en: Optional[str] = None
    booking_url: Optional[str] = None
    recommend_count: int = 0
    caution_count: int = 0
    my_feedback: Optional[str] = None
    is_active: bool = True


class TravelPoiCreate(TravelPoiBase):
    location: LocationSchema


class TravelPoiAdminUpdate(BaseModel):
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    license_type: Optional[str] = None
    attribution: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    review_status: Optional[str] = None
    transport_mode: Optional[str] = None
    route_name: Optional[str] = None
    bike_policy: Optional[str] = None
    bike_policy_en: Optional[str] = None
    packing_required: Optional[bool] = None
    packing_notes: Optional[str] = None
    packing_notes_en: Optional[str] = None
    booking_url: Optional[str] = None
    is_active: Optional[bool] = None


class TravelPoiResponse(TravelPoiBase):
    id: UUID
    location: LocationSchema
    created_at: datetime

    class Config:
        from_attributes = True


class TravelPoiFeedbackRequest(BaseModel):
    feedback_type: str = Field(..., pattern="^(recommend|caution)$")


class TravelPoiFeedbackResponse(BaseModel):
    feedback_type: Optional[str] = None
    poi: TravelPoiResponse


class TravelPoiReportCreate(BaseModel):
    report_type: str = Field(..., pattern="^(closed|wrong_location|danger|other)$")
    note: Optional[str] = Field(default=None, max_length=1000)


class TravelPoiReportUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|resolved|dismissed)$")


class TravelPoiReportAuthor(BaseModel):
    display_name: Optional[str] = None
    profile_photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class TravelPoiReportResponse(BaseModel):
    id: UUID
    poi_id: UUID
    user_id: UUID
    report_type: str
    note: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    poi: TravelPoiResponse
    author: TravelPoiReportAuthor

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
    title: Optional[str] = None
    diary_text: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    visibility: str = "private"

class SpotDiaryCreate(SpotDiaryBase):
    spot_id: Optional[UUID] = None
    source_shared_route_stop_id: Optional[UUID] = None
    location: Optional[LocationSchema] = None
    visited_at: Optional[datetime] = None


class SpotDiaryUpdate(BaseModel):
    visibility: Optional[str] = None

class SpotDiaryResponse(SpotDiaryBase):
    id: UUID
    journey_id: UUID
    spot_id: Optional[UUID] = None
    source_shared_route_stop_id: Optional[UUID] = None
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
    source_shared_route_stop_id: Optional[UUID] = None
    user_id: UUID
    lat: Optional[float] = None
    lng: Optional[float] = None
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
    source_shared_route_id: Optional[UUID] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    diaries: List[SpotDiaryResponse] = []

    class Config:
        from_attributes = True


# --- Journey Track Schemas ---
class JourneyTrackPointBase(BaseModel):
    location: LocationSchema
    speed_kmh: Optional[float] = None
    altitude_m: Optional[float] = None
    is_off_route: bool = False
    recorded_at: datetime


class JourneyTrackPointCreate(JourneyTrackPointBase):
    pass


class JourneyTrackBatchCreate(BaseModel):
    points: List[JourneyTrackPointCreate]


class JourneyTrackPointResponse(JourneyTrackPointBase):
    id: UUID
    journey_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class JourneyTrackSummaryResponse(BaseModel):
    journey_id: UUID
    distance_km: float = 0
    duration_seconds: int = 0
    point_count: int = 0
    off_route_count: int = 0


# --- Shared Route Schemas ---
class SharedRouteStopResponse(BaseModel):
    id: UUID
    shared_route_id: UUID
    source_diary_id: Optional[UUID] = None
    title: str
    body: Optional[str] = None
    location: Optional[LocationSchema] = None
    photo_urls: Optional[List[str]] = None
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class SharedRouteResponse(BaseModel):
    id: UUID
    user_id: UUID
    source_journey_id: Optional[UUID] = None
    title: str
    summary: Optional[str] = None
    start_name: Optional[str] = None
    end_name: Optional[str] = None
    visibility: str
    like_count: int = 0
    comment_count: int = 0
    share_count: int = 0
    liked_by_me: bool = False
    created_at: datetime
    author: Optional[DiaryAuthor] = None
    stops: List[SharedRouteStopResponse] = []

    class Config:
        from_attributes = True


class SharedRouteUpdate(BaseModel):
    visibility: Optional[str] = None


class SharedRouteCommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=1000)


class SharedRouteCommentResponse(BaseModel):
    id: UUID
    shared_route_id: UUID
    user_id: UUID
    body: str
    created_at: datetime
    author: DiaryAuthor

    class Config:
        from_attributes = True


class SharedRouteLikeResponse(BaseModel):
    liked: bool
    route: SharedRouteResponse


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
    redeemed_at: Optional[datetime] = None
    redeemed_by_user_id: Optional[UUID] = None
    redemption_source: Optional[str] = None
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class VoucherClaimRequest(BaseModel):
    spot_id: UUID
    location: LocationSchema
    radius_meters: float = Field(default=150.0, ge=10.0, le=1000.0)


class VoucherCodeRequest(BaseModel):
    code: str = Field(..., min_length=4, max_length=32)


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
