from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.deps import get_current_user, get_optional_current_user
from ..database import get_db
from ..models import User
from ..schemas import (
    SharedRouteCommentCreate,
    SharedRouteCommentResponse,
    SharedRouteLikeResponse,
    SharedRouteResponse,
    SharedRouteUpdate,
    JourneyResponse,
)
from ..services import shared_route_service

router = APIRouter(prefix="/shared-routes", tags=["Shared Routes"])


@router.post(
    "/from-journey/{journey_id}",
    response_model=SharedRouteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def publish_from_journey(
    journey_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a private shared-route draft from a user's journey timeline."""
    return await shared_route_service.publish_from_journey(db, current_user, journey_id)


@router.get("/public", response_model=list[SharedRouteResponse])
async def list_public_shared_routes(
    limit: int = Query(30, ge=1, le=100, description="Maximum number of public shared routes"),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Retrieve public shared routes for the Moments feed."""
    return await shared_route_service.list_public_shared_routes(db, limit, current_user)


@router.get("/public/{route_id}", response_model=SharedRouteResponse)
async def get_public_shared_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Fetch a public shared route without requiring authentication."""
    return await shared_route_service.get_public_shared_route(db, route_id, current_user)


@router.get("/{route_id}", response_model=SharedRouteResponse)
async def get_shared_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a user's private shared-route draft."""
    return await shared_route_service.get_shared_route(db, current_user, route_id)


@router.patch("/{route_id}", response_model=SharedRouteResponse)
async def update_shared_route(
    route_id: UUID,
    payload: SharedRouteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update owner-controlled shared route settings."""
    return await shared_route_service.update_shared_route_visibility(
        db,
        current_user,
        route_id,
        payload.visibility or "private",
    )


@router.post("/public/{route_id}/share", response_model=SharedRouteResponse)
async def record_public_shared_route_share(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Increment the share counter for a public shared route."""
    return await shared_route_service.increment_share_count(db, route_id)


@router.post("/public/{route_id}/like", response_model=SharedRouteLikeResponse)
async def like_public_shared_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recommend a public shared route once per authenticated user."""
    return await shared_route_service.like_public_route(db, current_user, route_id)


@router.post(
    "/public/{route_id}/import",
    response_model=JourneyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def import_public_shared_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import a public shared route into the user's private Journey plans."""
    return await shared_route_service.import_public_route_as_journey(db, current_user, route_id)


@router.get("/public/{route_id}/comments", response_model=list[SharedRouteCommentResponse])
async def list_public_shared_route_comments(
    route_id: UUID,
    limit: int = Query(50, ge=1, le=100, description="Maximum number of comments"),
    db: AsyncSession = Depends(get_db),
):
    """Read public comments for a public shared route."""
    return await shared_route_service.list_public_comments(db, route_id, limit)


@router.post(
    "/public/{route_id}/comments",
    response_model=SharedRouteCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_public_shared_route_comment(
    route_id: UUID,
    payload: SharedRouteCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a public shared route."""
    return await shared_route_service.create_public_comment(
        db,
        current_user,
        route_id,
        payload.body,
    )
