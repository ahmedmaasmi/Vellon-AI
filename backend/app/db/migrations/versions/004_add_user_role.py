"""add user role

Revision ID: 004
Revises: 003
Create Date: 2025-03-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(32), nullable=False, server_default="member"),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
