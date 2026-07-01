"""Voucher domain logic: issuance, user listing, and admin configuration.

Voucher issuance is the platform's core local-revitalization mechanic, so it
lives in its own service rather than inside the diary router. This is also the
natural home for the anti-abuse controls flagged in the roadmap (server-side
location verification, per-user cooldowns, device/account caps) and, eventually,
merchant settlement.
"""
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Voucher, VoucherConfig, Spot, User
from ..schemas import VoucherConfigUpsert, VoucherConfigAdminResponse, VoucherClaimRequest
from ..core.exceptions import NotFoundError, ValidationError
from ..core.geo import latlng_to_point_wkt

CODE_LENGTH = 8
DEFAULT_REWARD_AMOUNT = 5000
DEFAULT_VALID_DAYS = 90


def _generate_code(length: int = CODE_LENGTH) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def issue_for_diary(
    db: AsyncSession, user_id: UUID, spot_id: UUID
) -> Optional[Voucher]:
    """Issue a regional voucher when a diary is logged at a voucher-active spot.

    Returns the created :class:`Voucher`, or ``None`` if the spot has no active
    voucher configuration.

    NOTE (anti-abuse, see roadmap §10): before issuing, this is where a real
    deployment must verify the rider's actual GPS proximity to the spot, enforce
    a per-user cooldown, and cap issuance per device/account to prevent farming.
    """
    config = (
        await db.execute(
            select(VoucherConfig).where(
                VoucherConfig.spot_id == spot_id,
                VoucherConfig.is_active.is_(True),
            )
        )
    ).scalars().first()
    if not config:
        return None

    spot = (
        await db.execute(select(Spot).where(Spot.id == spot_id))
    ).scalars().first()

    if spot:
        description = (
            f"{spot.name} 주변 지정 식당, 민박, 전통시장에서 즉시 사용 가능한 할인 쿠폰입니다."
        )
        description_en = (
            f"Discount coupon usable at designated restaurants, guesthouses, "
            f"and traditional markets near {spot.name_en}."
        )
    else:
        description = "지역 지정 제휴점에서 즉시 사용 가능한 할인 쿠폰입니다."
        description_en = "Discount coupon usable at designated local merchants."

    voucher = Voucher(
        user_id=user_id,
        spot_id=spot_id,
        title=config.reward_title,
        title_en=config.reward_title_en,
        description=description,
        description_en=description_en,
        code=_generate_code(),
        expires_at=datetime.now(timezone.utc) + timedelta(days=config.valid_days),
    )
    db.add(voucher)
    await db.commit()
    await db.refresh(voucher)
    return voucher


async def claim_for_location(
    db: AsyncSession,
    user: User,
    payload: VoucherClaimRequest,
) -> Voucher:
    """Claim a voucher after server-side GPS proximity verification."""
    reference = func.ST_GeographyFromText(
        latlng_to_point_wkt(payload.location.lat, payload.location.lng)
    )
    row = (
        await db.execute(
            select(Spot, VoucherConfig)
            .join(VoucherConfig, Spot.id == VoucherConfig.spot_id)
            .where(
                Spot.id == payload.spot_id,
                VoucherConfig.is_active.is_(True),
                func.ST_DWithin(Spot.location, reference, payload.radius_meters),
            )
            .order_by(func.ST_Distance(Spot.location, reference).asc())
        )
    ).first()

    if not row:
        raise ValidationError("Voucher spot is not active or rider is outside the claim radius")

    existing = (
        await db.execute(
            select(Voucher).where(
                Voucher.user_id == user.id,
                Voucher.spot_id == payload.spot_id,
            )
        )
    ).scalars().first()
    if existing:
        return existing

    spot, config = row
    description = (
        f"{spot.name} 주변 지정 식당, 민박, 전통시장에서 즉시 사용 가능한 할인 쿠폰입니다."
    )
    description_en = (
        f"Discount coupon usable at designated restaurants, guesthouses, "
        f"and traditional markets near {spot.name_en}."
    )

    voucher = Voucher(
        user_id=user.id,
        spot_id=spot.id,
        title=config.reward_title,
        title_en=config.reward_title_en,
        description=description,
        description_en=description_en,
        code=_generate_code(),
        expires_at=datetime.now(timezone.utc) + timedelta(days=config.valid_days),
    )
    db.add(voucher)
    await db.commit()
    await db.refresh(voucher)
    return voucher


async def list_my_vouchers(db: AsyncSession, user: User) -> list[Voucher]:
    result = await db.execute(
        select(Voucher)
        .where(Voucher.user_id == user.id)
        .order_by(Voucher.created_at.desc())
    )
    return result.scalars().all()


async def redeem_voucher(db: AsyncSession, user: User, voucher_id: UUID) -> Voucher:
    """Mark a user's voucher as redeemed after basic ownership and expiry checks."""
    voucher = (
        await db.execute(
            select(Voucher).where(
                Voucher.id == voucher_id,
                Voucher.user_id == user.id,
            )
        )
    ).scalars().first()

    if not voucher:
        raise NotFoundError("Voucher not found")

    if voucher.is_redeemed:
        return voucher

    now = datetime.now(timezone.utc)
    expires_at = voucher.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise ValidationError("Voucher has expired")

    voucher.is_redeemed = True
    await db.commit()
    await db.refresh(voucher)
    return voucher


# --- Admin configuration -----------------------------------------------------
async def admin_list_configs(
    db: AsyncSession, course_id: Optional[UUID] = None
) -> list[VoucherConfigAdminResponse]:
    """List every spot alongside its voucher config (with sensible defaults)."""
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
        VoucherConfig.updated_at,
    ).outerjoin(VoucherConfig, Spot.id == VoucherConfig.spot_id).order_by(Spot.name)

    if course_id:
        query = query.where(Spot.course_id == course_id)

    rows = (await db.execute(query)).all()
    return [
        VoucherConfigAdminResponse(
            id=r.config_id,
            spot_id=r.spot_id,
            spot_name=r.spot_name,
            spot_name_en=r.spot_name_en,
            is_active=r.is_active if r.is_active is not None else False,
            reward_title=r.reward_title if r.reward_title is not None else f"{r.spot_name} 제휴 쿠폰",
            reward_title_en=r.reward_title_en if r.reward_title_en is not None else f"{r.spot_name_en} Voucher",
            reward_amount=r.reward_amount if r.reward_amount is not None else DEFAULT_REWARD_AMOUNT,
            valid_days=r.valid_days if r.valid_days is not None else DEFAULT_VALID_DAYS,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in rows
    ]


async def admin_upsert_config(db: AsyncSession, payload: VoucherConfigUpsert) -> VoucherConfig:
    spot = (
        await db.execute(select(Spot).where(Spot.id == payload.spot_id))
    ).scalars().first()
    if not spot:
        raise NotFoundError("Spot not found")

    config = (
        await db.execute(
            select(VoucherConfig).where(VoucherConfig.spot_id == payload.spot_id)
        )
    ).scalars().first()

    if config:
        config.is_active = payload.is_active
        config.reward_title = payload.reward_title
        config.reward_title_en = payload.reward_title_en
        config.reward_amount = payload.reward_amount
        config.valid_days = payload.valid_days
    else:
        config = VoucherConfig(
            spot_id=payload.spot_id,
            is_active=payload.is_active,
            reward_title=payload.reward_title,
            reward_title_en=payload.reward_title_en,
            reward_amount=payload.reward_amount,
            valid_days=payload.valid_days,
        )
        db.add(config)

    await db.commit()
    await db.refresh(config)
    return config
