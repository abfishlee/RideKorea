from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Voucher, User
from ..schemas import VoucherResponse
from ..auth import get_current_user

router = APIRouter(prefix="/vouchers", tags=["Vouchers"])

@router.get("/me", response_model=List[VoucherResponse])
async def list_my_vouchers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all vouchers issued to the currently logged in user."""
    query = select(Voucher).where(Voucher.user_id == current_user.id).order_by(Voucher.created_at.desc())
    result = await db.execute(query)
    vouchers = result.scalars().all()
    return vouchers
