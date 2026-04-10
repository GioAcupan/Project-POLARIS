"""Gemini LLM wrapper for POLARIS.

Full hardening (retry logic, token budgets, prompt versioning) lives in
polaris_starbot_roadmap.md — this module holds the minimal interface that
the rest of the codebase imports against.
"""

import os

import google.generativeai as genai  # type: ignore[import-untyped]

_MODEL_NAME = "gemini-1.5-flash"


class GeminiClient:
    """Thin async wrapper around the Gemini generative AI SDK.

    Raises RuntimeError on construction if GOOGLE_GEMINI_API_KEY is absent
    so failures surface immediately rather than at first API call.
    """

    def __init__(self) -> None:
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "GOOGLE_GEMINI_API_KEY is not set. "
                "Set it in .env or run with POLARIS_PITCH_MODE=true to bypass Gemini."
            )
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(
            model_name=_MODEL_NAME,
            system_instruction=None,  # injected per-call via system_prompt
        )

    async def complete(self, *, system_prompt: str, user_content: str) -> str:
        """Send a single-turn prompt and return the response text.

        Uses the synchronous SDK call wrapped in an executor so the event
        loop is not blocked. Full async streaming is a roadmap item.
        """
        import asyncio

        model = genai.GenerativeModel(
            model_name=_MODEL_NAME,
            system_instruction=system_prompt,
        )

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(user_content),
        )
        return response.text
