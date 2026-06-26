"""Routing orchestrator: the 3-tier cycling fallback.

Order (see map_provider_decision.md §4):
  1. self-managed  — stored official course GeoJSON (when prefer_course_id is given)
  2. osm_bike      — self-hosted OSM bicycle engine for general roads
  3. walking       — OSM walking profile as a last resort

A car-routing API is never used for cycling.
"""
from __future__ import annotations

import json
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, cast
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography

from ...models import Course
from .base import (
    LatLng,
    RouteRequest,
    RouteResult,
    RouteSource,
    TravelMode,
)
from .osm_bike import OsmBikeRoutingEngine

# Rough cycling speed used to estimate duration for stored courses (m/s).
_CYCLING_SPEED_MPS = 15_000 / 3600  # ~15 km/h


class RoutingOrchestrator:
    def __init__(self, osm_engine: Optional[OsmBikeRoutingEngine] = None):
        self.osm_engine = osm_engine or OsmBikeRoutingEngine()

    async def route(self, db: AsyncSession, request: RouteRequest) -> RouteResult:
        # Tier 1: stored official course (preferred when referenced).
        if request.prefer_course_id:
            stored = await self._self_managed(db, request.prefer_course_id)
            if stored:
                return stored

        # Tier 2: OSM bicycle engine for general-road cycling.
        if request.mode == TravelMode.CYCLING:
            bike = await self.osm_engine.route(request)
            if bike:
                return bike

        # Tier 3: walking fallback.
        walking_req = RouteRequest(
            origin=request.origin,
            destination=request.destination,
            waypoints=request.waypoints,
            mode=TravelMode.WALKING,
        )
        walking = await self.osm_engine.route(walking_req)
        if walking:
            return walking

        raise RoutingUnavailableError(
            "No routing engine could serve this request. "
            "Configure OSM_ROUTING_BASE_URL or pass prefer_course_id."
        )

    async def _self_managed(self, db: AsyncSession, course_id: UUID) -> Optional[RouteResult]:
        row = (
            await db.execute(
                select(
                    func.ST_AsGeoJSON(Course.route_geometry).label("geojson"),
                    func.ST_Length(cast(Course.route_geometry, Geography)).label("length_m"),
                ).where(Course.id == course_id)
            )
        ).first()
        if not row or not row.geojson:
            return None

        geom = json.loads(row.geojson)
        # LineString coordinates are [lng, lat].
        coords = [LatLng(lat=c[1], lng=c[0]) for c in geom.get("coordinates", [])]
        if not coords:
            return None

        distance_m = float(row.length_m or 0.0)
        return RouteResult(
            coordinates=coords,
            distance_meters=distance_m,
            duration_seconds=distance_m / _CYCLING_SPEED_MPS if distance_m else 0.0,
            source=RouteSource.SELF_MANAGED,
        )


class RoutingUnavailableError(Exception):
    """Raised when no tier can produce a route."""
