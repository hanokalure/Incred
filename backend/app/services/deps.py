from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase_auth.errors import AuthApiError

from ..database import supabase_anon, supabase_admin

security = HTTPBearer(auto_error=False)


def _get_user_from_token(token: str):
    try:
        return supabase_anon.auth.get_user(token)
    except AuthApiError as exc:
        message = (getattr(exc, "message", None) or str(exc)).lower()
        if "expired" in message:
            detail = "Token expired"
        else:
            detail = "Invalid token"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from exc


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = credentials.credentials
    user_response = _get_user_from_token(token)
    if not user_response or not user_response.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = user_response.user.id
    profile = supabase_admin.table("users").select("id,email,name,role").eq("id", user_id).single().execute()
    if not profile or not profile.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")

    return profile.data


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def get_optional_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any] | None:
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    try:
        user_response = _get_user_from_token(token)
    except HTTPException:
        return None
    if not user_response or not user_response.user:
        return None

    user_id = user_response.user.id
    profile = supabase_admin.table("users").select("id,email,name,role").eq("id", user_id).single().execute()
    if not profile or not profile.data:
        return None

    return profile.data
