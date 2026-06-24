from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import VoucherConfig, Spot, User
from ..schemas import VoucherConfigResponse, VoucherConfigUpsert, VoucherConfigAdminResponse
from ..auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Vouchers"])

@router.get("/voucher-configs", response_model=List[VoucherConfigAdminResponse])
async def get_all_voucher_configs(
    course_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Admin check is simulated for MVP
):
    """Retrieve all spots with their voucher configuration status (active or not)."""
    # Outer join Spot with VoucherConfig to list all spots and their associated configs (if any)
    query = select(
        Spot.id.label("spot_id"),
        Spot.name.label("spot_name"),
        Spot.name_en.label("spot_name_en"),
        VoucherConfig.id.label("config_id"),
        VoucherConfig.is_active,
        VoucherConfig.reward_title,
        VoucherConfig.reward_title_en,
        VoucherConfig.reward_amount,
        VoucherConfig.valid_days,
        VoucherConfig.created_at,
        VoucherConfig.updated_at
    ).outerjoin(
        VoucherConfig, Spot.id == VoucherConfig.spot_id
    ).order_by(Spot.name)
    
    if course_id:
        query = query.where(Spot.course_id == course_id)
        
    result = await db.execute(query)
    rows = result.all()
    
    configs = []
    for r in rows:
        configs.append(VoucherConfigAdminResponse(
            id=r.config_id,
            spot_id=r.spot_id,
            spot_name=r.spot_name,
            spot_name_en=r.spot_name_en,
            is_active=r.is_active if r.is_active is not None else False,
            reward_title=r.reward_title if r.reward_title is not None else f"{r.spot_name} 제휴 쿠폰",
            reward_title_en=r.reward_title_en if r.reward_title_en is not None else f"{r.spot_name_en} Voucher",
            reward_amount=r.reward_amount if r.reward_amount is not None else 5000,
            valid_days=r.valid_days if r.valid_days is not None else 90,
            created_at=r.created_at,
            updated_at=r.updated_at
        ))
    return configs


@router.post("/voucher-configs", response_model=VoucherConfigResponse)
async def upsert_voucher_config(
    payload: VoucherConfigUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Admin check is simulated for MVP
):
    """Create or update a voucher configuration for a specific spot."""
    # Check if spot exists
    spot_res = await db.execute(select(Spot).where(Spot.id == payload.spot_id))
    if not spot_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spot not found"
        )
        
    # Check if config already exists for this spot
    query = select(VoucherConfig).where(VoucherConfig.spot_id == payload.spot_id)
    result = await db.execute(query)
    config = result.scalars().first()
    
    if config:
        # Update existing config
        config.is_active = payload.is_active
        config.reward_title = payload.reward_title
        config.reward_title_en = payload.reward_title_en
        config.reward_amount = payload.reward_amount
        config.valid_days = payload.valid_days
    else:
        # Create new config
        config = VoucherConfig(
            spot_id=payload.spot_id,
            is_active=payload.is_active,
            reward_title=payload.reward_title,
            reward_title_en=payload.reward_title_en,
            reward_amount=payload.reward_amount,
            valid_days=payload.valid_days
        )
        db.add(config)
        
    await db.commit()
    await db.refresh(config)
    return config
