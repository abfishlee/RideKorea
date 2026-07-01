from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    VoucherCodeRequest,
    VoucherConfigAdminResponse,
    VoucherConfigResponse,
    VoucherConfigUpsert,
    VoucherResponse,
)
from ..api.deps import get_current_admin
from ..services import voucher_service

router = APIRouter(prefix="/admin", tags=["Admin Vouchers"])


@router.get("/voucher-configs", response_model=List[VoucherConfigAdminResponse])
async def get_all_voucher_configs(
    course_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Retrieve all spots with their voucher configuration status (active or not)."""
    return await voucher_service.admin_list_configs(db, course_id)


@router.post("/voucher-configs", response_model=VoucherConfigResponse)
async def upsert_voucher_config(
    payload: VoucherConfigUpsert,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Create or update a voucher configuration for a specific spot."""
    return await voucher_service.admin_upsert_config(db, payload)


@router.post("/voucher-redemptions/lookup", response_model=VoucherResponse)
async def lookup_voucher_by_code(
    payload: VoucherCodeRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Look up a voucher by code before merchant-side redemption."""
    return await voucher_service.admin_lookup_voucher_by_code(db, payload.code)


@router.post("/voucher-redemptions/redeem", response_model=VoucherResponse)
async def redeem_voucher_by_code(
    payload: VoucherCodeRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Redeem a voucher by code through admin/merchant tooling."""
    return await voucher_service.admin_redeem_voucher_by_code(db, admin, payload.code)
