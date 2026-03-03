"""
User ORM model. Users belong to an organization (multi-tenant).
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.organization import Organization


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """User entity. Scoped to an organization (tenant)."""

    __tablename__ = "users"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "email",
            name="uq_users_organization_id_email",
        ),
        Index("ix_users_organization_id_email", "organization_id", "email"),
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="users",
        lazy="raise",
    )
