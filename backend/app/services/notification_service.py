import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..database import get_supabase_client

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def create_notification(user_id: str, title: str, body: str, n_type: str, related_id: Optional[int] = None):
    admin = await get_supabase_client(anon=False)
    
    # 1. Persist in Database
    payload = {
        "user_id": user_id,
        "title": title,
        "body": body,
        "type": n_type,
        "related_id": related_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await admin.table("notifications").insert(payload).execute()
    
    # 2. Trigger Native Push if token exists
    user_res = await admin.table("users").select("push_token").eq("id", user_id).single().execute()
    push_token = user_res.data.get("push_token") if user_res and user_res.data else None
    
    if push_token and push_token.startswith("ExponentPushToken"):
        await send_native_push(push_token, title, body, {"related_id": related_id, "type": n_type})
        
    return result.data[0] if result and result.data else None

async def send_native_push(token: str, title: str, body: str, data: Dict[str, Any]):
    """
    Sends a native push notification via Expo's Push API.
    """
    message = {
        "to": token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(EXPO_PUSH_URL, json=message)
            # In a real app, you'd check response for errors like device unregistration
            return response.json()
        except Exception as e:
            print(f"Failed to send native push: {e}")
            return None

async def list_notifications(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    supabase = await get_supabase_client(anon=True)
    result = await (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []

async def mark_notification_as_read(notification_id: int, user_id: str):
    admin = await get_supabase_client(anon=False)
    result = await (
        admin.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result and result.data else None

async def update_user_push_token(user_id: str, push_token: str):
    admin = await get_supabase_client(anon=False)
    result = await (
        admin.table("users")
        .update({"push_token": push_token})
        .eq("id", user_id)
        .execute()
    )
    return result.data[0] if result and result.data else None
