from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List

from ..database import supabase_admin


def _fetch_rows(table: str, columns: str) -> List[Dict[str, Any]]:
    result = supabase_admin.table(table).select(columns).execute()
    return result.data or []


def get_admin_dashboard() -> Dict[str, Any]:
    places = _fetch_rows("places", "id,name,category,district_id,address,image_urls,avg_rating")
    users = _fetch_rows("users", "id,name,email,role,created_at")
    reviews = _fetch_rows("reviews", "id,rating")
    itineraries = _fetch_rows("itineraries", "id")

    recent_places = (
        supabase_admin.table("places")
        .select("id,name,category,district_id,address,image_urls,avg_rating")
        .order("id", desc=True)
        .limit(8)
        .execute()
    )

    return {
        "stats": {
            "total_places": len(places),
            "total_users": len(users),
            "total_reviews": len(reviews),
            "total_itineraries": len(itineraries),
        },
        "recent_places": recent_places.data or [],
    }


def get_admin_users() -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    users = (
        supabase_admin.table("users")
        .select("id,name,email,role,created_at")
        .order("created_at", desc=True)
        .execute()
    )
    data = users.data or []
    active_stories = (
        supabase_admin.table("stories")
        .select("id,user_id,media_type,media_url,caption,status,expires_at,created_at")
        .eq("status", "active")
        .gt("expires_at", now_iso)
        .order("created_at", desc=True)
        .execute()
    )
    stories = active_stories.data or []
    reviews = _fetch_rows("reviews", "id,user_id")
    favorites = _fetch_rows("favorites", "id,user_id")
    itineraries = _fetch_rows("itineraries", "id,user_id")
    submitted_places = _fetch_rows("places", "id,submitted_by")

    review_count_by_user: defaultdict[str, int] = defaultdict(int)
    favorite_count_by_user: defaultdict[str, int] = defaultdict(int)
    itinerary_count_by_user: defaultdict[str, int] = defaultdict(int)
    place_submission_count_by_user: defaultdict[str, int] = defaultdict(int)
    for review in reviews:
        if review.get("user_id"):
            review_count_by_user[review["user_id"]] += 1
    for favorite in favorites:
        if favorite.get("user_id"):
            favorite_count_by_user[favorite["user_id"]] += 1
    for itinerary in itineraries:
        if itinerary.get("user_id"):
            itinerary_count_by_user[itinerary["user_id"]] += 1
    for place in submitted_places:
        if place.get("submitted_by"):
            place_submission_count_by_user[place["submitted_by"]] += 1

    stories_by_user: defaultdict[str, List[Dict[str, Any]]] = defaultdict(list)
    for story in stories:
        user_id = story.get("user_id")
        if user_id:
            stories_by_user[user_id].append(story)

    for user in data:
        user_stories = stories_by_user.get(user["id"], [])
        user["active_story_count"] = len(user_stories)
        user["latest_story"] = user_stories[0] if user_stories else None
        user["active_stories"] = user_stories
        user["review_count"] = review_count_by_user.get(user["id"], 0)
        user["favorite_count"] = favorite_count_by_user.get(user["id"], 0)
        user["itinerary_count"] = itinerary_count_by_user.get(user["id"], 0)
        user["place_submission_count"] = place_submission_count_by_user.get(user["id"], 0)

    return {
        "users": data,
        "summary": {
            "total": len(data),
            "admins": sum(1 for user in data if user.get("role") == "admin"),
            "members": sum(1 for user in data if user.get("role") == "user"),
            "users_with_active_stories": sum(1 for user in data if user.get("active_story_count")),
        },
    }


def get_admin_analytics() -> Dict[str, Any]:
    places = _fetch_rows("places", "id,category,district_id,image_urls,latitude,longitude,avg_rating")
    districts = _fetch_rows("districts", "id,name")
    reviews = _fetch_rows("reviews", "id,rating")
    favorites = _fetch_rows("favorites", "id,place_id")
    itineraries = _fetch_rows("itineraries", "id,district_id")

    district_name_by_id = {district["id"]: district["name"] for district in districts}

    category_counts = Counter(place.get("category") or "unknown" for place in places)
    district_counts: defaultdict[int, int] = defaultdict(int)
    for place in places:
        if place.get("district_id") is not None:
            district_counts[place["district_id"]] += 1

    avg_rating = None
    rated_reviews = [review["rating"] for review in reviews if review.get("rating") is not None]
    if rated_reviews:
        avg_rating = round(sum(rated_reviews) / len(rated_reviews), 2)

    return {
        "overview": {
            "places_with_images": sum(1 for place in places if place.get("image_urls")),
            "places_with_coordinates": sum(
                1
                for place in places
                if place.get("latitude") is not None and place.get("longitude") is not None
            ),
            "favorites_count": len(favorites),
            "average_review_rating": avg_rating,
            "itineraries_count": len(itineraries),
        },
        "categories": [
            {"key": key, "count": count}
            for key, count in sorted(category_counts.items(), key=lambda item: item[1], reverse=True)
        ],
        "districts": [
            {"district_id": district_id, "name": district_name_by_id.get(district_id, f"District {district_id}"), "count": count}
            for district_id, count in sorted(district_counts.items(), key=lambda item: item[1], reverse=True)
        ],
    }


def get_admin_settings() -> Dict[str, Any]:
    places = _fetch_rows("places", "id,description,image_urls,latitude,longitude")
    districts = _fetch_rows("districts", "id,name")

    return {
        "data_quality": {
            "districts_configured": len(districts),
            "places_missing_description": sum(1 for place in places if not (place.get("description") or "").strip()),
            "places_missing_images": sum(1 for place in places if not place.get("image_urls")),
            "places_missing_coordinates": sum(
                1
                for place in places
                if place.get("latitude") is None or place.get("longitude") is None
            ),
        },
        "districts": districts,
    }
