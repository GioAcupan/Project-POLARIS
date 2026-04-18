"""
api/routers/chat.py
Consultant Page / Starbot chat endpoint.
Mode-switched system prompts via ChatRequest.mode.

Adaptation note:
- This codebase exposes Gemini via `GeminiClient.complete(system_prompt=..., user_content=...)`
  instead of `call_gemini(system_prompt=..., user_message=...)`.
"""
import logging
import re

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.intel.consultant_context import build_source_citations, fetch_active_programs
from api.intel.chat_response_cache import chat_gemini_cache
from api.intel.llm_client import GeminiClient
from api.intel.system_prompts import (
    get_advisor_prompt,
    get_drafting_accomplishment_prompt,
    get_drafting_intervention_prompt,
    get_drafting_needs_assessment_prompt,
)
from api.schemas.chat import ChatRequest, ChatResponse, RegionalScoreContext

logger = logging.getLogger(__name__)
router = APIRouter()

_CITATION_HALLUCINATION_PATTERN = re.compile(
    r"\[Source:[^\]]*\]|\[Ref:[^\]]*\]|\[\d+\]|\(Source:[^\)]*\)",
    re.IGNORECASE,
)

_MODE_PROMPT_MAP = {
    "advisor": get_advisor_prompt,
    "drafting_accomplishment": get_drafting_accomplishment_prompt,
    "drafting_intervention": get_drafting_intervention_prompt,
    "drafting_needs_assessment": get_drafting_needs_assessment_prompt,
}

_GENERIC_STARBOT_PROMPT = """
You are STARBOT, the AI assistant for the POLARIS teacher intelligence platform built for DOST-SEI's Project STAR program.
You help regional education coordinators understand teacher data, identify underserved areas, and recommend science/math capacity-building programs.
No region has been selected. Ask the user to select a region from the dashboard to get data-grounded insights.
Keep your response brief and friendly.
DO NOT fabricate statistics. DO NOT cite any policy document numbers.
"""


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    ctx: RegionalScoreContext | None = request.region_context
    region_name = getattr(ctx, "region", None)

    cached = await chat_gemini_cache.get(
        region=region_name,
        mode=request.mode,
        message=request.message,
    )
    if cached is not None:
        return ChatResponse(response=cached.response, sources=cached.sources)

    if ctx:
        try:
            programs = await fetch_active_programs(db, ctx.region, limit=3)
        except Exception as e:
            logger.warning(f"Failed to fetch active programs: {e}")
            programs = []

        prompt_fn = _MODE_PROMPT_MAP.get(request.mode, get_advisor_prompt)
        system_prompt = prompt_fn(ctx, programs)
        sources = build_source_citations(ctx)
    else:
        system_prompt = _GENERIC_STARBOT_PROMPT
        sources = ["POLARIS system knowledge base"]

    try:
        waited_for_slot = await chat_gemini_cache.wait_for_region_cooldown(region_name)
        # Re-check in case another concurrent request filled cache while waiting.
        cached_after_wait = await chat_gemini_cache.get(
            region=region_name,
            mode=request.mode,
            message=request.message,
        )
        if cached_after_wait is not None:
            return ChatResponse(
                response=cached_after_wait.response,
                sources=cached_after_wait.sources,
            )

        client = GeminiClient()
        raw_response = await client.complete(
            system_prompt=system_prompt,
            user_content=request.message,
        )
    except Exception as e:
        logger.exception("LLM call failed")
        return ChatResponse(
            response=f"⚠️ STARBOT is temporarily unavailable. ({type(e).__name__})",
            sources=[],
        )

    clean_response = _CITATION_HALLUCINATION_PATTERN.sub("", raw_response).strip()

    await chat_gemini_cache.set(
        region=region_name,
        mode=request.mode,
        message=request.message,
        response=clean_response,
        sources=sources,
    )

    return ChatResponse(response=clean_response, sources=sources)
