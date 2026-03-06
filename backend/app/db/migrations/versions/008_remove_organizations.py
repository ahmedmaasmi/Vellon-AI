"""remove organizations (single-user / no multi-tenancy)

Revision ID: 008
Revises: 007
Create Date: 2025-03-06

Drops organization_id from users, notes, usage_logs; converts user uniqueness
to global email; drops organizations table. Data preserved (notes stay tied to user_id).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users: drop org FK and org-scoped uniqueness, then column; add global email unique
    op.drop_constraint(
        "users_organization_id_fkey",
        "users",
        type_="foreignkey",
    )
    op.drop_constraint("uq_users_organization_id_email", "users", type_="unique")
    op.drop_index("ix_users_organization_id_email", table_name="users")
    op.drop_index("ix_users_organization_id", table_name="users")
    op.drop_column("users", "organization_id")
    op.create_unique_constraint("uq_users_email", "users", ["email"])

    # --- notes: drop org FK and column
    op.drop_constraint(
        "notes_organization_id_fkey",
        "notes",
        type_="foreignkey",
    )
    op.drop_index("ix_notes_organization_id", table_name="notes")
    op.drop_column("notes", "organization_id")

    # --- usage_logs: drop org FK and column
    op.drop_constraint(
        "usage_logs_organization_id_fkey",
        "usage_logs",
        type_="foreignkey",
    )
    op.drop_index("ix_usage_logs_organization_id", table_name="usage_logs")
    op.drop_column("usage_logs", "organization_id")

    # --- drop organizations table (and its indexes)
    op.drop_index("ix_organizations_stripe_customer_id", table_name="organizations")
    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_index("ix_organizations_name", table_name="organizations")
    op.drop_table("organizations")


def downgrade() -> None:
    from sqlalchemy.dialects import postgresql

    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=True),
        sa.Column("plan", sa.String(32), nullable=False, server_default="free"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_organizations_slug"),
    )
    op.create_index("ix_organizations_name", "organizations", ["name"], unique=False)
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=False)
    op.create_index("ix_organizations_stripe_customer_id", "organizations", ["stripe_customer_id"], unique=False)

    # Restore organization_id columns (nullable for downgrade; would need data backfill for full restore)
    op.add_column(
        "usage_logs",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "usage_logs_organization_id_fkey",
        "usage_logs",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_usage_logs_organization_id", "usage_logs", ["organization_id"], unique=False)

    op.add_column(
        "notes",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "notes_organization_id_fkey",
        "notes",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_notes_organization_id", "notes", ["organization_id"], unique=False)

    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.add_column(
        "users",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "users_organization_id_fkey",
        "users",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_users_organization_id", "users", ["organization_id"], unique=False)
    op.create_index("ix_users_organization_id_email", "users", ["organization_id", "email"], unique=False)
    op.create_unique_constraint("uq_users_organization_id_email", "users", ["organization_id", "email"])
