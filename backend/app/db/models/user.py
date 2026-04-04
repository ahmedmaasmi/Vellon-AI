"""
User ORM model. Single-user (no organizations).
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.note import Note
    from app.db.models.tag import Tag


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """User entity. No tenant; identified globally by email."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="member",
        server_default="member",
    )  # owner | admin | member
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Billing / quota: free | pro | team (Stripe can update later)
    plan: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="free",
        server_default="free",
    )

    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    notes: Mapped[list["Note"]] = relationship(
        "Note",
        back_populates="user",
        lazy="raise",
    )
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        back_populates="user",
        lazy="raise",
    )
