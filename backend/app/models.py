import uuid
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, Text, Boolean, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry, Geography
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    social_id = Column(String, unique=True, nullable=False, index=True)
    provider = Column(String, nullable=False) # 'google' or 'apple'
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    preferred_language = Column(String(5), default="en", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    journeys = relationship("Journey", back_populates="user", cascade="all, delete-orphan")
    diaries = relationship("SpotDiary", back_populates="user", cascade="all, delete-orphan")
    vouchers = relationship("Voucher", back_populates="user", cascade="all, delete-orphan")
    shared_routes = relationship("SharedRoute", back_populates="user", cascade="all, delete-orphan")
    shared_route_comments = relationship("SharedRouteComment", back_populates="user", cascade="all, delete-orphan")
    shared_route_likes = relationship("SharedRouteLike", back_populates="user", cascade="all, delete-orphan")
    travel_poi_feedback = relationship("TravelPoiFeedback", back_populates="user", cascade="all, delete-orphan")
    travel_poi_reports = relationship("TravelPoiReport", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    distance_km = Column(Numeric(5, 2), nullable=False)
    estimated_days_min = Column(Integer, nullable=False)
    estimated_days_max = Column(Integer, nullable=False)
    difficulty = Column(String(10), nullable=False) # 'easy', 'medium', 'hard'
    
    # PostGIS Geometry: LineString coordinate path
    route_geometry = Column(Geometry(geometry_type="LINESTRING", srid=4326), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    spots = relationship("Spot", back_populates="course", cascade="all, delete-orphan")
    journeys = relationship("Journey", back_populates="course")


class Spot(Base):
    __tablename__ = "spots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    type = Column(String(30), nullable=False) # 'certification_center', 'bicycle_shop', etc.
    
    # PostGIS Geography: Point coordinate
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    
    description = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    course = relationship("Course", back_populates="spots")
    diaries = relationship("SpotDiary", back_populates="spot")


class TravelPoi(Base):
    __tablename__ = "travel_pois"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    category = Column(String(30), nullable=False, index=True)
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    description = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    source = Column(String(50), nullable=True)
    external_id = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    source_name = Column(String, nullable=True)
    license_type = Column(String(50), nullable=True)
    attribution = Column(Text, nullable=True)
    retrieved_at = Column(DateTime(timezone=True), nullable=True)
    review_status = Column(String(20), default="approved", nullable=False)
    transport_mode = Column(String(30), nullable=True)
    route_name = Column(String, nullable=True)
    bike_policy = Column(Text, nullable=True)
    bike_policy_en = Column(Text, nullable=True)
    packing_required = Column(Boolean, nullable=True)
    packing_notes = Column(Text, nullable=True)
    packing_notes_en = Column(Text, nullable=True)
    booking_url = Column(String, nullable=True)
    recommend_count = Column(Integer, default=0, nullable=False)
    caution_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    feedback = relationship("TravelPoiFeedback", back_populates="poi", cascade="all, delete-orphan")
    reports = relationship("TravelPoiReport", back_populates="poi", cascade="all, delete-orphan")


class TravelPoiFeedback(Base):
    __tablename__ = "travel_poi_feedback"
    __table_args__ = (
        UniqueConstraint("poi_id", "user_id", name="uq_travel_poi_feedback_poi_user"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id = Column(UUID(as_uuid=True), ForeignKey("travel_pois.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    feedback_type = Column(String(12), nullable=False)  # 'recommend' or 'caution'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    poi = relationship("TravelPoi", back_populates="feedback")
    user = relationship("User", back_populates="travel_poi_feedback")


class TravelPoiReport(Base):
    __tablename__ = "travel_poi_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id = Column(UUID(as_uuid=True), ForeignKey("travel_pois.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(20), nullable=False)  # 'closed', 'wrong_location', 'danger', 'other'
    note = Column(Text, nullable=True)
    status = Column(String(20), default="open", nullable=False)  # 'open', 'resolved', 'dismissed'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    poi = relationship("TravelPoi", back_populates="reports")
    user = relationship("User", back_populates="travel_poi_reports")


class Journey(Base):
    __tablename__ = "journeys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    source_shared_route_id = Column(UUID(as_uuid=True), ForeignKey("shared_routes.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    status = Column(String(15), default="planning", nullable=False) # 'planning', 'riding', 'completed', 'paused'
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    visibility = Column(String(10), default="private", nullable=False) # 'private', 'public'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="journeys")
    course = relationship("Course", back_populates="journeys")
    diaries = relationship("SpotDiary", back_populates="journey", cascade="all, delete-orphan")
    track_points = relationship("JourneyTrackPoint", back_populates="journey", cascade="all, delete-orphan")
    source_shared_route = relationship("SharedRoute", foreign_keys=[source_shared_route_id])


class JourneyTrackPoint(Base):
    __tablename__ = "journey_track_points"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journey_id = Column(UUID(as_uuid=True), ForeignKey("journeys.id", ondelete="CASCADE"), nullable=False, index=True)
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    speed_kmh = Column(Numeric(6, 2), nullable=True)
    altitude_m = Column(Numeric(7, 2), nullable=True)
    is_off_route = Column(Boolean, default=False, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    journey = relationship("Journey", back_populates="track_points")


class SpotDiary(Base):
    __tablename__ = "spot_diaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journey_id = Column(UUID(as_uuid=True), ForeignKey("journeys.id", ondelete="CASCADE"), nullable=False)
    spot_id = Column(UUID(as_uuid=True), ForeignKey("spots.id", ondelete="SET NULL"), nullable=True)
    source_shared_route_stop_id = Column(UUID(as_uuid=True), ForeignKey("shared_route_stops.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    title = Column(String, nullable=True)
    diary_text = Column(Text, nullable=True)
    photo_urls = Column(ARRAY(String), nullable=True) # List of image URLs
    visited_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    visibility = Column(String(10), default="private", nullable=False) # 'private', 'public'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    journey = relationship("Journey", back_populates="diaries")
    spot = relationship("Spot", back_populates="diaries")
    source_shared_route_stop = relationship("SharedRouteStop", foreign_keys=[source_shared_route_stop_id])
    user = relationship("User", back_populates="diaries")


class SharedRoute(Base):
    __tablename__ = "shared_routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_journey_id = Column(UUID(as_uuid=True), ForeignKey("journeys.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    start_name = Column(String, nullable=True)
    end_name = Column(String, nullable=True)
    visibility = Column(String(10), default="private", nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="shared_routes")
    source_journey = relationship("Journey", foreign_keys=[source_journey_id])
    stops = relationship("SharedRouteStop", back_populates="shared_route", cascade="all, delete-orphan")
    comments = relationship("SharedRouteComment", back_populates="shared_route", cascade="all, delete-orphan")
    likes = relationship("SharedRouteLike", back_populates="shared_route", cascade="all, delete-orphan")


class SharedRouteStop(Base):
    __tablename__ = "shared_route_stops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shared_route_id = Column(UUID(as_uuid=True), ForeignKey("shared_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    source_diary_id = Column(UUID(as_uuid=True), ForeignKey("spot_diaries.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    photo_urls = Column(ARRAY(String), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    shared_route = relationship("SharedRoute", back_populates="stops")
    source_diary = relationship("SpotDiary", foreign_keys=[source_diary_id])


class SharedRouteComment(Base):
    __tablename__ = "shared_route_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shared_route_id = Column(UUID(as_uuid=True), ForeignKey("shared_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    shared_route = relationship("SharedRoute", back_populates="comments")
    user = relationship("User", back_populates="shared_route_comments")


class SharedRouteLike(Base):
    __tablename__ = "shared_route_likes"
    __table_args__ = (
        UniqueConstraint("shared_route_id", "user_id", name="uq_shared_route_likes_route_user"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shared_route_id = Column(UUID(as_uuid=True), ForeignKey("shared_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    shared_route = relationship("SharedRoute", back_populates="likes")
    user = relationship("User", back_populates="shared_route_likes")


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    spot_id = Column(UUID(as_uuid=True), ForeignKey("spots.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    code = Column(String, unique=True, nullable=False, index=True)
    is_redeemed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    user = relationship("User", back_populates="vouchers")
    spot = relationship("Spot")


class VoucherConfig(Base):
    __tablename__ = "voucher_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    spot_id = Column(UUID(as_uuid=True), ForeignKey("spots.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    reward_title = Column(String, nullable=False)
    reward_title_en = Column(String, nullable=False)
    reward_amount = Column(Integer, default=5000, nullable=False)
    valid_days = Column(Integer, default=90, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    spot = relationship("Spot")
