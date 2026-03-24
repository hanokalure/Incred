from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from ..schemas.places import PlaceOut, PlaceCreate, PlaceUpdate, PlaceDetectRequest, PlaceDetectOut
from ..services.place_service import list_places, get_place, create_place, update_place, delete_place
from ..services.deps import require_admin
from ..services.location_detect_service import detect_place_from_google_maps_link

router = APIRouter()


@router.get("", response_model=List[PlaceOut])
def get_places(
    district_id: Optional[int] = Query(default=None),
    category: Optional[str] = Query(default=None),
):
    return list_places(district_id=district_id, category=category)


@router.get("/{place_id}", response_model=PlaceOut)
def get_place_by_id(place_id: int):
    return get_place(place_id)


@router.post("", response_model=PlaceOut, status_code=201, dependencies=[Depends(require_admin)])
def create_place_api(payload: PlaceCreate):
    return create_place(payload.model_dump(exclude_none=True))


@router.post("/detect-from-link", response_model=PlaceDetectOut, dependencies=[Depends(require_admin)])
def detect_place_api(payload: PlaceDetectRequest):
    return detect_place_from_google_maps_link(payload.google_maps_link)


@router.put("/{place_id}", response_model=PlaceOut, dependencies=[Depends(require_admin)])
def update_place_api(place_id: int, payload: PlaceUpdate):
    return update_place(place_id, payload.model_dump(exclude_unset=True))


@router.delete("/{place_id}", response_model=PlaceOut, dependencies=[Depends(require_admin)])
def delete_place_api(place_id: int):
    return delete_place(place_id)
