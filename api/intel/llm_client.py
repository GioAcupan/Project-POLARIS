"""Thin async wrapper around the google-genai SDK (Gemini 2.x compatible)."""
from __future__ import annotations

import asyncio
import os

from google import genai
from google.genai import types

_MODEL_CANDIDATES = (
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
)


class GeminiClient:
    """Thin async wrapper around the google-genai SDK.

    Raises RuntimeError on construction if GOOGLE_GEMINI_API_KEY is absent.
    """

    def __init__(self) -> None:
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "GOOGLE_GEMINI_API_KEY is not set. "
                "Set it in .env or run with POLARIS_PITCH_MODE=true to bypass Gemini."
            )
        self._client = genai.Client(api_key=api_key)

    async def complete(self, *, system_prompt: str, user_content: str) -> str:
        """Single-turn prompt, returns response text.

        Uses the sync SDK call wrapped in an executor so the event loop is not blocked.
        """
        config = types.GenerateContentConfig(system_instruction=system_prompt)
        loop = asyncio.get_event_loop()
        last_error: Exception | None = None
        for model_name in _MODEL_CANDIDATES:
            try:
                response = await loop.run_in_executor(
                    None,
                    lambda: self._client.models.generate_content(
                        model=model_name,
                        contents={"role": "user", "parts": [{"text": user_content}]},
                        config=config,
                    ),
                )
                return response.text
            except Exception as e:
                last_error = e
                # Fallback on provider-throttling and unavailable model errors.
                text = str(e).upper()
                if "RESOURCE_EXHAUSTED" in text or "429" in text or "NOT_FOUND" in text or "404" in text:
                    continue
                raise

        if last_error is not None:
            raise last_error
        raise RuntimeError("Gemini call failed without a captured exception.")
