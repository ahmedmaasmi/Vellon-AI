"""Unit tests for security primitives (password hashing, JWT)."""

import uuid

import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password_returns_different_each_time() -> None:
    """Bcrypt uses salt, so same password yields different hashes."""
    a = hash_password("secret")
    b = hash_password("secret")
    assert a != b
    assert verify_password("secret", a)
    assert verify_password("secret", b)


def test_verify_password_rejects_wrong_plain() -> None:
    hashed = hash_password("right")
    assert not verify_password("wrong", hashed)


def test_create_and_decode_access_token() -> None:
    user_id = uuid.uuid4()
    org_id = uuid.uuid4()
    token = create_access_token(sub=user_id, org_id=org_id, org_slug="my-org")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert payload["org"] == str(org_id)
    assert payload["org_slug"] == "my-org"
    assert "exp" in payload
    assert "iat" in payload


def test_decode_invalid_token_returns_none() -> None:
    assert decode_access_token("invalid") is None
    assert decode_access_token("") is None
