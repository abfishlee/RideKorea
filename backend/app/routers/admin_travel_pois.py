from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.deps import get_current_admin
from ..database import get_db
from ..models import User
from ..schemas import TravelPoiAdminUpdate, TravelPoiReportResponse, TravelPoiReportUpdate, TravelPoiResponse
from ..services import travel_poi_service

router = APIRouter(prefix="/admin/travel-pois", tags=["Admin Travel POIs"])


@router.get("/", response_model=List[TravelPoiResponse])
async def list_admin_travel_pois(
    review_status: Optional[str] = Query(None, description="Filter by review status"),
    category: Optional[str] = Query(None, description="Filter by POI category"),
    source: Optional[str] = Query(None, description="Filter by source"),
    is_active: Optional[bool] = Query(None, description="Filter active or hidden POIs"),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """List POIs for data review, including hidden and non-approved rows."""
    return await travel_poi_service.admin_list(
        db,
        review_status=review_status,
        category=category,
        source=source,
        is_active=is_active,
        limit=limit,
    )


@router.patch("/{poi_id}", response_model=TravelPoiResponse)
async def update_admin_travel_poi(
    poi_id: UUID,
    payload: TravelPoiAdminUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Update POI provenance, review status, or active visibility."""
    return await travel_poi_service.admin_update(db, poi_id, payload)


@router.get("/reports", response_model=List[TravelPoiReportResponse])
async def list_admin_travel_poi_reports(
    status: Optional[str] = Query("open", description="Filter by report status"),
    report_type: Optional[str] = Query(None, description="Filter by report type"),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """List rider-submitted POI issue reports for operational review."""
    return await travel_poi_service.admin_list_reports(
        db,
        status=status,
        report_type=report_type,
        limit=limit,
    )


@router.patch("/reports/{report_id}", response_model=TravelPoiReportResponse)
async def update_admin_travel_poi_report(
    report_id: UUID,
    payload: TravelPoiReportUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Resolve, reopen, or dismiss a rider-submitted POI issue report."""
    return await travel_poi_service.admin_update_report_status(db, report_id, payload.status)
