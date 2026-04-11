"""add note color, type, checklist, reminder, images (Google Keep style)

Revision ID: 013
Revises: 012
Create Date: 2026-04-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notes", sa.Column("color", sa.String(32), nullable=True))
    op.add_column(
        "notes",
        sa.Column("note_type", sa.String(16), nullable=False, server_default="text"),
    )
    op.add_column(
        "notes",
        sa.Column("checklist_items", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "notes",
        sa.Column("reminder_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "notes",
        sa.Column("images", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notes", "images")
    op.drop_column("notes", "reminder_at")
    op.drop_column("notes", "checklist_items")
    op.drop_column("notes", "note_type")
    op.drop_column("notes", "color")
