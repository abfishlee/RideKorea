from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import VoucherClaimRequest, VoucherResponse
from ..api.deps import get_current_user
from ..services import voucher_service

router = APIRouter(prefix="/vouchers", tags=["Vouchers"])


@router.get("/me", response_model=List[VoucherResponse])
async def list_my_vouchers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all vouchers issued to the currently logged in user."""
    return await voucher_service.list_my_vouchers(db, current_user)


@router.post("/claim", response_model=VoucherResponse)
async def claim_voucher(
    payload: VoucherClaimRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Claim a voucher after server-side proximity verification."""
    return await voucher_service.claim_for_location(db, current_user, payload)
