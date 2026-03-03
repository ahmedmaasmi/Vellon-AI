"""
Organization ORM model (tenant root for multi-tenant architecture).
"""

from __future__ import annotations

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Organization (tenant) entity. Users belong to an organization."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    plan: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="free",
        server_default="free",
    )  # free | pro | team
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )

    __table_args__ = (UniqueConstraint("slug", name="uq_organizations_slug"),)

    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="organization",
        lazy="raise",  # require explicit load in async context
    )
    notes: Mapped[list["Note"]] = relationship(
        "Note",
        back_populates="organization",
        lazy="raise",
    )
    usage_logs: Mapped[list["UsageLog"]] = relationship(
        "UsageLog",
        back_populates="organization",
        lazy="raise",
    )
