"""add user subscription plan for quota

Revision ID: 012
Revises: 011
Create Date: 2026-04-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("plan", sa.String(32), nullable=False, server_default="free"),
    )


def downgrade() -> None:
    op.drop_column("users", "plan")
