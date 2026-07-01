"""Shared route publishing domain logic."""
from uuid import UUID

from sqlalchemy import func, inspect, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.constants import Visibility
from ..core.exceptions import NotFoundError, ValidationError
from ..core.geo import geojson_to_latlng_dict
from ..models import (
    Journey,
    SharedRoute,
    SharedRouteComment,
    SharedRouteLike,
    SharedRouteStop,
    SpotDiary,
    User,
)
from ..schemas import (
    SharedRouteCommentResponse,
    SharedRouteLikeResponse,
    SharedRouteResponse,
    SharedRouteStopResponse,
)


async def publish_from_journey(
    db: AsyncSession,
    user: User,
    journey_id: UUID,
) -> SharedRouteResponse:
    result = await db.execute(
        select(Journey)
        .options(selectinload(Journey.diaries).selectinload(SpotDiary.spot))
        .where(Journey.id == journey_id, Journey.user_id == user.id)
    )
    journey = result.scalars().first()
    if not journey:
        raise NotFoundError("Journey not found or you do not have permission to publish it")

    diaries = sorted(journey.diaries or [], key=lambda diary: diary.created_at)
    shared_route = SharedRoute(
        user_id=user.id,
        source_journey_id=journey.id,
        title=journey.title,
        summary=_build_summary(diaries),
        start_name=diaries[0].title if diaries else None,
        end_name=diaries[-1].title if diaries else None,
        visibility=Visibility.PRIVATE.value,
    )
    db.add(shared_route)
    await db.flush()

    for index, diary in enumerate(diaries):
        db.add(
            SharedRouteStop(
                shared_route_id=shared_route.id,
                source_diary_id=diary.id,
                title=diary.title or f"Stop {index + 1}",
                body=diary.diary_text,
                location=_diary_location_expr(diary),
                photo_urls=diary.photo_urls,
                sort_order=index,
            )
        )

    await db.commit()
    return await get_shared_route(db, user, shared_route.id)


async def get_shared_route(db: AsyncSession, user: User, route_id: UUID) -> SharedRouteResponse:
    result = await db.execute(
        select(SharedRoute)
        .options(selectinload(SharedRoute.stops), selectinload(SharedRoute.user))
        .where(SharedRoute.id == route_id, SharedRoute.user_id == user.id)
    )
    route = result.scalars().first()
    if not route:
        raise NotFoundError("Shared route not found")

    return await _to_response(db, route, user)


async def get_public_shared_route(
    db: AsyncSession,
    route_id: UUID,
    user: User | None = None,
) -> SharedRouteResponse:
    result = await db.execute(
        select(SharedRoute)
        .options(selectinload(SharedRoute.stops), selectinload(SharedRoute.user))
        .where(SharedRoute.id == route_id, SharedRoute.visibility == Visibility.PUBLIC.value)
    )
    route = result.scalars().first()
    if not route:
        raise NotFoundError("Public shared route not found")

    return await _to_response(db, route, user)


async def list_public_shared_routes(
    db: AsyncSession,
    limit: int = 30,
    user: User | None = None,
) -> list[SharedRouteResponse]:
    result = await db.execute(
        select(SharedRoute)
        .options(selectinload(SharedRoute.stops), selectinload(SharedRoute.user))
        .where(SharedRoute.visibility == Visibility.PUBLIC.value)
        .order_by(SharedRoute.created_at.desc())
        .limit(limit)
    )
    return [await _to_response(db, route, user) for route in result.scalars().all()]


async def update_shared_route_visibility(
    db: AsyncSession,
    user: User,
    route_id: UUID,
    visibility: str,
) -> SharedRouteResponse:
    if visibility not in {Visibility.PRIVATE.value, Visibility.PUBLIC.value}:
        raise ValidationError("Visibility must be either private or public")

    result = await db.execute(
        select(SharedRoute)
        .options(selectinload(SharedRoute.stops), selectinload(SharedRoute.user))
        .where(SharedRoute.id == route_id, SharedRoute.user_id == user.id)
    )
    route = result.scalars().first()
    if not route:
        raise NotFoundError("Shared route not found")

    route.visibility = visibility
    await db.commit()
    return await get_shared_route(db, user, route.id)


async def increment_share_count(db: AsyncSession, route_id: UUID) -> SharedRouteResponse:
    result = await db.execute(
        select(SharedRoute)
        .options(selectinload(SharedRoute.stops), selectinload(SharedRoute.user))
        .where(SharedRoute.id == route_id, SharedRoute.visibility == Visibility.PUBLIC.value)
    )
    route = result.scalars().first()
    if not route:
        raise NotFoundError("Public shared route not found")

    route.share_count += 1
    await db.commit()
    return await get_public_shared_route(db, route.id)


async def list_public_comments(
    db: AsyncSession,
    route_id: UUID,
    limit: int = 50,
) -> list[SharedRouteCommentResponse]:
    route = await _get_public_route_or_raise(db, route_id)
    result = await db.execute(
        select(SharedRouteComment)
        .options(selectinload(SharedRouteComment.user))
        .where(SharedRouteComment.shared_route_id == route.id)
        .order_by(SharedRouteComment.created_at.asc())
        .limit(limit)
    )
    return [_comment_to_response(comment) for comment in result.scalars().all()]


