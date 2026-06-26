"""Routing domain types and the engine contract.

Provider-neutral routing primitives. The orchestrator composes concrete engines
(self-managed course data, OSM bicycle engine, walking fallback) behind these
types so routers and the rest of the app stay engine-agnostic.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from uuid import UUID


class TravelMode(str, Enum):
    CYCLING = "cycling"
    WALKING = "walking"


class RouteSource(str, Enum):
    SELF_MANAGED = "self_managed"      # stored official course GeoJSON (preferred)
    OSM_BIKE = "osm_bike"              # self-hosted OSM bicycle engine
    WALKING_FALLBACK = "walking_fallback"


@dataclass
class LatLng:
    lat: float
    lng: float


@dataclass
class RouteRequest:
    origin: LatLng
    destination: LatLng
    waypoints: list[LatLng] = field(default_factory=list)
    mode: TravelMode = TravelMode.CYCLING
    prefer_course_id: Optional[UUID] = None


@dataclass
class RouteResult:
    coordinates: list[LatLng]
    distance_meters: float
    duration_seconds: float
    source: RouteSource


class RoutingEngine(ABC):
    """A single routing strategy. Returns None when it cannot serve the request,
    letting the orchestrator fall through to the next tier."""

    @abstractmethod
    async def route(self, request: RouteRequest) -> Optional[RouteResult]:
        raise NotImplementedError
