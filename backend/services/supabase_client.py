"""Supabase persistence with in-memory fallback for local demos."""

from datetime import datetime
from typing import Any
import uuid

from config import settings

_memory: dict[str, list[dict]] = {
    "workflows": [],
    "deals": [],
    "whatsapp_messages": [],
}

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if settings.supabase_url and settings.supabase_key:
        try:
            from supabase import create_client
            _client = create_client(settings.supabase_url, settings.supabase_key)
        except Exception:
            _client = False
    else:
        _client = False
    return _client if _client is not False else None


def is_connected() -> bool:
    return _get_client() is not None


def save_workflow(record: dict[str, Any]) -> dict[str, Any]:
    record = {**record, "id": record.get("id") or str(uuid.uuid4()), "created_at": datetime.now().isoformat()}
    client = _get_client()
    if client:
        try:
            result = client.table("workflows").insert(record).execute()
            return result.data[0] if result.data else record
        except Exception:
            pass
    _memory["workflows"].append(record)
    return record


def list_workflows(limit: int = 10) -> list[dict]:
    client = _get_client()
    if client:
        try:
            result = client.table("workflows").select("*").order("created_at", desc=True).limit(limit).execute()
            return result.data or []
        except Exception:
            pass
    return list(reversed(_memory["workflows"][-limit:]))


def save_deal(record: dict[str, Any]) -> dict[str, Any]:
    record = {**record, "id": record.get("id") or str(uuid.uuid4()), "created_at": datetime.now().isoformat()}
    client = _get_client()
    if client:
        try:
            result = client.table("deals").insert(record).execute()
            return result.data[0] if result.data else record
        except Exception:
            pass
    _memory["deals"].append(record)
    return record


def list_deals(limit: int = 10) -> list[dict]:
    client = _get_client()
    if client:
        try:
            result = client.table("deals").select("*").order("created_at", desc=True).limit(limit).execute()
            return result.data or []
        except Exception:
            pass
    return list(reversed(_memory["deals"][-limit:]))


def save_whatsapp_message(record: dict[str, Any]) -> dict[str, Any]:
    record = {**record, "id": record.get("id") or str(uuid.uuid4()), "created_at": datetime.now().isoformat()}
    client = _get_client()
    if client:
        try:
            result = client.table("whatsapp_messages").insert(record).execute()
            return result.data[0] if result.data else record
        except Exception:
            pass
    _memory["whatsapp_messages"].append(record)
    return record


def list_whatsapp_messages(phone: str | None = None, limit: int = 50) -> list[dict]:
    client = _get_client()
    if client:
        try:
            query = client.table("whatsapp_messages").select("*").order("created_at", desc=False).limit(limit)
            if phone:
                query = query.eq("phone", phone)
            result = query.execute()
            return result.data or []
        except Exception:
            pass
    messages = _memory["whatsapp_messages"]
    if phone:
        messages = [m for m in messages if m.get("phone") == phone]
    return messages[-limit:]
