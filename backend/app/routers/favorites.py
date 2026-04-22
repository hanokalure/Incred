from fastapi import APIRouter, Depends
from typing import List

from ..schemas.favorites import FavoriteCreate, FavoriteOut
from ..schemas.places import PlaceOut
from ..services.favorite_service import add_favorite, list_favorites, delete_favorite
from ..services.favorite_service import list_favorite_places
from ..services.deps import get_current_user

router = APIRouter()


@router.post("", response_model=FavoriteOut, status_code=201)
async def create_favorite(payload: FavoriteCreate, current_user=Depends(get_current_user)):
    return await add_favorite(current_user["id"], payload.place_id)


@router.get("", response_model=List[FavoriteOut])
async def get_favorites(current_user=Depends(get_current_user)):
    return await list_favorites(current_user["id"])


@router.get("/places", response_model=List[PlaceOut])
async def get_favorite_places(current_user=Depends(get_current_user)):
    return await list_favorite_places(current_user["id"])


@router.delete("/{favorite_id}", response_model=FavoriteOut)
async def delete_favorite_api(favorite_id: int, current_user=Depends(get_current_user)):
    return await delete_favorite(current_user["id"], favorite_id)
