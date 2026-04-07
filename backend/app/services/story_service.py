from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from ..database import supabase_admin, supabase_anon

STORY_TTL_HOURS = 24
VALID_MEDIA_TYPES = {"image", "video"}
ACTIVE_STATUSES = {"active"}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _expires_at_iso() -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=STORY_TTL_HOURS)).isoformat()


def _display_name(user: Dict[str, Any]) -> str | None:
    name = user.get("name")
    if name:
        return name
    email = user.get("email") or ""
    if "@" in email:
        return email.split("@")[0]
    return None


def _attach_user_names(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    user_ids = list({row.get("user_id") for row in rows if row.get("user_id")})
    if not user_ids:
        return rows

    users_result = supabase_admin.table("users").select("id,name,email").in_("id", user_ids).execute()
    users = users_result.data or []
    user_name_by_id = {user["id"]: _display_name(user) for user in users}

    for row in rows:
        row["user_name"] = user_name_by_id.get(row.get("user_id"))
    return rows


def _load_story_views(
    story_ids: List[int], viewer_user_id: Optional[str] = None
) -> tuple[Dict[int, int], set[int], Dict[int, List[str]]]:
    if not story_ids:
        return {}, set(), {}

    views_result = supabase_admin.table("story_views").select("story_id,viewer_id").in_("story_id", story_ids).execute()
    rows = views_result.data or []
    counts: Dict[int, int] = defaultdict(int)
    seen: set[int] = set()
    viewer_ids = list({row.get("viewer_id") for row in rows if row.get("viewer_id")})
    users_result = (
        supabase_admin.table("users").select("id,name,email").in_("id", viewer_ids).execute()
        if viewer_ids
        else None
    )
    viewer_name_by_id = {user["id"]: _display_name(user) for user in (users_result.data or [])}
    viewer_names_by_story: Dict[int, List[str]] = defaultdict(list)
    for row in rows:
        story_id = row.get("story_id")
        if story_id is None:
            continue
        counts[story_id] += 1
        viewer_name = viewer_name_by_id.get(row.get("viewer_id"))
        if viewer_name and viewer_name not in viewer_names_by_story[story_id]:
            viewer_names_by_story[story_id].append(viewer_name)
        if viewer_user_id and row.get("viewer_id") == viewer_user_id:
            seen.add(story_id)
    return counts, seen, viewer_names_by_story


def _enrich_stories(rows: List[Dict[str, Any]], viewer_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    rows = _attach_user_names(rows)
    story_ids = [row["id"] for row in rows if row.get("id") is not None]
    counts, seen, viewer_names_by_story = _load_story_views(story_ids, viewer_user_id=viewer_user_id)
    for row in rows:
        story_id = row.get("id")
        row["view_count"] = counts.get(story_id, 0)
        row["seen_by_me"] = story_id in seen if viewer_user_id else False
        row["viewer_names"] = viewer_names_by_story.get(story_id, [])
    return rows


def _get_story_for_read(story_id: int) -> Dict[str, Any]:
    result = (
        supabase_admin.table("stories")
        .select("id,user_id,media_type,media_url,caption,status,is_highlighted,expires_at,created_at")
        .eq("id", story_id)
        .single()
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    return result.data


def _get_story_for_owner_action(story_id: int, user_id: str, allow_admin: bool = False, actor_role: str | None = None) -> Dict[str, Any]:
    story = _get_story_for_read(story_id)
    if story["user_id"] != user_id and not (allow_admin and actor_role == "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to modify this story")
    return story


def create_story(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    media_type = (payload.get("media_type") or "").strip().lower()
    media_url = (payload.get("media_url") or "").strip()
    caption = (payload.get("caption") or "").strip() or None

    if media_type not in VALID_MEDIA_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="media_type must be image or video")
    if not media_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="media_url is required")

    insert_payload = {
        "user_id": user_id,
        "media_type": media_type,
        "media_url": media_url,
        "caption": caption,
        "status": "active",
        "expires_at": _expires_at_iso(),
    }
    result = supabase_admin.table("stories").insert(insert_payload).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Story creation failed")

    story = result.data[0]
    return _enrich_stories([story], viewer_user_id=user_id)[0]


def list_story_feed(viewer_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    now_iso = _utc_now_iso()
    result = (
        supabase_anon.table("stories")
        .select("id,user_id,media_type,media_url,caption,status,is_highlighted,expires_at,created_at")
        .in_("status", list(ACTIVE_STATUSES))
        .gt("expires_at", now_iso)
        .order("created_at", desc=False)
        .execute()
    )
    stories = _enrich_stories(result.data or [], viewer_user_id=viewer_user_id)
    if not stories:
        return []

    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for story in stories:
        grouped[story["user_id"]].append(story)

    feed = []
    for user_id, user_stories in grouped.items():
        latest_created_at = max((story.get("created_at") or "" for story in user_stories), default=None)
        feed.append(
            {
                "user_id": user_id,
                "user_name": user_stories[0].get("user_name"),
                "stories": user_stories,
                "latest_created_at": latest_created_at,
            }
        )

    feed.sort(key=lambda item: item.get("latest_created_at") or "", reverse=True)
    return feed


def list_my_active_stories(user_id: str) -> List[Dict[str, Any]]:
    now_iso = _utc_now_iso()
    result = (
        supabase_admin.table("stories")
        .select("id,user_id,media_type,media_url,caption,status,is_highlighted,expires_at,created_at")
        .eq("user_id", user_id)
        .in_("status", list(ACTIVE_STATUSES))
        .gt("expires_at", now_iso)
        .order("created_at", desc=True)
        .execute()
    )
    return _enrich_stories(result.data or [], viewer_user_id=user_id)


def list_my_story_archive(user_id: str) -> List[Dict[str, Any]]:
    now_iso = _utc_now_iso()
    result = (
        supabase_admin.table("stories")
        .select("id,user_id,media_type,media_url,caption,status,is_highlighted,expires_at,created_at")
        .eq("user_id", user_id)
        .or_(f"expires_at.lte.{now_iso},is_highlighted.eq.true")
        .order("created_at", desc=True)
        .execute()
    )
    return _enrich_stories(result.data or [], viewer_user_id=user_id)


def record_story_view(story_id: int, viewer_user_id: str) -> Dict[str, Any]:
    story = _get_story_for_read(story_id)
    if story.get("status") not in ACTIVE_STATUSES or (story.get("expires_at") and story["expires_at"] <= _utc_now_iso()):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story is not active")

    existing = (
        supabase_admin.table("story_views")
        .select("id")
        .eq("story_id", story_id)
        .eq("viewer_id", viewer_user_id)
        .limit(1)
        .execute()
    )
    if not (existing and existing.data):
        supabase_admin.table("story_views").insert({"story_id": story_id, "viewer_id": viewer_user_id}).execute()
    return {"story_id": story_id, "viewer_id": viewer_user_id, "seen": True}


def report_story(story_id: int, reported_by: str, reason: str) -> Dict[str, Any]:
    story = _get_story_for_read(story_id)
    if story["user_id"] == reported_by:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot report your own story")

    existing = (
        supabase_admin.table("story_reports")
        .select("id,status")
        .eq("story_id", story_id)
        .eq("reported_by", reported_by)
        .in_("status", ["open", "resolved"])
        .limit(1)
        .execute()
    )
    if existing and existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already reported this story")

    result = supabase_admin.table("story_reports").insert({
        "story_id": story_id,
        "reported_by": reported_by,
        "reason": reason.strip(),
        "status": "open",
    }).execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Story report failed")
    return result.data[0]


def set_story_highlight(story_id: int, user_id: str, is_highlighted: bool) -> Dict[str, Any]:
    _get_story_for_owner_action(story_id, user_id)
    result = (
        supabase_admin.table("stories")
        .update({"is_highlighted": is_highlighted})
        .eq("id", story_id)
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Story update failed")
    return _enrich_stories(result.data, viewer_user_id=user_id)[0]


def delete_story(story_id: int, user_id: str, actor_role: str | None = None) -> Dict[str, Any]:
    _get_story_for_owner_action(story_id, user_id, allow_admin=True, actor_role=actor_role)
    result = (
        supabase_admin.table("stories")
        .update({"status": "deleted", "is_highlighted": False})
        .eq("id", story_id)
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Story delete failed")
    return _enrich_stories(result.data, viewer_user_id=user_id)[0]


def list_story_reports() -> List[Dict[str, Any]]:
    reports_result = (
        supabase_admin.table("story_reports")
        .select("id,story_id,reported_by,reason,status,created_at,reviewed_at,reviewed_by,admin_note")
        .order("created_at", desc=True)
        .execute()
    )
    reports = reports_result.data or []
    if not reports:
        return []

    story_ids = list({report["story_id"] for report in reports if report.get("story_id")})
    reporter_ids = list({report["reported_by"] for report in reports if report.get("reported_by")})
    stories_result = (
        supabase_admin.table("stories")
        .select("id,user_id,media_type,media_url,caption,status,is_highlighted,expires_at,created_at")
        .in_("id", story_ids)
        .execute()
        if story_ids
        else None
    )
    users_result = (
        supabase_admin.table("users")
        .select("id,name,email")
        .in_("id", reporter_ids)
        .execute()
        if reporter_ids
        else None
    )
    stories_by_id = {row["id"]: row for row in (stories_result.data or [])}
    user_name_by_id = {row["id"]: _display_name(row) for row in (users_result.data or [])}
    enriched_stories = _enrich_stories(list(stories_by_id.values()))
    enriched_by_id = {row["id"]: row for row in enriched_stories}

    for report in reports:
        report["story"] = enriched_by_id.get(report.get("story_id"))
        report["reported_by_name"] = user_name_by_id.get(report.get("reported_by"))
    return reports


def act_on_story_report(report_id: int, admin_user_id: str, action: str, admin_note: Optional[str] = None) -> Dict[str, Any]:
    action = (action or "").strip().lower()
    if action not in {"dismiss", "remove_story"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported report action")

    report_result = (
        supabase_admin.table("story_reports")
        .select("id,story_id,reported_by,reason,status,created_at,reviewed_at,reviewed_by,admin_note")
        .eq("id", report_id)
        .single()
        .execute()
    )
    if not report_result or not report_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story report not found")
    report = report_result.data

    if action == "remove_story":
        story = _get_story_for_read(report["story_id"])
        delete_story(report["story_id"], story["user_id"], actor_role="admin")
        report_status = "resolved"
    else:
        report_status = "dismissed"

    updated = (
        supabase_admin.table("story_reports")
        .update({
            "status": report_status,
            "reviewed_at": _utc_now_iso(),
            "reviewed_by": admin_user_id,
            "admin_note": (admin_note or "").strip() or None,
        })
        .eq("id", report_id)
        .execute()
    )
    if not updated or not updated.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Story report update failed")
    return list_story_reports()[next(i for i, item in enumerate(list_story_reports()) if item["id"] == report_id)]
