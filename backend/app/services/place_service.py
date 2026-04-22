from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from postgrest.exceptions import APIError
from datetime import datetime, timezone

from ..database import get_supabase_client
from . import notification_service


ALLOWED_CATEGORIES = {
    "restaurant",
    "generational_shop",
    "tourist_place",
    "hidden_gem",
    "stay",
}

VIDEO_EXTENSIONS = (".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv")


async def list_place_categories() -> List[str]:
    supabase = await get_supabase_client(anon=True)
    result = await (
        supabase.table("places")
        .select("category")
        .eq("approval_status", "approved")
        .order("category")
        .execute()
    )
    rows = result.data or []
    categories = []
    for row in rows:
        category = row.get("category")
        if category and category not in categories:
            categories.append(category)

    allowed_sorted = sorted(ALLOWED_CATEGORIES)
    return categories or allowed_sorted


def _normalize_media_arrays(payload: Dict[str, Any]) -> None:
    image_urls = payload.get("image_urls")
    if "image_urls" in payload and image_urls is None:
        payload.pop("image_urls", None)
    elif image_urls is None:
        payload.pop("image_urls", None)
    elif isinstance(image_urls, str):
        payload["image_urls"] = [image_urls]

    video_urls = payload.get("video_urls")
    if "video_urls" in payload and video_urls is None:
        payload.pop("video_urls", None)
    elif video_urls is None:
        payload.pop("video_urls", None)
    elif isinstance(video_urls, str):
        payload["video_urls"] = [video_urls]


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


def _is_missing_column_error(error: APIError, column_name: str) -> bool:
    payload_error = error.args[0] if error.args else {}
    code = payload_error.get("code") if isinstance(payload_error, dict) else None
    message = payload_error.get("message") if isinstance(payload_error, dict) else str(error)
    return code == "PGRST204" and column_name in (message or "")


def _infer_submission_media(row: Dict[str, Any]) -> Dict[str, Any]:
    media_url = row.get("media_url") or row.get("video_url") or row.get("image_url")
    media_type = row.get("media_type")
    if not media_type:
        lower_url = (media_url or "").lower()
        media_type = "video" if lower_url.endswith(VIDEO_EXTENSIONS) else "image"

    row["media_type"] = media_type
    row["media_url"] = media_url
    row["image_url"] = media_url if media_type == "image" else None
    row["video_url"] = media_url if media_type == "video" else None
    return row


async def _fetch_place_media_submission(submission_id: int) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    try:
        result = await (
            admin.table("place_photo_submissions")
            .select("id,place_id,media_type,media_url,image_url,video_url,status")
            .eq("id", submission_id)
            .single()
            .execute()
        )
        row = result.data if result else None
    except APIError as error:
        if not (
            _is_missing_column_error(error, "media_type")
            or _is_missing_column_error(error, "media_url")
            or _is_missing_column_error(error, "video_url")
        ):
            raise
        legacy_result = await (
            admin.table("place_photo_submissions")
            .select("id,place_id,image_url,status")
            .eq("id", submission_id)
            .single()
            .execute()
        )
        row = legacy_result.data if legacy_result else None

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo submission not found")
    return _infer_submission_media(row)


