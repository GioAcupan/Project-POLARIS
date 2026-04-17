"""
api/intel/consultant_context.py
Builds the full context payload for the Consultant Page's /chat endpoint.
"""
from __future__ import annotations
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.program import Program
from api.schemas.chat import RegionalScoreContext


# Economic constants
_GDP_LOSS_PER_NON_PROFICIENT_STUDENT = 290_000  # PHP per year
_EXPECTED_SCHOOLING_YEARS = 12
_TAX_REVENUE_RATE = 0.144  # 14.4% of EOC


def compute_eoc(student_pop: int, avg_nat_score: float) -> float:
    """Annual Economic Opportunity Cost in BILLIONS of pesos."""
    if not student_pop or student_pop == 0:
        return 0.0
    proficiency_rate = avg_nat_score / 100.0
    non_proficient = student_pop * (1 - proficiency_rate)
    return round(non_proficient * _GDP_LOSS_PER_NON_PROFICIENT_STUDENT / 1_000_000_000, 1)


def compute_lays(avg_nat_score: float) -> float:
    """Learning-Adjusted Years of Schooling out of 12."""
    return round(_EXPECTED_SCHOOLING_YEARS * (avg_nat_score / 100.0), 1)


def compute_tax_leak(eoc_b: float) -> float:
    """Annual tax revenue leak in billions."""
    return round(eoc_b * _TAX_REVENUE_RATE, 1)


async def fetch_active_programs(
    db: AsyncSession,
    region: str,
    limit: int = 3,
) -> list[dict]:
    """Fetch up to `limit` active programs. Region-aware filtering can be added later."""
    stmt = select(Program).where(Program.is_active == True).limit(limit)
    result = await db.execute(stmt)
    programs = result.scalars().all()
    return [
        {
            "program_name": p.program_name,
            "subject_area": p.subject_area.value if hasattr(p.subject_area, "value") else str(p.subject_area),
            "description": p.description or "",
        }
        for p in programs
    ]


def build_region_fact_block(ctx: RegionalScoreContext) -> str:
    """The CONTEXT block injected verbatim into system prompts. Ground truth for the LLM."""
    # Prefer pre-computed stored values; fall back to live computation
    eoc = ctx.economic_loss if getattr(ctx, "economic_loss", 0) else compute_eoc(ctx.student_pop, ctx.avg_nat_score)
    lays = ctx.lays_score if getattr(ctx, "lays_score", 0) else compute_lays(ctx.avg_nat_score)
    tax = compute_tax_leak(eoc)

    ppst = {
        "Content Knowledge & Pedagogy (Domain 1)": ctx.ppst_content_knowledge,
        "Curriculum & Planning (Domain 4)": ctx.ppst_curriculum_planning,
        "Research-Based Practice": ctx.ppst_research_based_practice,
        "Assessment Literacy (Domain 5)": ctx.ppst_assessment_literacy,
        "Professional Development (Domain 7)": ctx.ppst_professional_development,
    }
    weakest_domain = min(ppst, key=ppst.get)
    weakest_score = ppst[weakest_domain]

    pings = ctx.critical_pings or []
    pings_str = "\n".join(f"  [{p.severity}] {p.message}" for p in pings) if pings else "  None"

    return f"""
=== POLARIS REGIONAL TELEMETRY — {ctx.region} ===
DO NOT fabricate any number. Use ONLY values from this block.

COMPOSITE SCORES:
  Underserved Score:      {ctx.underserved_score:.1f}/100  (traffic: {ctx.traffic_light.upper()})
  Supply Subscore:        {ctx.supply_subscore:.1f}/100
  Impact Subscore:        {ctx.impact_subscore:.1f}/100
  Demand Subscore:        {ctx.demand_subscore:.1f}/100

WORKFORCE TELEMETRY:
  Total Teachers:         {ctx.total_teachers:,}
  Teacher-Student Ratio:  1:{ctx.teacher_student_ratio:.0f}
  Specialization Rate:    {ctx.specialization_pct:.1f}%
  STAR Coverage:          {ctx.star_coverage_pct:.1f}%
  Avg NAT Score:          {ctx.avg_nat_score:.1f}%
  Total Student Pop:      {ctx.student_pop:,}

ECONOMIC IMPACT (cite these exactly):
  Annual Economic Loss (EOC): PHP {eoc}B
  Annual Tax Revenue Leak:    PHP {tax}B
  Learning-Adjusted Years:    {lays} of 12 expected years
  Learning Gap:               {round(12 - lays, 1)} years lost

PPST COMPETENCY RADAR (0.0-1.0):
  Domain 1 — Content Knowledge & Pedagogy:  {ctx.ppst_content_knowledge:.3f}
  Domain 4 — Curriculum & Planning:         {ctx.ppst_curriculum_planning:.3f}
  Research-Based Practice:                  {ctx.ppst_research_based_practice:.3f}
  Domain 5 — Assessment Literacy:           {ctx.ppst_assessment_literacy:.3f}
  Domain 7 — Professional Development:      {ctx.ppst_professional_development:.3f}
  >>> WEAKEST DOMAIN: {weakest_domain} = {weakest_score:.3f}

DEMAND SIGNALS:
  Active Training Requests: {ctx.demand_signal_count}

CRITICAL SYSTEM ALERTS:
{pings_str}
===================================================
"""


def build_programs_block(programs: list[dict]) -> str:
    if not programs:
        return "\nACTIVE PROGRAMS: None currently seeded.\n"
    lines = ["\nACTIVE PROGRAMS IN REGION (recommend ONLY from this list):"]
    for p in programs:
        lines.append(f"  - {p['program_name']} ({p['subject_area']}): {p['description']}")
    return "\n".join(lines) + "\n"


def build_source_citations(ctx: RegionalScoreContext) -> list[str]:
    return [
        f"POLARIS regional_scores — {ctx.region}",
        "PPST (DepEd Order No. 42, s. 2017)",
        "T&D Guidelines (DepEd Order No. 32, s. 2011)",
        "DOST-SEI Project STAR Framework",
    ]
