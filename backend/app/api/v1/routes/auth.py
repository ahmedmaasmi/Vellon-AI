"""
Auth routes: register, login, refresh, logout, me.
Refresh token is set in httpOnly cookie for login/register/refresh; refresh endpoint accepts cookie or body.
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_redis, require_roles
from app.core.config import settings
from app.db.repositories import UserRepository
from app.db.models.user import User
from app.db.session import get_db_session
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileUpdateInput,
)
from app.services.auth import (
    AuthService,
    DuplicateEmailError,
    InvalidCredentialsError,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service(session: AsyncSession = Depends(get_db_session)) -> AuthService:
    return AuthService(user_repo=UserRepository(session))


def _set_refresh_cookie(response: Response, refresh_token: str, max_age_seconds: int) -> None:
    secure = getattr(settings, "refresh_cookie_secure", False) or settings.app_env == "production"
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=max_age_seconds,
        path="/",
        httponly=True,
        secure=secure,
        samesite="lax",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.refresh_cookie_name, path="/")


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    response: Response,
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Create user account; return access token in JSON, refresh token in httpOnly cookie."""
    try:
        token_response = await service.register(
            email=body.email,
            password=body.password,
            display_name=body.display_name,
            redis=redis,
        )
        if token_response.refresh_token and token_response.refresh_expires_in is not None:
            _set_refresh_cookie(
                response,
                token_response.refresh_token,
                token_response.refresh_expires_in,
            )
        return token_response
    except DuplicateEmailError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Authenticate by email + password; return access token in JSON, refresh token in httpOnly cookie."""
    try:
        token_response = await service.login(
            email=body.email,
            password=body.password,
            redis=redis,
        )
        if token_response.refresh_token and token_response.refresh_expires_in is not None:
            _set_refresh_cookie(
                response,
                token_response.refresh_token,
                token_response.refresh_expires_in,
            )
        return token_response
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    body: RefreshRequest | None = Body(None),
    service: AuthService = Depends(_auth_service),
    redis: Redis = Depends(get_redis),
) -> TokenResponse:
    """Rotate refresh token; read from cookie first, else body. Return new access token; set new refresh in cookie."""
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if not refresh_token and body is not None and body.refresh_token:
        refresh_token = body.refresh_token
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token required")
    try:
        token_response = await service.refresh_tokens(
            refresh_token=refresh_token,
            redis=redis,
        )
        if token_response.refresh_token and token_response.refresh_expires_in is not None:
            _set_refresh_cookie(
                response,
                token_response.refresh_token,
                token_response.refresh_expires_in,
            )
        return token_response
    except InvalidCredentialsError:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )


@router.post("/logout", status_code=204)
async def logout(response: Response) -> None:
    """Clear refresh cookie. Client should clear access token and redirect to signin."""
    _clear_refresh_cookie(response)


@router.get("/me", response_model=CurrentUserResponse)
async def me(user: User = Depends(get_current_user)) -> CurrentUserResponse:
    """Return the current authenticated user."""
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        plan=user.plan,
    )


@router.patch("/me", response_model=CurrentUserResponse)
async def update_me(
    body: UserProfileUpdateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> CurrentUserResponse:
    """Update display name and/or avatar URL."""
    payload = body.model_dump(exclude_unset=True)
    if "display_name" in payload:
        dn = payload["display_name"]
        user.display_name = dn.strip() if isinstance(dn, str) and dn.strip() else None
    if "avatar_url" in payload:
        av = payload["avatar_url"]
        user.avatar_url = av.strip() if isinstance(av, str) and av.strip() else None
    await session.flush()
    await session.refresh(user)
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        plan=user.plan,
    )


@router.get("/admin-only")
async def admin_only(user=Depends(require_roles(["owner", "admin"]))):
    """Example RBAC: only owner or admin can access. Members get 403."""
    return {"ok": True, "role": user.role}
