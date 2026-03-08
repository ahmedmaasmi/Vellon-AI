"""
Integration tests for auth: register, login, me.
Requires database and Redis (e.g. docker-compose or test env).
"""

import pytest
from httpx import AsyncClient


@pytest.mark.integration
async def test_register_creates_user_returns_token(client: AsyncClient) -> None:
    """Successful register creates user, returns access token."""
    payload = {
        "email": "owner@acme.example",
        "password": "securepass123",
        "display_name": "Owner",
    }
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


@pytest.mark.integration
async def test_register_duplicate_email_returns_409(client: AsyncClient) -> None:
    """Register with an existing email returns 409."""
    payload = {
        "email": "dup@example.com",
        "password": "pass12345",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 200

    payload2 = {
        "email": "dup@example.com",
        "password": "otherpass123",
    }
    r2 = await client.post("/api/v1/auth/register", json=payload2)
    assert r2.status_code == 409
    assert "email" in r2.json().get("detail", "").lower() or "already" in r2.json().get("detail", "").lower()


@pytest.mark.integration
async def test_login_success_returns_token(client: AsyncClient) -> None:
    """Login with correct email + password returns token."""
    reg = {
        "email": "login@test.example",
        "password": "mypass123",
    }
    await client.post("/api/v1/auth/register", json=reg)

    r = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@test.example",
            "password": "mypass123",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.integration
async def test_login_wrong_password_returns_401(client: AsyncClient) -> None:
    """Login with wrong password returns 401."""
    reg = {
        "email": "user@wrong.example",
        "password": "correct",
    }
    await client.post("/api/v1/auth/register", json=reg)

    r = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@wrong.example",
            "password": "wrong",
        },
    )
    assert r.status_code == 401
    assert "invalid" in r.json().get("detail", "").lower() or "credential" in r.json().get("detail", "").lower()


@pytest.mark.integration
async def test_login_nonexistent_email_returns_401(client: AsyncClient) -> None:
    """Login with non-existent email returns 401."""
    r = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nobody@example.com",
            "password": "secret",
        },
    )
    assert r.status_code == 401


@pytest.mark.integration
async def test_me_with_valid_token_returns_user(client: AsyncClient) -> None:
    """GET /auth/me with valid Bearer token returns current user."""
    reg = {
        "email": "me@example.com",
        "password": "pass12345",
        "display_name": "Me User",
    }
    r_reg = await client.post("/api/v1/auth/register", json=reg)
    assert r_reg.status_code == 200
    token = r_reg.json()["access_token"]

    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "me@example.com"
    assert data["display_name"] == "Me User"
    assert "id" in data
    assert "role" in data
    assert "avatar_url" in data
    assert data["avatar_url"] is None  # not set at registration


@pytest.mark.integration
async def test_me_without_token_returns_403(client: AsyncClient) -> None:
    """GET /auth/me without Authorization returns 403 (HTTPBearer)."""
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 403


@pytest.mark.integration
async def test_me_with_invalid_token_returns_401(client: AsyncClient) -> None:
    """GET /auth/me with invalid JWT returns 401."""
    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert r.status_code == 401


@pytest.mark.integration
async def test_admin_only_allows_owner(client: AsyncClient) -> None:
    """GET /auth/admin-only with owner token returns 200 (RBAC: owner allowed)."""
    reg = {
        "email": "owner@admin.example",
        "password": "pass12345",
    }
    r_reg = await client.post("/api/v1/auth/register", json=reg)
    assert r_reg.status_code == 200
    token = r_reg.json()["access_token"]
    r = await client.get(
        "/api/v1/auth/admin-only",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json().get("role") == "owner"
