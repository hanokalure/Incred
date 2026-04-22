from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    body: str
    type: str
    related_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: str

class NotificationOut(NotificationBase):
    id: int
    user_id: str
    is_read: bool
    created_at: datetime

class PushTokenUpdate(BaseModel):
    push_token: str

class NotificationSettingsUpdate(BaseModel):
    push_enabled: bool
