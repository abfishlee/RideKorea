import uuid
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, Text, Boolean, func
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


class Journey(Base):
    __tablename__ = "journeys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
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


class SpotDiary(Base):
    __tablename__ = "spot_diaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journey_id = Column(UUID(as_uuid=True), ForeignKey("journeys.id", ondelete="CASCADE"), nullable=False)
    spot_id = Column(UUID(as_uuid=True), ForeignKey("spots.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    diary_text = Column(Text, nullable=True)
    photo_urls = Column(ARRAY(String), nullable=True) # List of image URLs
    visited_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    visibility = Column(String(10), default="private", nullable=False) # 'private', 'public'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    journey = relationship("Journey", back_populates="diaries")
    spot = relationship("Spot", back_populates="diaries")
    user = relationship("User", back_populates="diaries")


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
