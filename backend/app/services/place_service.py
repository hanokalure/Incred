from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from postgrest.exceptions import APIError
from datetime import datetime, timezone

from ..database import supabase_anon, supabase_admin


ALLOWED_CATEGORIES = {
    "restaurant",
    "generational_shop",
    "tourist_place",
    "hidden_gem",
    "stay",
}


def _raise_if_missing_approval_columns(error: APIError):
    payload_error = error.args[0] if error.args else {}
    code = payload_error.get("code") if isinstance(payload_error, dict) else None
    message = payload_error.get("message") if isinstance(payload_error, dict) else str(error)
    if code == "PGRST204" and "approval_status" in (message or ""):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Database is missing place approval columns. Run backend/sql/2026_03_30_add_place_approval_workflow.sql "
                "and refresh Supabase API schema cache."
            ),
        )


def list_places(district_id: Optional[int] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    query = supabase_anon.table("places").select("id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating,approval_status,submitted_by,approved_by,approved_at,rejection_reason")
    query = query.eq("approval_status", "approved")

    if district_id is not None:
        query = query.eq("district_id", district_id)
    if category is not None:
        query = query.eq("category", category)

    try:
        result = query.order("id", desc=True).execute()
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    return result.data or []


def get_place(place_id: int) -> Dict[str, Any]:
    # Include nested details if present (via FK place_id)
    try:
        result = (
            supabase_anon.table("places")
            .select("id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating,approval_status,submitted_by,approved_by,approved_at,rejection_reason,restaurant_details(*),stay_details(*)")
            .eq("id", place_id)
            .eq("approval_status", "approved")
            .single()
            .execute()
        )
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data


def create_place(payload: Dict[str, Any], user_id: str, user_role: str) -> Dict[str, Any]:
    if payload.get("category") not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")

    restaurant_details = payload.pop("restaurant_details", None)
    stay_details = payload.pop("stay_details", None)

    # Normalize optional arrays to what PostgREST expects
    image_urls = payload.get("image_urls")
    if image_urls is None:
        payload.pop("image_urls", None)
    elif isinstance(image_urls, str):
        payload["image_urls"] = [image_urls]

    video_urls = payload.get("video_urls")
    if video_urls is None:
        payload.pop("video_urls", None)
    elif isinstance(video_urls, str):
        payload["video_urls"] = [video_urls]

    payload["submitted_by"] = user_id
    if user_role == "admin":
        payload["approval_status"] = "approved"
        payload["approved_by"] = user_id
        payload["approved_at"] = datetime.now(timezone.utc).isoformat()
        payload["rejection_reason"] = None
    else:
        payload["approval_status"] = "pending"
        payload["approved_by"] = None
        payload["approved_at"] = None
        payload["rejection_reason"] = None

    try:
        place_result = supabase_admin.table("places").insert(payload).execute()
    except APIError as e:
        _raise_if_missing_approval_columns(e)
        payload_error = e.args[0] if e.args else {}
        code = payload_error.get("code") if isinstance(payload_error, dict) else None
        message = payload_error.get("message") if isinstance(payload_error, dict) else str(e)

        # If the serial sequence drifts, recover by explicitly choosing the next id.
        if code == "23505" and 'places_pkey' in (message or ''):
            max_id_result = (
                supabase_admin.table("places")
                .select("id")
                .order("id", desc=True)
                .limit(1)
                .execute()
            )
            max_id = 0
            if max_id_result and max_id_result.data:
                max_id = int(max_id_result.data[0]["id"])
            retry_payload = {**payload, "id": max_id + 1}
            place_result = supabase_admin.table("places").insert(retry_payload).execute()
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    if not place_result or not place_result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Place creation failed")

    place = place_result.data[0]
    place_id = place["id"]

    if payload.get("category") == "restaurant" and restaurant_details:
        supabase_admin.table("restaurant_details").upsert({"place_id": place_id, **restaurant_details}).execute()

    if payload.get("category") == "stay" and stay_details:
        supabase_admin.table("stay_details").upsert({"place_id": place_id, **stay_details}).execute()

    return place


def update_place(place_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    category = payload.get("category")
    if category and category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")

    restaurant_details = payload.pop("restaurant_details", None)
    stay_details = payload.pop("stay_details", None)

    image_urls = payload.get("image_urls")
    if "image_urls" in payload and image_urls is None:
        payload.pop("image_urls", None)
    elif isinstance(image_urls, str):
        payload["image_urls"] = [image_urls]

    video_urls = payload.get("video_urls")
    if "video_urls" in payload and video_urls is None:
        payload.pop("video_urls", None)
    elif isinstance(video_urls, str):
        payload["video_urls"] = [video_urls]

    result = supabase_admin.table("places").update(payload).eq("id", place_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    if restaurant_details is not None:
        supabase_admin.table("restaurant_details").upsert({"place_id": place_id, **restaurant_details}).execute()

    if stay_details is not None:
        supabase_admin.table("stay_details").upsert({"place_id": place_id, **stay_details}).execute()

    return result.data[0]


def delete_place(place_id: int) -> Dict[str, Any]:
    result = supabase_admin.table("places").delete().eq("id", place_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data[0]


def list_my_submissions(user_id: str) -> List[Dict[str, Any]]:
    try:
        result = (
            supabase_admin.table("places")
            .select("id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating,approval_status,submitted_by,approved_by,approved_at,rejection_reason")
            .eq("submitted_by", user_id)
            .order("id", desc=True)
            .execute()
        )
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    return result.data or []


def update_my_submission(place_id: int, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    existing = (
        supabase_admin.table("places")
        .select("id,submitted_by,approval_status")
        .eq("id", place_id)
        .single()
        .execute()
    )
    if not existing or not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    place = existing.data
    if place.get("submitted_by") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own submissions")

    current_status = place.get("approval_status")
    if current_status not in {"pending", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending or rejected submissions can be edited",
        )

    category = payload.get("category")
    if category and category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")

    restaurant_details = payload.pop("restaurant_details", None)
    stay_details = payload.pop("stay_details", None)

    image_urls = payload.get("image_urls")
    if "image_urls" in payload and image_urls is None:
        payload.pop("image_urls", None)
    elif isinstance(image_urls, str):
        payload["image_urls"] = [image_urls]

    video_urls = payload.get("video_urls")
    if "video_urls" in payload and video_urls is None:
        payload.pop("video_urls", None)
    elif isinstance(video_urls, str):
        payload["video_urls"] = [video_urls]

    result = supabase_admin.table("places").update(payload).eq("id", place_id).eq("submitted_by", user_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    if restaurant_details is not None:
        supabase_admin.table("restaurant_details").upsert({"place_id": place_id, **restaurant_details}).execute()

    if stay_details is not None:
        supabase_admin.table("stay_details").upsert({"place_id": place_id, **stay_details}).execute()

    return result.data[0]


def resubmit_my_submission(place_id: int, user_id: str) -> Dict[str, Any]:
    existing = (
        supabase_admin.table("places")
        .select("id,submitted_by,approval_status")
        .eq("id", place_id)
        .single()
        .execute()
    )
    if not existing or not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    place = existing.data
    if place.get("submitted_by") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only resubmit your own submissions")

    if place.get("approval_status") != "rejected":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only rejected submissions can be resubmitted")

    payload = {
        "approval_status": "pending",
        "approved_by": None,
        "approved_at": None,
        "rejection_reason": None,
    }
    result = supabase_admin.table("places").update(payload).eq("id", place_id).eq("submitted_by", user_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data[0]


def list_pending_places() -> List[Dict[str, Any]]:
    try:
        result = (
            supabase_admin.table("places")
            .select("id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating,approval_status,submitted_by,approved_by,approved_at,rejection_reason")
            .eq("approval_status", "pending")
            .order("id", desc=False)
            .execute()
        )
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    return result.data or []


def approve_place(place_id: int, admin_user_id: str) -> Dict[str, Any]:
    payload = {
        "approval_status": "approved",
        "approved_by": admin_user_id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": None,
    }
    try:
        result = supabase_admin.table("places").update(payload).eq("id", place_id).execute()
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data[0]


def reject_place(place_id: int, admin_user_id: str, rejection_reason: Optional[str] = None) -> Dict[str, Any]:
    payload = {
        "approval_status": "rejected",
        "approved_by": admin_user_id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": rejection_reason or None,
    }
    try:
        result = supabase_admin.table("places").update(payload).eq("id", place_id).execute()
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data[0]
