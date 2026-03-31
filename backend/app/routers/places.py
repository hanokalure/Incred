from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from ..schemas.places import PlaceOut, PlaceCreate, PlaceUpdate, PlaceDetectRequest, PlaceDetectOut, PlaceApprovalAction
from ..services.place_service import (
    list_places,
    get_place,
    create_place,
    update_place,
    delete_place,
    list_pending_places,
    approve_place,
    reject_place,
    list_my_submissions,
    update_my_submission,
    resubmit_my_submission,
)
from ..services.deps import require_admin, get_current_user
from ..services.location_detect_service import detect_place_from_google_maps_link

router = APIRouter()


@router.get("", response_model=List[PlaceOut])
def get_places(
    district_id: Optional[int] = Query(default=None),
    category: Optional[str] = Query(default=None),
):
    return list_places(district_id=district_id, category=category)


@router.post("", response_model=PlaceOut, status_code=201)
def create_place_api(payload: PlaceCreate, user=Depends(get_current_user)):
    return create_place(payload.model_dump(exclude_none=True), user_id=user["id"], user_role=user.get("role", "user"))


@router.post("/detect-from-link", response_model=PlaceDetectOut)
def detect_place_api(payload: PlaceDetectRequest, user=Depends(get_current_user)):
    return detect_place_from_google_maps_link(payload.google_maps_link)


@router.get("/pending", response_model=List[PlaceOut], dependencies=[Depends(require_admin)])
def get_pending_places():
    return list_pending_places()


@router.get("/my-submissions", response_model=List[PlaceOut])
def get_my_submissions(user=Depends(get_current_user)):
    return list_my_submissions(user_id=user["id"])


@router.get("/{place_id}", response_model=PlaceOut)
def get_place_by_id(place_id: int):
    return get_place(place_id)


@router.put("/{place_id}", response_model=PlaceOut, dependencies=[Depends(require_admin)])
def update_place_api(place_id: int, payload: PlaceUpdate):
    return update_place(place_id, payload.model_dump(exclude_unset=True))


@router.put("/{place_id}/my-submission", response_model=PlaceOut)
def update_my_submission_api(place_id: int, payload: PlaceUpdate, user=Depends(get_current_user)):
    return update_my_submission(place_id, user_id=user["id"], payload=payload.model_dump(exclude_unset=True))


@router.post("/{place_id}/resubmit", response_model=PlaceOut)
def resubmit_my_submission_api(place_id: int, user=Depends(get_current_user)):
    return resubmit_my_submission(place_id, user_id=user["id"])


@router.delete("/{place_id}", response_model=PlaceOut, dependencies=[Depends(require_admin)])
def delete_place_api(place_id: int):
    return delete_place(place_id)


@router.post("/{place_id}/approve", response_model=PlaceOut, dependencies=[Depends(require_admin)])
def approve_place_api(place_id: int, user=Depends(get_current_user)):
    return approve_place(place_id, admin_user_id=user["id"])


@router.post("/{place_id}/reject", response_model=PlaceOut, dependencies=[Depends(require_admin)])
def reject_place_api(place_id: int, payload: PlaceApprovalAction, user=Depends(get_current_user)):
    return reject_place(place_id, admin_user_id=user["id"], rejection_reason=payload.rejection_reason)
