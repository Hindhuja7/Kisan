"""Speech-to-text via OpenAI Whisper (fallback when browser speech API fails)."""

import io

from fastapi import HTTPException

from config import settings
from services.llm import get_client

WHISPER_LANG = {"te": "te", "hi": "hi", "en": "en"}


def transcribe_audio(audio_bytes: bytes, filename: str, language: str = "te") -> str:
    client = get_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Voice transcription needs OPENAI_API_KEY in backend .env",
        )

    bio = io.BytesIO(audio_bytes)
    bio.name = filename or "recording.webm"

    lang = WHISPER_LANG.get(language)
    kwargs = {"model": "whisper-1", "file": bio}
    if lang:
        kwargs["language"] = lang

    try:
        result = client.audio.transcriptions.create(**kwargs)
        text = (result.text or "").strip()
        if not text:
            raise HTTPException(status_code=422, detail="Could not understand audio")
        return text
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
