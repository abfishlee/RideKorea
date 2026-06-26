"""OSM-based bicycle routing engine adapter.

Korea has no programmable bicycle-routing API from any map vendor, so cycling
routes are computed by a self-hosted OSM engine. This adapter targets GraphHopper
by default (recommended), with room for OSRM/BRouter variants.

Run the engine as a separate container built from a Korea OSM extract, and point
``settings.OSM_ROUTING_BASE_URL`` at it (e.g. http://graphhopper:8989). When that
URL is unset, this engine yields None so the orchestrator falls back gracefully.

httpx is imported lazily so the app boots even if the dependency isn't installed
yet; add ``httpx`` to requirements.txt before enabling real routing.
"""
from __future__ import annotations

from typing import Optional

from ...config import settings
from .base import LatLng, RouteRequest, RouteResult, RouteSource, RoutingEngine, TravelMode


class OsmBikeRoutingEngine(RoutingEngine):
    def __init__(
        self,
        base_url: str = "",
        engine: str = "graphhopper",
        bike_profile: str = "bike",
    ):
        self.base_url = (base_url or settings.OSM_ROUTING_BASE_URL).rstrip("/")
        self.engine = engine or settings.OSM_ROUTING_ENGINE
        self.bike_profile = bike_profile or settings.OSM_ROUTING_BIKE_PROFILE

    async def route(self, request: RouteRequest) -> Optional[RouteResult]:
        if not self.base_url:
            # Not configured yet -> let the orchestrator fall through.
            return None
        if self.engine == "graphhopper":
            return await self._graphhopper(request)
        # TODO: implement OSRM / BRouter variants.
        return None

    async def _graphhopper(self, request: RouteRequest) -> Optional[RouteResult]:
        import httpx  # lazy import; see module docstring

        points = [request.origin, *request.waypoints, request.destination]
        profile = self.bike_profile if request.mode == TravelMode.CYCLING else "foot"

        params = [("profile", profile), ("points_encoded", "false"), ("instructions", "false")]
        # GraphHopper expects point=lat,lng repeated.
        params += [("point", f"{p.lat},{p.lng}") for p in points]

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{self.base_url}/route", params=params)
        if resp.status_code != 200:
            return None

        data = resp.json()
        paths = data.get("paths") or []
        if not paths:
            return None
        path = paths[0]

        # GraphHopper GeoJSON coordinates are [lng, lat].
        coords = [LatLng(lat=c[1], lng=c[0]) for c in path["points"]["coordinates"]]
        source = RouteSource.OSM_BIKE if request.mode == TravelMode.CYCLING else RouteSource.WALKING_FALLBACK
        return RouteResult(
            coordinates=coords,
            distance_meters=float(path.get("distance", 0.0)),
            duration_seconds=float(path.get("time", 0)) / 1000.0,  # ms -> s
            source=source,
        )
