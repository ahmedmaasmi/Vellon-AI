"""
Integration tests for usage/quota endpoint.
"""

import pytest
from httpx import AsyncClient


async def _register_and_get_token(
    client: AsyncClient,
    *,
    organization_slug: str,
    email: str,
) -> str:
    payload = {
        "organization_name": f"Org {organization_slug}",
        "organization_slug": organization_slug,
        "email": email,
        "password": "pass12345",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.integration
async def test_quota_requires_auth(client: AsyncClient) -> None:
    """GET /usage/quota without token returns 403."""
    r = await client.get("/api/v1/usage/quota")
    assert r.status_code == 403


@pytest.mark.integration
async def test_quota_returns_metadata(client: AsyncClient) -> None:
    """GET /usage/quota with valid token returns plan, limit, used, remaining, reset_period_end."""
    token = await _register_and_get_token(
        client, organization_slug="quota-org", email="quota@example.com"
    )
    r = await client.get(
        "/api/v1/usage/quota",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["plan"] == "free"
    assert data["limit"] == 50
    assert data["used"] >= 0
    assert data["remaining"] >= 0
    assert data["remaining"] == data["limit"] - data["used"]
    assert "reset_period_end" in data
