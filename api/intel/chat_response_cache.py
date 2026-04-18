"""Per-region Gemini cooldown and persistent response cache for chat."""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from time import time

_CACHE_TTL_SECONDS = int(os.getenv("POLARIS_GEMINI_CACHE_TTL_SECONDS", "3600"))
_REGION_COOLDOWN_SECONDS = float(os.getenv("POLARIS_GEMINI_REGION_COOLDOWN_SECONDS", "8"))
_CACHE_FILE_PATH = Path(
    os.getenv("POLARIS_GEMINI_CACHE_PATH", "api/.cache/gemini_region_cache.json")
)


def _norm_region(region: str | None) -> str:
    return (region or "__no_region__").strip().lower()


def _norm_message(message: str) -> str:
    return message.strip().lower()


def _cache_key(*, region: str | None, mode: str, message: str) -> str:
    raw = f"{_norm_region(region)}|{mode.strip().lower()}|{_norm_message(message)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


@dataclass
class CachedChatResponse:
    response: str
    sources: list[str]
    created_at_ts: float


class ChatGeminiCache:
    """Persistent chat cache + per-region call pacing."""

    def __init__(self) -> None:
        self._loaded = False
        self._cache: dict[str, CachedChatResponse] = {}
        self._cache_lock = asyncio.Lock()
        self._region_locks: defaultdict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._region_last_call_ts: dict[str, float] = {}

    async def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        async with self._cache_lock:
            if self._loaded:
                return
            try:
                if _CACHE_FILE_PATH.exists():
                    raw = json.loads(_CACHE_FILE_PATH.read_text(encoding="utf-8"))
                    if isinstance(raw, dict):
                        now = time()
                        for key, value in raw.items():
                            if not isinstance(value, dict):
                                continue
                            created_at = float(value.get("created_at_ts", 0))
                            if (now - created_at) > _CACHE_TTL_SECONDS:
                                continue
                            response = str(value.get("response", ""))
                            sources = value.get("sources", [])
                            if not isinstance(sources, list):
                                sources = []
                            self._cache[key] = CachedChatResponse(
                                response=response,
                                sources=[str(src) for src in sources],
                                created_at_ts=created_at,
                            )
            except Exception:
                # Cache loading failures must never break chat.
                self._cache = {}
            self._loaded = True

    async def get(
        self,
        *,
        region: str | None,
        mode: str,
        message: str,
    ) -> CachedChatResponse | None:
        await self._ensure_loaded()
        key = _cache_key(region=region, mode=mode, message=message)
        item = self._cache.get(key)
        if item is None:
            return None
        if (time() - item.created_at_ts) > _CACHE_TTL_SECONDS:
            async with self._cache_lock:
                self._cache.pop(key, None)
                await self._persist_locked()
            return None
        return item

    async def set(
        self,
        *,
        region: str | None,
        mode: str,
        message: str,
        response: str,
        sources: list[str],
    ) -> None:
        await self._ensure_loaded()
        key = _cache_key(region=region, mode=mode, message=message)
        async with self._cache_lock:
            self._cache[key] = CachedChatResponse(
                response=response,
                sources=sources,
                created_at_ts=time(),
            )
            await self._persist_locked()

    async def wait_for_region_cooldown(self, region: str | None) -> float:
        """Wait until this region can call Gemini again.

        Returns:
            Seconds waited before the slot opened.
        """
        await self._ensure_loaded()
        region_key = _norm_region(region)
        lock = self._region_locks[region_key]
        async with lock:
            now = time()
            last = self._region_last_call_ts.get(region_key)
            waited = 0.0
            if last is not None:
                elapsed = now - last
                remaining = _REGION_COOLDOWN_SECONDS - elapsed
                if remaining > 0:
                    waited = remaining
                    await asyncio.sleep(remaining)
            self._region_last_call_ts[region_key] = time()
            return waited

    async def _persist_locked(self) -> None:
        payload = {
            key: {
                "response": item.response,
                "sources": item.sources,
                "created_at_ts": item.created_at_ts,
            }
            for key, item in self._cache.items()
        }
        _CACHE_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        _CACHE_FILE_PATH.write_text(
            json.dumps(payload, ensure_ascii=True),
            encoding="utf-8",
        )


chat_gemini_cache = ChatGeminiCache()
