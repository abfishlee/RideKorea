from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import CourseResponse, CourseListResponse, CourseCreate
from ..services import course_service

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("/", response_model=List[CourseListResponse])
async def list_courses(db: AsyncSession = Depends(get_db)):
    """List all available cycling courses."""
    return await course_service.list_courses(db)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get details of a specific course, including its GeoJSON line path."""
    return await course_service.get_course(db, course_id)


@router.post("/", response_model=CourseResponse, include_in_schema=False)
async def create_course(payload: CourseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new course (for seeding/admin purposes)."""
    return await course_service.create_course(db, payload)
