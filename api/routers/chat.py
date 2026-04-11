"""STARBOT query endpoint — v3.4 (query-only, no draft routing).

Single responsibility: accept a ChatRequest, return a ChatResponse.
No intent classification. No mode field. No draft paths.
"""

import asyncio
import re

from fastapi import APIRouter, Request

from api.schemas.chat import ChatRequest, ChatResponse
from api.intel.llm_client import GeminiClient

router = APIRouter()

# ---------------------------------------------------------------------------
# Pitch-mode canned responses (Part C Step 8, Part E §E.1.1)
# Keys are always compared post-normalization: message.strip().lower()
# ---------------------------------------------------------------------------
PITCH_RESPONSES: dict[str, dict[str, str]] = {
    "which ppst domain has the biggest gap in this region?": {
        "template": (
            "Looking at the PPST skill profile for {region}, the biggest gap is in "
            "**Assessment Literacy**, currently at {assessment_val} against a target of 0.80. "
            "This is {gap} points below target — the widest gap across all five PPST domains. "
            "Curriculum Planning and Content Knowledge are closer to target, while "
            "Research-Based Practice sits in the middle at {research_val}."
        ),
    },
    "how does this region compare to the national average?": {
        "template": (
            "{region} has an Underserved Score of {score}/100, which places it in the "
            "**{traffic_light} zone**. The national average across all 17 regions is "
            "approximately 65/100. Teacher-to-student ratio in {region} is {ratio}, and "
            "STAR Program coverage sits at {coverage}%. The most pressing factor is the "
            "specialization match rate at {spec}%."
        ),
    },
}

_GENERIC_FALLBACK = (
    "I'm currently showing a curated preview of my capabilities. "
    "Try one of the suggested questions below, or come back after hackathon day "
    "for the full experience."
)

# Placeholder — full system prompt lives in polaris_starbot_roadmap.md
_STARBOT_QUERY_SYSTEM = (
    "You are STARBOT, the POLARIS regional intelligence assistant. "
    "Answer questions about Philippine teacher deployment and training data "
    "concisely and accurately. Cite only information provided in the user context. "
    "Do not fabricate statistics."
)

# Strips any hallucinated [Source: ...] patterns from LLM output (§E.1)
_SOURCE_TAG_RE = re.compile(r"\[Source:[^\]]*\]", re.IGNORECASE)


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, request: Request) -> ChatResponse:
    pitch_mode: bool = request.app.state.pitch_mode

    # ── Guard: region must be selected before asking questions ──────────────
    if body.region_context is None:
        return ChatResponse(
            response="Please select a region on the map first, then ask me about it.",
            sources=[],
        )

    region_name: str = body.region_context.region

    # ── PITCH MODE ───────────────────────────────────────────────────────────
    if pitch_mode:
        key = body.message.strip().lower()
        entry = PITCH_RESPONSES.get(key)

        if entry is None:
            response_text = _GENERIC_FALLBACK
        else:
            try:
                ctx = body.region_context.model_dump()
                response_text = entry["template"].format(
                    region=ctx["region"],
                    assessment_val=round(ctx["ppst_assessment_literacy"], 2),
                    gap=round(0.80 - ctx["ppst_assessment_literacy"], 2),
                    research_val=round(ctx["ppst_research_based_practice"], 2),
                    score=round(ctx["underserved_score"]),
                    traffic_light=ctx["traffic_light"],
                    ratio=ctx["teacher_student_ratio"],
                    coverage=round(ctx["star_coverage_pct"]),
                    spec=round(ctx["specialization_pct"]),
                )
            except (KeyError, ValueError, TypeError):
                response_text = _GENERIC_FALLBACK

        await asyncio.sleep(0.6)
        return ChatResponse(
            response=response_text,
            sources=[f"POLARIS regional_scores — {region_name}"],
        )

    # ── LIVE MODE (Gemini) ────────────────────────────────────────────────────
    ctx_summary = body.region_context.model_dump_json(indent=None)
    user_content = f"{body.message}\n\nRegional context:\n{ctx_summary}"

    client = GeminiClient()
    raw_text = await client.complete(
        system_prompt=_STARBOT_QUERY_SYSTEM,
        user_content=user_content,
    )

    # Strip any [Source: ...] tags the model may hallucinate (§E.1)
    clean_text = _SOURCE_TAG_RE.sub("", raw_text).strip()

    return ChatResponse(
        response=clean_text,
        sources=[f"POLARIS regional_scores — {region_name}"],
    )
