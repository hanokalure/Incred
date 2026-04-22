from fastapi import APIRouter
from typing import List

from ..schemas.districts import DistrictOut
from ..services.district_service import list_districts, get_district

router = APIRouter()


@router.get("", response_model=List[DistrictOut])
async def get_districts():
    return await list_districts()


@router.get("/{district_id}", response_model=DistrictOut)
async def get_district_by_id(district_id: int):
    return await get_district(district_id)
