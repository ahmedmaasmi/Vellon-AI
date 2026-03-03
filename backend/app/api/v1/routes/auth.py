"""
Auth routes: register, login, refresh, me.
"""

from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_redis, require_roles
from app.db.repositories import OrganizationRepository, UserRepository
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
    DuplicateOrganizationSlugError,
    InvalidCredentialsError,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service(session: AsyncSession = Depends(get_db_session)) -> AuthService:
    return AuthService(
        organization_repo=OrganizationRepository(session),
        user_repo=UserRepository(session),
    )


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Create organization and owner user; return access and refresh tokens."""
    try:
        return await service.register(
            organization_name=body.organization_name,
            organization_slug=body.organization_slug,
            email=body.email,
            password=body.password,
            display_name=body.display_name,
            redis=redis,
        )
    except DuplicateOrganizationSlugError:
        raise HTTPException(
            status_code=409,
            detail="An organization with this slug already exists",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Authenticate by organization slug + email + password; return access and refresh tokens."""
    try:
        return await service.login(
            organization_slug=body.organization_slug,
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
        organization_id=user.organization_id,
        email=user.email,
        role=user.role,
        display_name=user.display_name,
    )


@router.get("/admin-only")
async def admin_only(user=Depends(require_roles(["owner", "admin"]))):
    """Example RBAC: only owner or admin can access. Members get 403."""
    return {"ok": True, "role": user.role}
