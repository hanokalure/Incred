from typing import List, Dict, Any
from fastapi import HTTPException, status

from ..database import supabase_admin, supabase_anon


def create_review(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    insert_data = {**payload, "user_id": user_id}
    result = supabase_admin.table("reviews").insert(insert_data).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review creation failed")

    # Update average rating for the place
    place_id = payload["place_id"]
    avg = supabase_anon.table("reviews").select("rating").eq("place_id", place_id).execute()
    if avg and avg.data:
        ratings = [r["rating"] for r in avg.data]
        avg_rating = sum(ratings) / len(ratings)
        supabase_admin.table("places").update({"avg_rating": round(avg_rating, 2)}).eq("id", place_id).execute()

    return result.data[0]


def list_reviews(place_id: int) -> List[Dict[str, Any]]:
    result = (
        supabase_anon.table("reviews")
        .select("id,place_id,user_id,rating,comment,image_url,created_at")
        .eq("place_id", place_id)
        .order("created_at", desc=True)
        .execute()
    )
    reviews = result.data or []
    if not reviews:
        return []

    user_ids = list({review["user_id"] for review in reviews if review.get("user_id")})
    users_result = (
        supabase_admin.table("users")
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
