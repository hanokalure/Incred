import base64
import json
import time
from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

try:
    from supabase_auth.errors import AuthApiError
except ImportError:
    from gotrue.errors import AuthApiError

from ..database import supabase_anon, supabase_admin
from ..config import settings

security = HTTPBearer(auto_error=False)


def _decode_token_claims(token: str) -> Dict[str, Any]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")
        payload = parts[1]
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload + padding)
        claims = json.loads(decoded.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    exp = claims.get("exp")
    if exp is not None and int(exp) <= int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    if not claims.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return claims


def _get_user_id_from_token(token: str) -> str:
    try:
        user_response = supabase_anon.auth.get_user(token)
    except AuthApiError as exc:
        message = (getattr(exc, "message", None) or str(exc)).lower()
        if "expired" in message:
            detail = "Token expired"
        else:
            detail = "Invalid token"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from exc
    except httpx.TimeoutException as exc:
        if settings.ENV != "development":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service timeout",
            ) from exc
        claims = _decode_token_claims(token)
        return str(claims["sub"])

    if not user_response or not user_response.user or not user_response.user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return str(user_response.user.id)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = credentials.credentials
    user_id = _get_user_id_from_token(token)
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
        user_id = _get_user_id_from_token(token)
    except HTTPException:
        return None
    profile = supabase_admin.table("users").select("id,email,name,role").eq("id", user_id).single().execute()
    if not profile or not profile.data:
        return None

    return profile.data
