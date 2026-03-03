"""
Auth API schemas: register, login, token, current user.
"""

import re
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


def _slug_validator(v: str) -> str:
    if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
        raise ValueError("Slug must be lowercase letters, numbers, and hyphens only")
    if len(v) < 2:
        raise ValueError("Slug must be at least 2 characters")
    return v


class RegisterRequest(BaseModel):
    """Request body for POST /auth/register."""

    organization_name: str = Field(..., min_length=1, max_length=255)
    organization_slug: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str | None = Field(None, max_length=255)

    @field_validator("organization_slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        return _slug_validator(v.strip().lower())


class LoginRequest(BaseModel):
    """Request body for POST /auth/login."""

    organization_slug: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("organization_slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        return _slug_validator(v.strip().lower())


class TokenResponse(BaseModel):
    """Response for register/login/refresh: access and optional refresh token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    refresh_token: str | None = None
    refresh_expires_in: int | None = None  # seconds


class RefreshRequest(BaseModel):
    """Request body for POST /auth/refresh."""

    refresh_token: str = Field(..., min_length=1)


class CurrentUserResponse(BaseModel):
    """Response for GET /auth/me."""

    id: UUID
    organization_id: UUID
    email: str
    role: str
    display_name: str | None

    model_config = {"from_attributes": True}
