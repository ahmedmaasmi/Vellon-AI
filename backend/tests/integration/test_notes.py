"""
Integration tests for notes router endpoints.
"""

import uuid

import pytest
from httpx import AsyncClient


async def _register_and_get_token(
    client: AsyncClient,
    *,
    email: str,
) -> str:
    payload = {
        "email": email,
        "password": "pass12345",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.integration
async def test_notes_requires_auth(client: AsyncClient) -> None:
    """Notes endpoints require Bearer JWT."""
    r = await client.get("/api/v1/notes")
    assert r.status_code == 403


@pytest.mark.integration
async def test_notes_crud_happy_path(client: AsyncClient) -> None:
    """Create, list, get, update, delete note for current user."""
    token = await _register_and_get_token(client, email="notes-crud@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_r = await client.post(
        "/api/v1/notes",
        headers=headers,
        json={
            "title": "My note",
            "content": "First content",
            "source": "web",
            "is_archived": False,
        },
    )
    assert create_r.status_code == 201
    note = create_r.json()
    note_id = note["id"]
    assert note["title"] == "My note"
    assert note["content"] == "First content"

    list_r = await client.get("/api/v1/notes", headers=headers)
    assert list_r.status_code == 200
    note_ids = {item["id"] for item in list_r.json()}
    assert note_id in note_ids

    get_r = await client.get(f"/api/v1/notes/{note_id}", headers=headers)
    assert get_r.status_code == 200
    assert get_r.json()["id"] == note_id

    update_r = await client.put(
        f"/api/v1/notes/{note_id}",
        headers=headers,
        json={"title": "Updated title", "is_archived": True},
    )
    assert update_r.status_code == 200
    updated = update_r.json()
    assert updated["title"] == "Updated title"
    assert updated["is_archived"] is True

    delete_r = await client.delete(f"/api/v1/notes/{note_id}", headers=headers)
    assert delete_r.status_code == 204

    get_after_delete_r = await client.get(f"/api/v1/notes/{note_id}", headers=headers)
    assert get_after_delete_r.status_code == 404


@pytest.mark.integration
async def test_notes_get_update_delete_not_found(client: AsyncClient) -> None:
    """Unknown note ids return 404."""
    token = await _register_and_get_token(client, email="notes-404@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    missing_id = str(uuid.uuid4())

    get_r = await client.get(f"/api/v1/notes/{missing_id}", headers=headers)
    assert get_r.status_code == 404

    put_r = await client.put(
        f"/api/v1/notes/{missing_id}",
        headers=headers,
        json={"title": "nope"},
    )
    assert put_r.status_code == 404

    delete_r = await client.delete(f"/api/v1/notes/{missing_id}", headers=headers)
    assert delete_r.status_code == 404


@pytest.mark.integration
async def test_notes_user_scope_denies_other_user_note(client: AsyncClient) -> None:
    """A note id from another user is not readable and returns 404."""
    token_a = await _register_and_get_token(client, email="notes-a@example.com")
    token_b = await _register_and_get_token(client, email="notes-b@example.com")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    create_r = await client.post(
        "/api/v1/notes",
        headers=headers_a,
        json={"content": "User A note"},
    )
    assert create_r.status_code == 201
    note_id = create_r.json()["id"]

    get_other_r = await client.get(f"/api/v1/notes/{note_id}", headers=headers_b)
    assert get_other_r.status_code == 404

    put_other_r = await client.put(
        f"/api/v1/notes/{note_id}",
        headers=headers_b,
        json={"title": "Hacked", "content": "Other user"},
    )
    assert put_other_r.status_code == 404

    delete_other_r = await client.delete(f"/api/v1/notes/{note_id}", headers=headers_b)
    assert delete_other_r.status_code == 404


@pytest.mark.integration
async def test_embeddings_requires_auth(client: AsyncClient) -> None:
    """POST /notes/{id}/embeddings without token returns 403."""
    r = await client.post(f"/api/v1/notes/{uuid.uuid4()}/embeddings")
    assert r.status_code == 403


@pytest.mark.integration
async def test_embeddings_other_user_note_returns_404(client: AsyncClient) -> None:
    """POST to another user's note id returns 404."""
    token_a = await _register_and_get_token(client, email="emb-a@example.com")
    token_b = await _register_and_get_token(client, email="emb-b@example.com")
    create_r = await client.post(
        "/api/v1/notes",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"content": "Note by user A"},
    )
    assert create_r.status_code == 201
    note_id = create_r.json()["id"]
    r = await client.post(
        f"/api/v1/notes/{note_id}/embeddings",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert r.status_code == 404
