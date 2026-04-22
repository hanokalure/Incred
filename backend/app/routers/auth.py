from fastapi import APIRouter, Depends

from ..schemas.auth import SignUpRequest, LoginRequest, AuthResponse, UserProfile
from ..services.auth_service import signup_user, login_user, get_user_profile
from ..services.deps import get_current_user
from ..database import get_supabase_client

router = APIRouter()


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(payload: SignUpRequest):
    return await signup_user(payload.email, payload.password, payload.name)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    return await login_user(payload.email, payload.password)


@router.get("/me", response_model=UserProfile)
async def me(current_user=Depends(get_current_user)):
    return await get_user_profile(current_user["id"])
