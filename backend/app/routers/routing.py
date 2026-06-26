from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..core.exceptions import AppError
from ..schemas import LocationSchema
from ..services.routing import (
    LatLng,
    RouteRequest,
    RoutingOrchestrator,
    RoutingUnavailableError,
    TravelMode,
)

router = APIRouter(prefix="/routing", tags=["Routing"])

_orchestrator = RoutingOrchestrator()


class RouteRequestBody(BaseModel):
    origin: LocationSchema
    destination: LocationSchema
    waypoints: List[LocationSchema] = Field(default_factory=list)
    mode: TravelMode = TravelMode.CYCLING
    prefer_course_id: Optional[UUID] = None


class RoutePathResponse(BaseModel):
    id: str
    coordinates: List[LocationSchema]


class RouteResponse(BaseModel):
    path: RoutePathResponse
    distance_meters: float
    duration_seconds: float
    source: str


@router.post("", response_model=RouteResponse)
async def compute_route(body: RouteRequestBody, db: AsyncSession = Depends(get_db)):
    """Compute a cycling route using the 3-tier fallback.

    Prefers a stored official course (prefer_course_id), then the OSM bicycle
    engine for general roads, then a walking fallback. Never returns a car route.
    """
    request = RouteRequest(
        origin=LatLng(lat=body.origin.lat, lng=body.origin.lng),
        destination=LatLng(lat=body.destination.lat, lng=body.destination.lng),
        waypoints=[LatLng(lat=w.lat, lng=w.lng) for w in body.waypoints],
        mode=body.mode,
        prefer_course_id=body.prefer_course_id,
    )

    try:
        result = await _orchestrator.route(db, request)
    except RoutingUnavailableError as e:
        err = AppError(str(e))
        err.status_code = 503  # routing engine not configured / unreachable
        raise err

    return RouteResponse(
        path=RoutePathResponse(
            id=str(body.prefer_course_id or "computed"),
            coordinates=[LocationSchema(lat=c.lat, lng=c.lng) for c in result.coordinates],
        ),
        distance_meters=result.distance_meters,
        duration_seconds=result.duration_seconds,
        source=result.source.value,
    )
