"""
Integration tests for auth: register, login, me, tenant isolation.
Requires database and Redis (e.g. docker-compose or test env).
"""

import pytest
from httpx import AsyncClient


@pytest.mark.integration
async def test_register_creates_org_and_owner_returns_token(client: AsyncClient) -> None:
    """Successful register creates organization and user, returns access token."""
    payload = {
        "organization_name": "Acme Inc",
        "organization_slug": "acme-inc",
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
async def test_register_duplicate_slug_returns_409(client: AsyncClient) -> None:
    """Register with an existing organization slug returns 409."""
    payload = {
        "organization_name": "First Org",
        "organization_slug": "dup-slug",
        "email": "u1@example.com",
        "password": "pass12345",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 200

    payload2 = {
        "organization_name": "Second Org",
        "organization_slug": "dup-slug",
        "email": "u2@example.com",
        "password": "pass12345",
    }
    r2 = await client.post("/api/v1/auth/register", json=payload2)
    assert r2.status_code == 409
    assert "slug" in r2.json().get("detail", "").lower() or "already" in r2.json().get("detail", "").lower()


@pytest.mark.integration
async def test_login_success_returns_token(client: AsyncClient) -> None:
    """Login with correct org slug + email + password returns token."""
    reg = {
        "organization_name": "Login Test Org",
        "organization_slug": "login-test-org",
        "email": "login@test.example",
        "password": "mypass123",
    }
    await client.post("/api/v1/auth/register", json=reg)

    r = await client.post(
        "/api/v1/auth/login",
        json={
            "organization_slug": "login-test-org",
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
        "organization_name": "Wrong Pass Org",
        "organization_slug": "wrong-pass-org",
        "email": "user@wrong.example",
        "password": "correct",
    }
    await client.post("/api/v1/auth/register", json=reg)

    r = await client.post(
        "/api/v1/auth/login",
        json={
            "organization_slug": "wrong-pass-org",
            "email": "user@wrong.example",
            "password": "wrong",
        },
    )
    assert r.status_code == 401
    assert "invalid" in r.json().get("detail", "").lower() or "credential" in r.json().get("detail", "").lower()


@pytest.mark.integration
async def test_login_wrong_org_slug_returns_401(client: AsyncClient) -> None:
    """Login with non-existent organization slug returns 401 (tenant isolation)."""
    reg = {
        "organization_name": "Real Org",
        "organization_slug": "real-org",
        "email": "user@real.example",
        "password": "secret",
    }
    await client.post("/api/v1/auth/register", json=reg)

    r = await client.post(
        "/api/v1/auth/login",
        json={
            "organization_slug": "other-org",
            "email": "user@real.example",
            "password": "secret",
        },
    )
    assert r.status_code == 401


@pytest.mark.integration
async def test_me_with_valid_token_returns_user(client: AsyncClient) -> None:
    """GET /auth/me with valid Bearer token returns current user."""
    reg = {
        "organization_name": "Me Org",
        "organization_slug": "me-org",
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
    assert "organization_id" in data


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
