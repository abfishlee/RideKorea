"""Course domain logic and data access."""
import json
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Course
from ..schemas import CourseResponse, CourseCreate
from ..core.exceptions import NotFoundError


async def list_courses(db: AsyncSession):
    result = await db.execute(select(Course).order_by(Course.name))
    return result.scalars().all()


async def get_course(db: AsyncSession, course_id: UUID) -> CourseResponse:
    query = select(
        Course,
        func.ST_AsGeoJSON(Course.route_geometry).label("geometry_geojson"),
    ).where(Course.id == course_id)

    row = (await db.execute(query)).first()
    if not row:
        raise NotFoundError("Course not found")

    course, geometry_geojson = row
    route_geometry = json.loads(geometry_geojson) if geometry_geojson else None

    return CourseResponse(
        id=course.id,
        name=course.name,
        name_en=course.name_en,
        description=course.description,
        description_en=course.description_en,
        distance_km=float(course.distance_km),
        estimated_days_min=course.estimated_days_min,
        estimated_days_max=course.estimated_days_max,
        difficulty=course.difficulty,
        route_geometry=route_geometry,
        created_at=course.created_at,
    )


async def create_course(db: AsyncSession, payload: CourseCreate) -> CourseResponse:
    geojson_str = json.dumps(payload.route_geometry)
    new_course = Course(
        name=payload.name,
        name_en=payload.name_en,
        description=payload.description,
        description_en=payload.description_en,
        distance_km=payload.distance_km,
        estimated_days_min=payload.estimated_days_min,
        estimated_days_max=payload.estimated_days_max,
        difficulty=payload.difficulty,
        route_geometry=func.ST_GeomFromGeoJSON(geojson_str),
    )
    db.add(new_course)
    await db.commit()
    return await get_course(db, new_course.id)
