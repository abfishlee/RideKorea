import json
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models import Course
from ..schemas import CourseResponse, CourseListResponse, CourseCreate

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("/", response_model=List[CourseListResponse])
async def list_courses(db: AsyncSession = Depends(get_db)):
    """List all available cycling courses."""
    result = await db.execute(select(Course).order_by(Course.name))
    courses = result.scalars().all()
    return courses


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get details of a specific course, including its GeoJSON line path."""
    query = select(
        Course,
        func.ST_AsGeoJSON(Course.route_geometry).label("geometry_geojson")
    ).where(Course.id == course_id)
    
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    course, geometry_geojson = row
    
    # Parse GeoJSON string to dict
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
        created_at=course.created_at
    )


@router.post("/", response_model=CourseResponse, include_in_schema=False)
async def create_course(payload: CourseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new course (for seeding/admin purposes)."""
    geojson_str = json.dumps(payload.route_geometry)
    
    # Instantiate Course with GeoJSON converted to geometry
    new_course = Course(
        name=payload.name,
        name_en=payload.name_en,
        description=payload.description,
        description_en=payload.description_en,
        distance_km=payload.distance_km,
        estimated_days_min=payload.estimated_days_min,
        estimated_days_max=payload.estimated_days_max,
        difficulty=payload.difficulty,
        # Use PostGIS function to load GeoJSON
        route_geometry=func.ST_GeomFromGeoJSON(geojson_str)
    )
    
    db.add(new_course)
    await db.commit()
    
    return await get_course(new_course.id, db)
