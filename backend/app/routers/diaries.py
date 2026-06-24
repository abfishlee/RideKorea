import os
import shutil
import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, cast, func
from sqlalchemy.orm import selectinload
from geoalchemy2 import Geometry

from ..database import get_db
from ..models import SpotDiary, Spot, Journey, User
from ..schemas import SpotDiaryResponse, SpotDiaryCreate, SpotDiaryFeedResponse
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/diaries", tags=["Spot Diaries"])

@router.post("/", response_model=SpotDiaryResponse, status_code=status.HTTP_201_CREATED)
async def create_diary(
    payload: SpotDiaryCreate,
    journey_id: UUID = Query(..., description="Associated journey ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Write a new spot diary entry (notes/photos) during a journey."""
    # 1. Verify journey ownership
    result = await db.execute(
        select(Journey).where(Journey.id == journey_id, Journey.user_id == current_user.id)
    )
    journey = result.scalars().first()
    if not journey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journey not found or you do not have permission to add entries to it"
        )
        
    # 2. Check if spot exists if specified
    if payload.spot_id:
        spot_res = await db.execute(select(Spot).where(Spot.id == payload.spot_id))
        if not spot_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Spot not found"
            )
            
    # 3. Create diary entry
    new_diary = SpotDiary(
        journey_id=journey_id,
        spot_id=payload.spot_id,
        user_id=current_user.id,
        diary_text=payload.diary_text,
        photo_urls=payload.photo_urls,
        visibility=payload.visibility,
    )
    if payload.visited_at:
        new_diary.visited_at = payload.visited_at
        
    db.add(new_diary)
    await db.commit()
    await db.refresh(new_diary)

    # 4. Check if spot qualifies for regional voucher based on VoucherConfig settings
    if new_diary.spot_id:
        from ..models import VoucherConfig
        v_config_res = await db.execute(
            select(VoucherConfig).where(
                VoucherConfig.spot_id == new_diary.spot_id,
                VoucherConfig.is_active == True
            )
        )
        v_config = v_config_res.scalars().first()
        
        if v_config:
            spot_res = await db.execute(select(Spot).where(Spot.id == new_diary.spot_id))
            spot = spot_res.scalars().first()
            
            import random
            import string
            from datetime import timedelta
            from ..models import Voucher
            
            # Generate random 8-letter uppercase coupon code
            coupon_code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
            
            voucher_title = v_config.reward_title
            voucher_title_en = v_config.reward_title_en
            voucher_desc = f"{spot.name} 주변 지정 식당, 민박, 전통시장에서 즉시 사용 가능한 할인 쿠폰입니다." if spot else "지역 지정 제휴점에서 즉시 사용 가능한 할인 쿠폰입니다."
            voucher_desc_en = f"Discount coupon usable at designated restaurants, guesthouses, and traditional markets near {spot.name_en}." if spot else "Discount coupon usable at designated local merchants."
            
            new_voucher = Voucher(
                user_id=current_user.id,
                spot_id=new_diary.spot_id,
                title=voucher_title,
                title_en=voucher_title_en,
                description=voucher_desc,
                description_en=voucher_desc_en,
                code=coupon_code,
                expires_at=datetime.utcnow() + timedelta(days=v_config.valid_days)
            )
            db.add(new_voucher)
            await db.commit()
    
    return new_diary


@router.post("/upload-photos", response_model=List[str])
async def upload_photos(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload images for a diary entry and return relative URLs."""
    saved_urls = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".gif"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {ext}"
            )
        
        # Generate unique filename to prevent collisions
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        
        # Save file to server disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        saved_urls.append(f"/uploads/{unique_name}")
        
    return saved_urls


@router.get("/public", response_model=List[SpotDiaryResponse])
async def list_public_diaries_in_map_bounds(
    min_lat: float = Query(..., description="Minimum bounding latitude"),
    min_lng: float = Query(..., description="Minimum bounding longitude"),
    max_lat: float = Query(..., description="Maximum bounding latitude"),
    max_lng: float = Query(..., description="Maximum bounding longitude"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve public diaries within the map's current bounding box coordinates."""
    # Find diaries linked to spots within the bounding envelope box, selecting the location geometry parsed to GeoJSON
    query = select(
        SpotDiary,
        func.ST_AsGeoJSON(Spot.location).label("location_geojson")
    ).join(
        Spot, SpotDiary.spot_id == Spot.id
    ).where(
        SpotDiary.visibility == "public",
        func.ST_Contains(
            func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326),
            cast(Spot.location, Geometry)
        )
    ).order_by(SpotDiary.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    diaries_with_coords = []
    import json
    for diary, geojson_str in rows:
        if geojson_str:
            loc_dict = json.loads(geojson_str)
            coords = loc_dict.get("coordinates", [0.0, 0.0])
            diary.lat = coords[1]
            diary.lng = coords[0]
        diaries_with_coords.append(diary)
        
    return diaries_with_coords


@router.get("/spot/{spot_id}", response_model=List[SpotDiaryFeedResponse])
async def get_spot_public_diaries(
    spot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve public diaries with author profile info for a specific certification spot."""
    query = select(SpotDiary).options(
        selectinload(SpotDiary.user)
    ).where(
        SpotDiary.spot_id == spot_id,
        SpotDiary.visibility == "public"
    ).order_by(SpotDiary.created_at.desc())
    
    result = await db.execute(query)
    diaries = result.scalars().all()
    return diaries