async def list_places(district_id: Optional[int] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    supabase = await get_supabase_client(anon=True)
    query = supabase.table("places").select("id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating,approval_status,submitted_by,approved_by,approved_at,rejection_reason")
    query = query.eq("approval_status", "approved")

    if district_id is not None:
        query = query.eq("district_id", district_id)
    if category is not None:
        query = query.eq("category", category)

    try:
        result = await query.order("id", desc=True).execute()
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    return result.data or []


async def get_place(place_id: int) -> Dict[str, Any]:
    supabase = await get_supabase_client(anon=True)
    try:
        result = await (
            supabase.table("places")
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


async def create_place(payload: Dict[str, Any], user_id: str, user_role: str) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    if payload.get("category") not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")

    restaurant_details = payload.pop("restaurant_details", None)
    stay_details = payload.pop("stay_details", None)

    _normalize_media_arrays(payload)

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
        place_result = await admin.table("places").insert(payload).execute()
    except APIError as e:
        _raise_if_missing_approval_columns(e)
        payload_error = e.args[0] if e.args else {}
        code = payload_error.get("code") if isinstance(payload_error, dict) else None
        message = payload_error.get("message") if isinstance(payload_error, dict) else str(e)

        # If the serial sequence drifts, recover by explicitly choosing the next id.
        if code == "23505" and 'places_pkey' in (message or ''):
            max_id_result = await (
                admin.table("places")
                .select("id")
                .order("id", desc=True)
                .limit(1)
                .execute()
            )
            max_id = 0
            if max_id_result and max_id_result.data:
                max_id = int(max_id_result.data[0]["id"])
            retry_payload = {**payload, "id": max_id + 1}
            place_result = await admin.table("places").insert(retry_payload).execute()
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    if not place_result or not place_result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Place creation failed")

    place = place_result.data[0]
    place_id = place["id"]

    if payload.get("category") == "restaurant" and restaurant_details:
        await admin.table("restaurant_details").upsert({"place_id": place_id, **restaurant_details}).execute()

    if payload.get("category") == "stay" and stay_details:
        await admin.table("stay_details").upsert({"place_id": place_id, **stay_details}).execute()

    return place


async def update_place(place_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    category = payload.get("category")
    if category and category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")

    restaurant_details = payload.pop("restaurant_details", None)
    stay_details = payload.pop("stay_details", None)

    _normalize_media_arrays(payload)

    result = await admin.table("places").update(payload).eq("id", place_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    if restaurant_details is not None:
        await admin.table("restaurant_details").upsert({"place_id": place_id, **restaurant_details}).execute()

    if stay_details is not None:
        await admin.table("stay_details").upsert({"place_id": place_id, **stay_details}).execute()

    return result.data[0]


async def delete_place(place_id: int) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    result = await admin.table("places").delete().eq("id", place_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data[0]


async def list_my_submissions(user_id: str) -> List[Dict[str, Any]]:
    admin = await get_supabase_client(anon=False)
    try:
        result = await (
            admin.table("places")
            .select("id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating,approval_status,submitted_by,approved_by,approved_at,rejection_reason")
            .eq("submitted_by", user_id)
            .order("id", desc=True)
            .execute()
        )
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    return result.data or []


async def update_my_submission(place_id: int, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    existing = await (
        admin.table("places")
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

    _normalize_media_arrays(payload)

    result = await admin.table("places").update(payload).eq("id", place_id).eq("submitted_by", user_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    if restaurant_details is not None:
        await admin.table("restaurant_details").upsert({"place_id": place_id, **restaurant_details}).execute()

    if stay_details is not None:
        await admin.table("stay_details").upsert({"place_id": place_id, **stay_details}).execute()

    return result.data[0]


async def resubmit_my_submission(place_id: int, user_id: str) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    existing = await (
        admin.table("places")
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
    result = await admin.table("places").update(payload).eq("id", place_id).eq("submitted_by", user_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data[0]


async def list_pending_places() -> List[Dict[str, Any]]:
    admin = await get_supabase_client(anon=False)
    try:
        result = await (
            admin.table("places")
            .select("id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating,approval_status,submitted_by,approved_by,approved_at,rejection_reason")
            .eq("approval_status", "pending")
            .order("id", desc=False)
            .execute()
        )
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    return result.data or []


async def approve_place(place_id: int, admin_user_id: str) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    payload = {
        "approval_status": "approved",
        "approved_by": admin_user_id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": None,
    }
    try:
        result = await admin.table("places").update(payload).eq("id", place_id).execute()
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    
    place = result.data[0]
    if place.get("submitted_by"):
        await notification_service.create_notification(
            user_id=place["submitted_by"],
            title="Place Approved! 🎉",
            body=f'Your submission "{place["name"]}" has been approved and is now live.',
            n_type="place_approval",
            related_id=place_id
        )
    return place


async def reject_place(place_id: int, admin_user_id: str, rejection_reason: Optional[str] = None) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    payload = {
        "approval_status": "rejected",
        "approved_by": admin_user_id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": rejection_reason or None,
    }
    try:
        result = await admin.table("places").update(payload).eq("id", place_id).execute()
    except APIError as error:
        _raise_if_missing_approval_columns(error)
        raise
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    
    place = result.data[0]
    if place.get("submitted_by"):
        reason_text = f"\nReason: {rejection_reason}" if rejection_reason else ""
        await notification_service.create_notification(
            user_id=place["submitted_by"],
            title="Place Submission Update",
            body=f'Your submission "{place["name"]}" was not approved at this time.{reason_text}',
            n_type="place_rejection",
            related_id=place_id
        )
    return place


async def submit_place_photo(place_id: int, user_id: str, media_type: str, media_url: str) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    if not media_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Media URL is required")
    place_result = await (
        admin.table("places")
        .select("id,approval_status")
        .eq("id", place_id)
        .single()
        .execute()
    )
    if not place_result or not place_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    if place_result.data.get("approval_status") != "approved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can only add media to approved places")
    if media_type not in {"image", "video"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media type")

    insert_payload = {
        "place_id": place_id,
        "media_type": media_type,
        "media_url": media_url,
        "image_url": media_url,
        "video_url": media_url if media_type == "video" else None,
        "submitted_by": user_id,
        "status": "pending",
        "reviewed_by": None,
        "reviewed_at": None,
        "rejection_reason": None,
    }
    try:
        result = await admin.table("place_photo_submissions").insert(insert_payload).execute()
    except APIError as error:
        if not (
            _is_missing_column_error(error, "media_type")
            or _is_missing_column_error(error, "media_url")
            or _is_missing_column_error(error, "video_url")
        ):
            raise
        legacy_payload = {
            "place_id": place_id,
            "image_url": media_url,
            "submitted_by": user_id,
            "status": "pending",
            "reviewed_by": None,
            "reviewed_at": None,
            "rejection_reason": None,
        }
        result = await admin.table("place_photo_submissions").insert(legacy_payload).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo submission failed")
    return _infer_submission_media(result.data[0])


async def list_pending_place_photo_submissions() -> List[Dict[str, Any]]:
    admin = await get_supabase_client(anon=False)
    try:
        result = await (
            admin.table("place_photo_submissions")
            .select("id,place_id,media_type,media_url,image_url,video_url,submitted_by,status,reviewed_by,reviewed_at,rejection_reason,created_at")
            .eq("status", "pending")
            .order("created_at", desc=False)
            .execute()
        )
        rows = result.data or []
    except APIError as error:
        if not (
            _is_missing_column_error(error, "media_type")
            or _is_missing_column_error(error, "media_url")
            or _is_missing_column_error(error, "video_url")
        ):
            raise
        legacy_result = await (
            admin.table("place_photo_submissions")
            .select("id,place_id,image_url,submitted_by,status,reviewed_by,reviewed_at,rejection_reason,created_at")
            .eq("status", "pending")
            .order("created_at", desc=False)
            .execute()
        )
        rows = legacy_result.data or []
    if not rows:
        return []

    place_ids = list({row["place_id"] for row in rows if row.get("place_id") is not None})
    user_ids = list({row["submitted_by"] for row in rows if row.get("submitted_by")})

    places_res = await (
        admin.table("places").select("id,name").in_("id", place_ids).execute()
        if place_ids
        else None
    )
    places = places_res.data if places_res else []
    
    users_res = await (
        admin.table("users").select("id,name,email").in_("id", user_ids).execute()
        if user_ids
        else None
    )
    users = users_res.data if users_res else []

    place_name_by_id = {place["id"]: place.get("name") for place in (places or [])}
    user_name_by_id = {}
    for user in users or []:
        display_name = user.get("name") or ((user.get("email") or "").split("@")[0] if user.get("email") else None)
        user_name_by_id[user["id"]] = display_name

    for row in rows:
        _infer_submission_media(row)
        row["place_name"] = place_name_by_id.get(row.get("place_id"))
        row["submitted_by_name"] = user_name_by_id.get(row.get("submitted_by"))

    return rows


async def approve_place_photo_submission(submission_id: int, admin_user_id: str) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    submission = await _fetch_place_media_submission(submission_id)
    if submission.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo submission is not pending")

    place_res = await (
        admin.table("places")
        .select("id,image_urls,video_urls")
        .eq("id", submission["place_id"])
        .single()
        .execute()
    )
    if not place_res or not place_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    if submission.get("media_type") == "video":
        video_urls = list(place_res.data.get("video_urls") or [])
        video_url = submission.get("video_url") or submission.get("media_url")
        if video_url and video_url not in video_urls:
            video_urls.append(video_url)
            await admin.table("places").update({"video_urls": video_urls}).eq("id", submission["place_id"]).execute()
    else:
        image_urls = list(place_res.data.get("image_urls") or [])
        image_url = submission.get("image_url") or submission.get("media_url")
        if image_url and image_url not in image_urls:
            image_urls.append(image_url)
            await admin.table("places").update({"image_urls": image_urls}).eq("id", submission["place_id"]).execute()

    result = await (
        admin.table("place_photo_submissions")
        .update(
            {
                "status": "approved",
                "reviewed_by": admin_user_id,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "rejection_reason": None,
            }
        )
        .eq("id", submission_id)
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo submission not found")
    return result.data[0]


async def reject_place_photo_submission(submission_id: int, admin_user_id: str, rejection_reason: Optional[str] = None) -> Dict[str, Any]:
    admin = await get_supabase_client(anon=False)
    existing = await (
        admin.table("place_photo_submissions")
        .select("id,status")
        .eq("id", submission_id)
        .single()
        .execute()
    )
    if not existing or not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo submission not found")
    if existing.data.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo submission is not pending")

    result = await (
        admin.table("place_photo_submissions")
        .update(
            {
                "status": "rejected",
                "reviewed_by": admin_user_id,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "rejection_reason": rejection_reason or None,
            }
        )
        .eq("id", submission_id)
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo submission not found")
    return result.data[0]
