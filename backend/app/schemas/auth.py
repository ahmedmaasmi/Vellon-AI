"""
Auth API schemas: register, login, token, current user.
"""

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Request body for POST /auth/register."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str | None = Field(None, max_length=255)


class LoginRequest(BaseModel):
    """Request body for POST /auth/login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Response for register/login/refresh: access and optional refresh token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    refresh_token: str | None = None
    refresh_expires_in: int | None = None  # seconds


class RefreshRequest(BaseModel):
    """Request body for POST /auth/refresh (optional when refresh is sent via httpOnly cookie)."""

    refresh_token: str | None = Field(None, min_length=1)


class CurrentUserResponse(BaseModel):
    """Response for GET /auth/me."""

    id: UUID
    email: str
    role: str
    display_name: str | None
    avatar_url: str | None = None
    plan: str = "free"

    model_config = {"from_attributes": True}


class UserProfileUpdateInput(BaseModel):
    """PATCH /auth/me — optional profile fields."""

    display_name: str | None = Field(None, max_length=255)
    avatar_url: str | None = Field(None, max_length=512)
