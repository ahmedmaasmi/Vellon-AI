"""add organization plan

Revision ID: 005
Revises: 004
Create Date: 2025-03-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("plan", sa.String(32), nullable=False, server_default="free"),
    )


def downgrade() -> None:
    op.drop_column("organizations", "plan")
