"""add voice memo audio, transcript status, translation, STS output paths

Revision ID: 011
Revises: 010
Create Date: 2026-04-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notes", sa.Column("voice_audio_path", sa.String(512), nullable=True))
    op.add_column("notes", sa.Column("voice_audio_mime", sa.String(128), nullable=True))
    op.add_column("notes", sa.Column("voice_duration_seconds", sa.Float(), nullable=True))
    op.add_column("notes", sa.Column("voice_status", sa.String(32), nullable=True))
    op.add_column("notes", sa.Column("voice_error", sa.Text(), nullable=True))
    op.add_column("notes", sa.Column("transcript_language", sa.String(32), nullable=True))
    op.add_column("notes", sa.Column("translated_text", sa.Text(), nullable=True))
    op.add_column("notes", sa.Column("sts_audio_path", sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column("notes", "sts_audio_path")
    op.drop_column("notes", "translated_text")
    op.drop_column("notes", "transcript_language")
    op.drop_column("notes", "voice_error")
    op.drop_column("notes", "voice_status")
    op.drop_column("notes", "voice_duration_seconds")
    op.drop_column("notes", "voice_audio_mime")
    op.drop_column("notes", "voice_audio_path")
