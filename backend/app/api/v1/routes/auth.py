"""
Auth routes: register, login, refresh, me.
"""

from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_redis, require_roles
from app.db.repositories import UserRepository
from app.db.session import get_db_session
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth import (
    AuthService,
    DuplicateEmailError,
    InvalidCredentialsError,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service(session: AsyncSession = Depends(get_db_session)) -> AuthService:
    return AuthService(user_repo=UserRepository(session))


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Create user account; return access and refresh tokens."""
    try:
        return await service.register(
            email=body.email,
            password=body.password,
            display_name=body.display_name,
            redis=redis,
        )
    except DuplicateEmailError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Authenticate by email + password; return access and refresh tokens."""
    try:
        return await service.login(
            email=body.email,
            password=body.password,
            redis=redis,
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Rotate refresh token; return new access and refresh tokens."""
    try:
        return await service.refresh_tokens(
            refresh_token=body.refresh_token,
            redis=redis,
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )


@router.get("/me", response_model=CurrentUserResponse)
async def me(user=Depends(get_current_user)) -> CurrentUserResponse:
    """Return the current authenticated user."""
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )


@router.get("/admin-only")
async def admin_only(user=Depends(require_roles(["owner", "admin"]))):
    """Example RBAC: only owner or admin can access. Members get 403."""
    return {"ok": True, "role": user.role}
