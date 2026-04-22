from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserProfile(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    role: str
    profile_pic: Optional[str] = None
    push_token: Optional[str] = None
    push_enabled: Optional[bool] = True


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: UserProfile
