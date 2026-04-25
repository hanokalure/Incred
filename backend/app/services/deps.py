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
    try:
        from gotrue.errors import AuthApiError
    except ImportError:
        AuthApiError = Exception

from ..database import get_supabase_client
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


async def _get_user_id_from_token(token: str) -> str:
    supabase = await get_supabase_client(anon=True)
    try:
        user_response = await supabase.auth.get_user(token)
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


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = credentials.credentials
    user_id = await _get_user_id_from_token(token)
    admin = await get_supabase_client(anon=False)
    profile = await admin.table("users").select("id,email,name,role,profile_pic").eq("id", user_id).single().execute()
    if not profile or not profile.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")

    return profile.data


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


async def get_optional_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any] | None:
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    try:
        user_id = await _get_user_id_from_token(token)
        admin = await get_supabase_client(anon=False)
        profile = await admin.table("users").select("id,email,name,role,profile_pic").eq("id", user_id).single().execute()
        if not profile or not profile.data:
            return None
        return profile.data
    except HTTPException:
        return None
    except Exception:
        return None
