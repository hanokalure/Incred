from typing import Dict, Any
from fastapi import HTTPException, status
from supabase_auth.errors import AuthApiError

from ..database import supabase_anon, supabase_admin


def signup_user(email: str, password: str, name: str) -> Dict[str, Any]:
    normalized_email = str(email).strip().lower()
    normalized_name = str(name).strip()
    try:
        result = supabase_anon.auth.sign_up({"email": normalized_email, "password": password})
    except AuthApiError as exc:
        detail = getattr(exc, "message", None) or str(exc) or "Signup failed"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    if not result or not result.user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signup failed")

    user_id = result.user.id

    # Ensure profile in users table
    supabase_admin.table("users").insert({
        "id": user_id,
        "email": normalized_email,
        "name": normalized_name,
        "role": "user",
    }).execute()

    if not result.session:
        raise HTTPException(status_code=status.HTTP_200_OK, detail="Signup successful. Verify email to log in.")

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
        "expires_in": result.session.expires_in,
        "user": {
            "id": user_id,
            "email": normalized_email,
            "name": normalized_name,
            "role": "user",
        },
    }


def login_user(email: str, password: str) -> Dict[str, Any]:
    normalized_email = str(email).strip().lower()
    try:
        result = supabase_anon.auth.sign_in_with_password({"email": normalized_email, "password": password})
    except AuthApiError as exc:
        detail = getattr(exc, "message", None) or str(exc) or "Invalid credentials"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from exc
    if not result or not result.session or not result.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    profile = supabase_admin.table("users").select("id,email,name,role").eq("id", result.user.id).single().execute()
    user_data = profile.data if profile and profile.data else None
    if not user_data:
        user_data = {"id": result.user.id, "email": result.user.email, "name": None, "role": "user"}

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
        "expires_in": result.session.expires_in,
        "user": user_data,
    }


def get_user_profile(user_id: str) -> Dict[str, Any]:
    profile = supabase_admin.table("users").select("id,email,name,role").eq("id", user_id).single().execute()
    if not profile or not profile.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    return profile.data
