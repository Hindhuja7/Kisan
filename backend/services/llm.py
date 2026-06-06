"""GPT-4o wrapper with template fallback for offline demos."""

import json
import re
from openai import OpenAI

from config import settings

_client: OpenAI | None = None


def get_client() -> OpenAI | None:
    global _client
    if not settings.openai_api_key:
        return None
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def gpt_json(system: str, user: str, fallback: dict) -> dict:
    client = get_client()
    if not client:
        return fallback

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception:
        return fallback


def gpt_text(system: str, user: str, fallback: str) -> str:
    client = get_client()
    if not client:
        return fallback

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.5,
        )
        return response.choices[0].message.content or fallback
    except Exception:
        return fallback
