from collections import Counter, defaultdict
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
    users = (
        supabase_admin.table("users")
        .select("id,name,email,role,created_at")
        .order("created_at", desc=True)
        .execute()
    )
    data = users.data or []
    return {
        "users": data,
        "summary": {
            "total": len(data),
            "admins": sum(1 for user in data if user.get("role") == "admin"),
            "members": sum(1 for user in data if user.get("role") == "user"),
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
