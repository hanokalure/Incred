from typing import List, Dict, Any
from fastapi import HTTPException, status

from ..database import supabase_admin
from postgrest.exceptions import APIError


def add_favorite(user_id: str, place_id: int) -> Dict[str, Any]:
    try:
        result = supabase_admin.table("favorites").insert({"user_id": user_id, "place_id": place_id}).execute()
        if not result or not result.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to add favorite")
        return result.data[0]
    except APIError as e:
        # Handle "already saved" gracefully (unique constraint on user_id, place_id).
        payload = e.args[0] if e.args else {}
        code = payload.get("code") if isinstance(payload, dict) else None
        message = payload.get("message") if isinstance(payload, dict) else str(e)
        if code == "23505" or "duplicate key" in (message or "").lower():
            existing = (
                supabase_admin.table("favorites")
                .select("id,user_id,place_id,created_at")
                .eq("user_id", user_id)
                .eq("place_id", place_id)
                .maybe_single()
                .execute()
            )
            if existing and existing.data:
                return existing.data
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already saved")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


def list_favorites(user_id: str) -> List[Dict[str, Any]]:
    result = supabase_admin.table("favorites").select("id,user_id,place_id,created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data or []


def list_favorite_places(user_id: str) -> List[Dict[str, Any]]:
    """
    Return saved places for the given user (server-side join).
    This avoids client-side "fetch all places then filter" issues and type mismatches.
    """
    result = (
        supabase_admin.table("favorites")
        .select("place:places(id,name,district_id,category,description,address,latitude,longitude,image_urls,video_urls,avg_rating)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []
    places: List[Dict[str, Any]] = []
    for r in rows:
        p = r.get("place") if isinstance(r, dict) else None
        if p:
            places.append(p)
    return places


def delete_favorite(user_id: str, favorite_id: int) -> Dict[str, Any]:
    result = supabase_admin.table("favorites").delete().eq("id", favorite_id).eq("user_id", user_id).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    return result.data[0]
