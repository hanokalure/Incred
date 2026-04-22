from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..schemas.notifications import NotificationOut, PushTokenUpdate
from ..services.notification_service import list_notifications, mark_notification_as_read, update_user_push_token
from ..services.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
async def get_notifications(user=Depends(get_current_user)):
    return await list_notifications(user_id=user["id"])

@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_read_api(notification_id: int, user=Depends(get_current_user)):
    result = await mark_notification_as_read(notification_id, user_id=user["id"])
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return result

@router.post("/push-token")
async def register_push_token(payload: PushTokenUpdate, user=Depends(get_current_user)):
    await update_user_push_token(user_id=user["id"], push_token=payload.push_token)
    return {"status": "success"}
