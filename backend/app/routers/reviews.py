from fastapi import APIRouter, Depends
from typing import List

from ..schemas.reviews import ReviewCreate, ReviewOut
from ..services.review_service import create_review, list_reviews
from ..services.deps import get_current_user

router = APIRouter()


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review_api(payload: ReviewCreate, current_user=Depends(get_current_user)):
    return await create_review(current_user["id"], payload.model_dump())


@router.get("/{place_id}", response_model=List[ReviewOut])
async def get_reviews(place_id: int):
    return await list_reviews(place_id)
