from typing import List, Optional

from pydantic import BaseModel, Field


class StoryCreate(BaseModel):
    media_type: str = Field(min_length=1, max_length=20)
    media_url: str = Field(min_length=1, max_length=2000)
    caption: Optional[str] = Field(default=None, max_length=1000)


class StoryOut(BaseModel):
    id: int
    user_id: str
    media_type: str
    media_url: str
    caption: Optional[str] = None
    status: str
    is_highlighted: bool = False
    expires_at: Optional[str] = None
    created_at: Optional[str] = None
    user_name: Optional[str] = None
    view_count: int = 0
    seen_by_me: bool = False
    viewer_names: List[str] = []


class StoryFeedGroupOut(BaseModel):
    user_id: str
    user_name: Optional[str] = None
    stories: List[StoryOut]
    latest_created_at: Optional[str] = None


class StoryReportCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class StoryHighlightUpdate(BaseModel):
    is_highlighted: bool


class StoryReportOut(BaseModel):
    id: int
    story_id: int
    reported_by: str
    reason: str
    status: str
    created_at: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    admin_note: Optional[str] = None
    story: Optional[StoryOut] = None
    reported_by_name: Optional[str] = None


class StoryReportAction(BaseModel):
    action: str = Field(min_length=1, max_length=50)
    admin_note: Optional[str] = Field(default=None, max_length=1000)
