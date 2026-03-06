"""
Unit tests for NoteRepository: user-scoped isolation, soft-delete, and CRUD.
Uses real DB session (db_session fixture); run with integration deps if needed.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.repositories import NoteRepository, UserRepository


@pytest.fixture
async def two_users_and_note_repo(
    db_session: AsyncSession,
) -> tuple[AsyncSession, UserRepository, NoteRepository, dict]:
    """Create two users; return repos and ids for testing user-scoped isolation."""
    user_repo = UserRepository(db_session)
    note_repo = NoteRepository(db_session)

    user_a = await user_repo.create(
        email="user-a@note-test.example",
        hashed_password=hash_password("pass"),
    )
    user_b = await user_repo.create(
        email="user-b@note-test.example",
        hashed_password=hash_password("pass"),
    )
    await db_session.flush()
    ids = {
        "user_a_id": user_a.id,
        "user_b_id": user_b.id,
    }
    return db_session, user_repo, note_repo, ids


@pytest.mark.integration
async def test_create_note_and_get_by_id_same_user(two_users_and_note_repo: tuple) -> None:
    """Create note for user A; get_note_by_id with user A returns it."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Hello",
        title="First",
    )
    assert note.id is not None
    assert note.user_id == ids["user_a_id"]
    assert note.is_deleted is False

    got = await note_repo.get_note_by_id(ids["user_a_id"], note.id)
    assert got is not None
    assert got.id == note.id
    assert got.title == "First"
    assert got.content == "Hello"


@pytest.mark.integration
async def test_get_note_by_id_other_user_returns_none(two_users_and_note_repo: tuple) -> None:
    """Note by user A must not be visible when querying with user B."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Secret",
    )
    got = await note_repo.get_note_by_id(ids["user_b_id"], note.id)
    assert got is None


@pytest.mark.integration
async def test_list_notes_scoped_by_user(two_users_and_note_repo: tuple) -> None:
    """list_notes returns only notes for the given user."""
    _, _, note_repo, ids = two_users_and_note_repo
    await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="A1",
    )
    await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="A2",
    )
    await note_repo.create_note(
        user_id=ids["user_b_id"],
        content="B1",
    )
    list_a = await note_repo.list_notes(ids["user_a_id"])
    list_b = await note_repo.list_notes(ids["user_b_id"])
    assert len(list_a) == 2
    assert len(list_b) == 1
    assert {n.content for n in list_a} == {"A1", "A2"}
    assert list_b[0].content == "B1"


@pytest.mark.integration
async def test_list_notes_excludes_soft_deleted_by_default(two_users_and_note_repo: tuple) -> None:
    """list_notes excludes soft-deleted notes unless include_deleted=True."""
    _, _, note_repo, ids = two_users_and_note_repo
    n1 = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Keep",
    )
    n2 = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Delete me",
    )
    await note_repo.soft_delete_note(ids["user_a_id"], n2.id)

    default_list = await note_repo.list_notes(ids["user_a_id"])
    assert len(default_list) == 1
    assert default_list[0].id == n1.id

    with_deleted = await note_repo.list_notes(ids["user_a_id"], include_deleted=True)
    assert len(with_deleted) == 2
    assert {n.id for n in with_deleted} == {n1.id, n2.id}


@pytest.mark.integration
async def test_get_note_by_id_excludes_soft_deleted_by_default(two_users_and_note_repo: tuple) -> None:
    """get_note_by_id returns None for soft-deleted note unless include_deleted=True."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="To delete",
    )
    await note_repo.soft_delete_note(ids["user_a_id"], note.id)

    assert await note_repo.get_note_by_id(ids["user_a_id"], note.id) is None
    got = await note_repo.get_note_by_id(
        ids["user_a_id"], note.id, include_deleted=True
    )
    assert got is not None
    assert got.is_deleted is True


@pytest.mark.integration
async def test_update_note_same_user_succeeds(two_users_and_note_repo: tuple) -> None:
    """update_note with correct user_id updates and returns the note."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Original",
        title="Old",
    )
    updated = await note_repo.update_note(
        ids["user_a_id"],
        note.id,
        title="New",
        content="Updated",
    )
    assert updated is not None
    assert updated.title == "New"
    assert updated.content == "Updated"

    got = await note_repo.get_note_by_id(ids["user_a_id"], note.id)
    assert got is not None
    assert got.title == "New"
    assert got.content == "Updated"


@pytest.mark.integration
async def test_update_note_other_user_returns_none(two_users_and_note_repo: tuple) -> None:
    """update_note with wrong user_id returns None (no cross-user update)."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Secret",
    )
    updated = await note_repo.update_note(
        ids["user_b_id"],
        note.id,
        title="Hacked",
    )
    assert updated is None
    got = await note_repo.get_note_by_id(ids["user_a_id"], note.id)
    assert got is not None
    assert got.title is None
    assert got.content == "Secret"


@pytest.mark.integration
async def test_soft_delete_note_same_user_marks_deleted(two_users_and_note_repo: tuple) -> None:
    """soft_delete_note with correct user sets is_deleted and returns note."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="To soft delete",
    )
    result = await note_repo.soft_delete_note(ids["user_a_id"], note.id)
    assert result is not None
    assert result.is_deleted is True
    assert await note_repo.get_note_by_id(ids["user_a_id"], note.id) is None
    assert (
        await note_repo.get_note_by_id(
            ids["user_a_id"], note.id, include_deleted=True
        )
        is not None
    )


@pytest.mark.integration
async def test_soft_delete_note_other_user_returns_none(two_users_and_note_repo: tuple) -> None:
    """soft_delete_note with wrong user_id returns None; note unchanged."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Stay",
    )
    result = await note_repo.soft_delete_note(ids["user_b_id"], note.id)
    assert result is None
    got = await note_repo.get_note_by_id(ids["user_a_id"], note.id)
    assert got is not None
    assert got.is_deleted is False


@pytest.mark.integration
async def test_soft_delete_idempotent(two_users_and_note_repo: tuple) -> None:
    """Calling soft_delete_note again on already-deleted note still returns note (idempotent)."""
    _, _, note_repo, ids = two_users_and_note_repo
    note = await note_repo.create_note(
        user_id=ids["user_a_id"],
        content="Once",
    )
    first = await note_repo.soft_delete_note(ids["user_a_id"], note.id)
    second = await note_repo.soft_delete_note(ids["user_a_id"], note.id)
    assert first is not None
    assert second is not None
    assert first.id == second.id
    assert second.is_deleted is True
