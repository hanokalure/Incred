from typing import List, Dict, Any
from fastapi import HTTPException, status

from ..database import get_supabase_client


async def create_review(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    insert_data = {**payload, "user_id": user_id}
    admin = await get_supabase_client(anon=False)
    supabase = await get_supabase_client(anon=True)
    
    result = await admin.table("reviews").insert(insert_data).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review creation failed")

    # Update average rating for the place
    place_id = payload["place_id"]
    avg = await supabase.table("reviews").select("rating").eq("place_id", place_id).execute()
    if avg and avg.data:
        ratings = [r["rating"] for r in avg.data]
        avg_rating = sum(ratings) / len(ratings)
        await admin.table("places").update({"avg_rating": round(avg_rating, 2)}).eq("id", place_id).execute()

    return result.data[0]


async def list_reviews(place_id: int) -> List[Dict[str, Any]]:
    supabase = await get_supabase_client(anon=True)
    admin = await get_supabase_client(anon=False)
    
    result = await (
        supabase.table("reviews")
        .select("id,place_id,user_id,rating,comment,image_url,created_at")
        .eq("place_id", place_id)
        .order("created_at", desc=True)
        .execute()
    )
    reviews = result.data or []
    if not reviews:
        return []

    user_ids = list({review["user_id"] for review in reviews if review.get("user_id")})
    users_result = await (
        admin.table("users")
        .select("id,name,email")
        .in_("id", user_ids)
        .execute()
        if user_ids
        else None
    )
    user_name_by_id = {}
    if users_result and users_result.data:
        for user in users_result.data:
            display_name = user.get("name")
            if not display_name:
                email = user.get("email") or ""
                display_name = email.split("@")[0] if "@" in email else None
            user_name_by_id[user["id"]] = display_name

    for review in reviews:
        review["user_name"] = user_name_by_id.get(review.get("user_id"))

    return reviews

async def list_user_reviews(user_id: str) -> List[Dict[str, Any]]:
    supabase = await get_supabase_client(anon=True)
    admin = await get_supabase_client(anon=False)

    result = await (
        supabase.table("reviews")
        .select("id,place_id,user_id,rating,comment,image_url,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    reviews = result.data or []
    if not reviews:
        return []

    place_ids = list({review["place_id"] for review in reviews if review.get("place_id")})
    places_result = await (
        admin.table("places")
        .select("id,name")
        .in_("id", place_ids)
        .execute()
        if place_ids
        else None
    )
    place_name_by_id = {}
    if places_result and places_result.data:
        for p in places_result.data:
            place_name_by_id[p["id"]] = p["name"]

    for review in reviews:
        review["place_name"] = place_name_by_id.get(review.get("place_id"), "Unknown Place")

    return reviews
