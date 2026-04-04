"""
Async ElevenLabs HTTP client: speech-to-text, text-to-speech, speech-to-speech.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.config import settings

ELEVEN_BASE = "https://api.elevenlabs.io/v1"


class ElevenLabsNotConfiguredError(Exception):
    """API key missing."""

    pass


class ElevenLabsHttpError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"ElevenLabs HTTP {status_code}: {detail[:500]}")


def _require_key() -> str:
    key = settings.elevenlabs_api_key
    if not key:
        raise ElevenLabsNotConfiguredError()
    return key


async def transcribe_audio(
    file_bytes: bytes,
    filename: str,
    mime_type: str | None,
) -> tuple[str, str | None, float | None]:
    """
    POST /v1/speech-to-text. Returns (transcript, language_code, duration_seconds).
    """
    api_key = _require_key()
    url = f"{ELEVEN_BASE}/speech-to-text"
    headers = {"xi-api-key": api_key}
    mime = mime_type or "application/octet-stream"
    files = {"file": (filename, file_bytes, mime)}
    data = {"model_id": settings.elevenlabs_stt_model}
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(url, headers=headers, files=files, data=data)
    if response.status_code >= 400:
        raise ElevenLabsHttpError(response.status_code, response.text)
    payload: dict[str, Any] = response.json()
    transcript = payload.get("transcript")
    if transcript is None and "text" in payload:
        transcript = payload.get("text")
    if isinstance(transcript, str):
        text = transcript.strip()
    elif isinstance(transcript, dict):
        inner = transcript.get("text") or transcript.get("transcript")
        text = inner.strip() if isinstance(inner, str) else ""
    else:
        text = ""
    language = payload.get("language")
    if language is not None and not isinstance(language, str):
        language = str(language)
    duration = payload.get("duration")
    dur_f: float | None = None
    if duration is not None:
        try:
            dur_f = float(duration)
        except (TypeError, ValueError):
            dur_f = None
    return text, language, dur_f


async def synthesize_speech(text: str, *, voice_id: str | None = None) -> bytes:
    """POST /v1/text-to-speech/{voice_id}; returns raw audio bytes (mpeg)."""
    api_key = _require_key()
    vid = voice_id or settings.elevenlabs_tts_voice_id
    url = f"{ELEVEN_BASE}/text-to-speech/{vid}"
    params = {"output_format": "mp3_44100_128"}
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    body = {
        "text": text[:50000],
        "model_id": settings.elevenlabs_tts_model,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            url,
            headers=headers,
            params=params,
            content=json.dumps(body),
        )
    if response.status_code >= 400:
        raise ElevenLabsHttpError(response.status_code, response.text)
    return response.content


async def speech_to_speech(
    file_bytes: bytes,
    filename: str,
    mime_type: str | None,
    *,
    voice_id: str,
) -> bytes:
    """
    POST /v1/speech-to-speech/{voice_id} with multipart audio; returns mp3 bytes.
    """
    api_key = _require_key()
    url = f"{ELEVEN_BASE}/speech-to-speech/{voice_id}"
    params = {"output_format": "mp3_44100_128"}
    headers = {"xi-api-key": api_key}
    mime = mime_type or "application/octet-stream"
    data = {"model_id": settings.elevenlabs_sts_model}
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            url,
            headers=headers,
            params=params,
            files={"audio": (filename, file_bytes, mime)},
            data=data,
        )
        if response.status_code == 422:
            response = await client.post(
                url,
                headers=headers,
                params=params,
                files={"file": (filename, file_bytes, mime)},
                data=data,
            )
    if response.status_code >= 400:
        raise ElevenLabsHttpError(response.status_code, response.text)
    return response.content