async def create_public_comment(
    db: AsyncSession,
    user: User,
    route_id: UUID,
    body: str,
) -> SharedRouteCommentResponse:
    route = await _get_public_route_or_raise(db, route_id)
    normalized_body = body.strip()
    if not normalized_body:
        raise ValidationError("Comment body is required")

    comment = SharedRouteComment(
        shared_route_id=route.id,
        user_id=user.id,
        body=normalized_body,
    )
    route.comment_count += 1
    db.add(comment)
    await db.commit()

    result = await db.execute(
        select(SharedRouteComment)
        .options(selectinload(SharedRouteComment.user))
        .where(SharedRouteComment.id == comment.id)
    )
    return _comment_to_response(result.scalars().one())


async def like_public_route(
    db: AsyncSession,
    user: User,
    route_id: UUID,
) -> SharedRouteLikeResponse:
    route = await _get_public_route_or_raise(db, route_id)
    existing_like = (
        await db.execute(
            select(SharedRouteLike).where(
                SharedRouteLike.shared_route_id == route.id,
                SharedRouteLike.user_id == user.id,
            )
        )
    ).scalars().first()

    if existing_like:
        return SharedRouteLikeResponse(
            liked=True,
            route=await get_public_shared_route(db, route.id, user),
        )

    db.add(SharedRouteLike(shared_route_id=route.id, user_id=user.id))
    route.like_count += 1
    await db.commit()
    return SharedRouteLikeResponse(
        liked=True,
        route=await get_public_shared_route(db, route.id, user),
    )


async def import_public_route_as_journey(
    db: AsyncSession,
    user: User,
    route_id: UUID,
) -> Journey:
    route = await _get_public_route_or_raise(db, route_id)
    existing_journey = (
        await db.execute(
            select(Journey).where(
                Journey.user_id == user.id,
                Journey.source_shared_route_id == route.id,
            )
        )
    ).scalars().first()
    if existing_journey:
        return existing_journey

    journey = Journey(
        user_id=user.id,
        source_shared_route_id=route.id,
        title=f"{route.title} 준비",
        status="planning",
        visibility=Visibility.PRIVATE.value,
    )
    db.add(journey)
    await db.commit()
    await db.refresh(journey)
    return journey


def _build_summary(diaries: list[SpotDiary]) -> str:
    titles = [diary.title for diary in diaries if diary.title]
    if not titles:
        return "Journey timeline draft created from riding diaries."
    return " / ".join(titles[:3])


def _diary_location_expr(diary: SpotDiary):
    if diary.location is not None:
        return diary.location
    if diary.spot and diary.spot.location is not None:
        return diary.spot.location
    return None


async def _get_public_route_or_raise(db: AsyncSession, route_id: UUID) -> SharedRoute:
    result = await db.execute(
        select(SharedRoute)
        .where(SharedRoute.id == route_id, SharedRoute.visibility == Visibility.PUBLIC.value)
    )
    route = result.scalars().first()
    if not route:
        raise NotFoundError("Public shared route not found")
    return route


def _comment_to_response(comment: SharedRouteComment) -> SharedRouteCommentResponse:
    return SharedRouteCommentResponse(
        id=comment.id,
        shared_route_id=comment.shared_route_id,
        user_id=comment.user_id,
        body=comment.body,
        created_at=comment.created_at,
        author=comment.user,
    )


async def _has_user_liked(db: AsyncSession, route_id: UUID, user: User | None) -> bool:
    if not user:
        return False
    like = (
        await db.execute(
            select(SharedRouteLike.id).where(
                SharedRouteLike.shared_route_id == route_id,
                SharedRouteLike.user_id == user.id,
            )
        )
    ).scalars().first()
    return like is not None


async def _to_response(
    db: AsyncSession,
    route: SharedRoute,
    user: User | None = None,
) -> SharedRouteResponse:
    route_state = inspect(route)
    author = route.user if "user" not in route_state.unloaded else await db.get(User, route.user_id)
    stops_result = await db.execute(
        select(
            SharedRouteStop,
            func.ST_AsGeoJSON(SharedRouteStop.location).label("location_geojson"),
        )
        .where(SharedRouteStop.shared_route_id == route.id)
        .order_by(SharedRouteStop.sort_order.asc())
    )

    stops = []
    for stop, location_geojson in stops_result.all():
        stops.append(
            SharedRouteStopResponse(
                id=stop.id,
                shared_route_id=stop.shared_route_id,
                source_diary_id=stop.source_diary_id,
                title=stop.title,
                body=stop.body,
                location=geojson_to_latlng_dict(location_geojson) if location_geojson else None,
                photo_urls=stop.photo_urls,
                sort_order=stop.sort_order,
                created_at=stop.created_at,
            )
        )

    return SharedRouteResponse(
        id=route.id,
        user_id=route.user_id,
        source_journey_id=route.source_journey_id,
        title=route.title,
        summary=route.summary,
        start_name=route.start_name,
        end_name=route.end_name,
        visibility=route.visibility,
        like_count=route.like_count,
        comment_count=route.comment_count,
        share_count=route.share_count,
        liked_by_me=await _has_user_liked(db, route.id, user),
        created_at=route.created_at,
        author=author,
        stops=stops,
    )
