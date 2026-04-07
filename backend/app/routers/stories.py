from typing import List

from fastapi import APIRouter, Depends

from ..schemas.stories import (
    StoryCreate,
    StoryFeedGroupOut,
    StoryHighlightUpdate,
    StoryOut,
    StoryReportAction,
    StoryReportCreate,
    StoryReportOut,
)
from ..services.deps import get_current_user, get_optional_current_user, require_admin
from ..services.story_service import (
    act_on_story_report,
    create_story,
    delete_story,
    list_my_active_stories,
    list_my_story_archive,
    list_story_feed,
    list_story_reports,
    record_story_view,
    report_story,
    set_story_highlight,
)

router = APIRouter()


@router.get("/stories/feed", response_model=List[StoryFeedGroupOut])
def get_story_feed(user=Depends(get_optional_current_user)):
    return list_story_feed(viewer_user_id=user["id"] if user else None)


@router.get("/stories/me", response_model=List[StoryOut])
def get_my_active_stories(user=Depends(get_current_user)):
    return list_my_active_stories(user["id"])


@router.get("/stories/me/archive", response_model=List[StoryOut])
def get_my_story_archive(user=Depends(get_current_user)):
    return list_my_story_archive(user["id"])


@router.post("/stories", response_model=StoryOut, status_code=201)
def create_story_api(payload: StoryCreate, user=Depends(get_current_user)):
    return create_story(user_id=user["id"], payload=payload.model_dump())


@router.post("/stories/{story_id}/view")
def record_story_view_api(story_id: int, user=Depends(get_current_user)):
    return record_story_view(story_id, viewer_user_id=user["id"])


@router.post("/stories/{story_id}/report", response_model=StoryReportOut, status_code=201)
def report_story_api(story_id: int, payload: StoryReportCreate, user=Depends(get_current_user)):
    return report_story(story_id, reported_by=user["id"], reason=payload.reason)


@router.post("/stories/{story_id}/highlight", response_model=StoryOut)
def update_story_highlight_api(story_id: int, payload: StoryHighlightUpdate, user=Depends(get_current_user)):
    return set_story_highlight(story_id, user_id=user["id"], is_highlighted=payload.is_highlighted)


@router.delete("/stories/{story_id}", response_model=StoryOut)
def delete_story_api(story_id: int, user=Depends(get_current_user)):
    return delete_story(story_id, user_id=user["id"], actor_role=user.get("role"))


@router.get("/admin/story-reports", response_model=List[StoryReportOut], dependencies=[Depends(require_admin)])
def get_story_reports():
    return list_story_reports()


@router.post("/admin/story-reports/{report_id}", response_model=StoryReportOut, dependencies=[Depends(require_admin)])
def act_on_story_report_api(report_id: int, payload: StoryReportAction, user=Depends(get_current_user)):
    return act_on_story_report(report_id, admin_user_id=user["id"], action=payload.action, admin_note=payload.admin_note)
