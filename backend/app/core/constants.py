"""Domain constants and enumerations.

All enums subclass ``str`` so members are drop-in compatible with the plain
string values stored in the database and expected by Pydantic schemas
(e.g. ``Visibility.PUBLIC == "public"`` is True). This removes magic strings
from the codebase while keeping the on-disk/API representation unchanged.
"""
from enum import Enum


class AuthProvider(str, Enum):
    """Supported social login providers."""
    GOOGLE = "google"
    APPLE = "apple"
    KAKAO = "kakao"   # planned (see project_status Task 1)
    NAVER = "naver"   # planned

    @classmethod
    def values(cls) -> list[str]:
        return [m.value for m in cls]


class JourneyStatus(str, Enum):
    """Lifecycle states of a riding journey."""
    PLANNING = "planning"
    RIDING = "riding"
    COMPLETED = "completed"
    PAUSED = "paused"


class Visibility(str, Enum):
    """Visibility scope for journeys and diaries."""
    PRIVATE = "private"
    PUBLIC = "public"


class SpotType(str, Enum):
    """Categories of map spots.

    Kept as an enum for validation/autocomplete; new categories only need to be
    added here. The DB column stays a free-form string for forward-compatibility,
    so unknown legacy values won't break reads.
    """
    CERTIFICATION_CENTER = "certification_center"
    VIEWPOINT = "viewpoint"
    REST_AREA = "rest_area"
    LODGING = "lodging"
    CAMPSITE = "campsite"
    RESTAURANT = "restaurant"
    CAFE = "cafe"
    CONVENIENCE_STORE = "convenience_store"
    BICYCLE_SHOP = "bicycle_shop"
    BICYCLE_RENTAL = "bicycle_rental"
    REPAIR = "repair"
    TRANSPORT = "transport"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# Allowed image extensions for diary photo uploads.
ALLOWED_IMAGE_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".gif", ".webp"})
