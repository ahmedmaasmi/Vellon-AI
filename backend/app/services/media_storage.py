"""
Local filesystem storage for voice memo audio (original + speech-to-speech output).
Paths stored in DB are relative to settings.media_root.
"""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from app.core.config import settings


def _root() -> Path:
    return Path(settings.media_root)


def ensure_note_media_dir(user_id: uuid.UUID, note_id: uuid.UUID) -> Path:
    d = _root() / str(user_id) / str(note_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_original_audio(
    user_id: uuid.UUID,
    note_id: uuid.UUID,
    data: bytes,
    *,
    extension: str = "webm",
) -> str:
    """Write original recording; return relative path under media_root."""
    ext = extension.lstrip(".") or "webm"
    d = ensure_note_media_dir(user_id, note_id)
    path = d / f"original.{ext}"
    path.write_bytes(data)
    return f"{user_id}/{note_id}/original.{ext}"


def save_sts_audio(user_id: uuid.UUID, note_id: uuid.UUID, data: bytes) -> str:
    d = ensure_note_media_dir(user_id, note_id)
    path = d / "sts_output.mp3"
    path.write_bytes(data)
    return f"{user_id}/{note_id}/sts_output.mp3"


def abs_media_path(relative_path: str) -> Path:
    """Resolve a DB-stored relative path; must stay under media_root."""
    root = _root().resolve()
    rel = Path(relative_path)
    if rel.is_absolute() or ".." in rel.parts:
        raise ValueError("Invalid media path")
    target = (root / rel).resolve()
    target.relative_to(root)
    return target


def delete_note_media_dir(user_id: uuid.UUID, note_id: uuid.UUID) -> None:
    """Remove all stored audio for a note (best-effort)."""
    d = _root() / str(user_id) / str(note_id)
    if d.is_dir():
        shutil.rmtree(d, ignore_errors=True)


def read_media_file(relative_path: str) -> tuple[bytes, str]:
    path = abs_media_path(relative_path)
    if not path.is_file():
        raise FileNotFoundError(relative_path)
    mime = "application/octet-stream"
    if path.suffix.lower() == ".webm":
        mime = "audio/webm"
    elif path.suffix.lower() == ".mp3":
        mime = "audio/mpeg"
    return path.read_bytes(), mime
