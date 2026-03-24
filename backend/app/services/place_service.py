from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from ..database import supabase_anon, supabase_admin


ALLOWED_CATEGORIES = {
    "restaurant",
    "generational_shop",
    "tourist_place",
    "hidden_gem",
    "stay",
}


def list_places(district_id: Optional[int] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    query = supabase_anon.table("places").select("id,name,district_id,category,description,address,latitude,longitude,image_urls,avg_rating")

    if district_id is not None:
        query = query.eq("district_id", district_id)
    if category is not None:
        query = query.eq("category", category)

    result = query.order("name").execute()
    return result.data or []


def get_place(place_id: int) -> Dict[str, Any]:
    # Include nested details if present (via FK place_id)
    result = (
        supabase_anon.table("places")
        .select("id,name,district_id,category,description,address,latitude,longitude,image_urls,avg_rating,restaurant_details(*),stay_details(*)")
        .eq("id", place_id)
        .single()
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return result.data


def create_place(payload: Dict[str, Any]) -> Dict[str, Any]:
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

    try:
        place_result = supabase_admin.table("places").insert(payload).execute()
    except APIError as e:
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
