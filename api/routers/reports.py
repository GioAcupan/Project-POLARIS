"""Report Generator endpoint — v3.4 (Part A §A.1, Part B BE2/BE11/BE12, Part C Step 10).

Single endpoint: POST /reports/generate
- PITCH_MODE=true: deterministic template render + asyncio.sleep(1.2).
- PITCH_MODE=false: same deterministic path as fallback; TODO inject Gemini for
  {key_insight} and {recommendations_block} only (see polaris_starbot_roadmap.md).
"""

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.intel.region_codes import region_code
from api.intel.report_bands import (
    coverage_band,
    demand_band,
    nat_band,
    spec_band,
    supply_band,
)
from api.intel.safe_dict import SafeDict
from api.intel.scoring import compute_key_insight, identify_weakest_factor
from api.models.regional_score import RegionalScore
from api.schemas.reports import ReportGenerateRequest, ReportGenerateResponse
from api.templates.reports.recommendations import pick_recommendations

logger = logging.getLogger("polaris")

router = APIRouter()

_TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates" / "reports"

_SEVERITY_PHRASES = {
    "red": "critical gaps requiring immediate intervention",
    "yellow": "moderate gaps that warrant attention",
    "green": "generally healthy conditions with targeted opportunities",
}


def _load_template(report_type: str) -> str:
    """Load a report markdown template from disk.

    Raises HTTPException 500 if the file is missing.
    """
    path = _TEMPLATES_DIR / f"{report_type}.md"
    if not path.exists():
        logger.error("Report template missing: %s", path)
        raise HTTPException(
            status_code=500,
            detail=f"Report template '{report_type}.md' not found on server.",
        )
    return path.read_text(encoding="utf-8")


# Filenames align with Part A §A.1 example (e.g. Quarterly_Report_R8.md) and §C Step 10.
_REPORT_FILENAME_STEM: dict[str, str] = {
    "quarterly_performance": "Quarterly_Report",
    "intervention_priority": "Intervention_Priority",
    "executive_summary": "Executive_Summary",
}


def _build_filename(report_type: str, region: str) -> str:
    """Build the report filename, e.g. 'Quarterly_Report_R8.md'."""
    stem = _REPORT_FILENAME_STEM.get(report_type)
    if stem is None:
        stem = report_type.replace("_", " ").title().replace(" ", "_")
    code = region_code(region)
    return f"{stem}_{code}.md"


def _build_values(row: RegionalScore, report_type: str) -> dict[str, object]:
    """Compute all template substitution values from the ORM row."""
    now = datetime.now(tz=timezone.utc)
    quarter = (now.month - 1) // 3 + 1
    year = now.year
    generated_date = now.strftime("%d %B %Y")
    computed_at = now.isoformat()

    traffic_light_val = (
        row.traffic_light.value
        if hasattr(row.traffic_light, "value")
        else str(row.traffic_light)
    )

    supply = float(row.supply_subscore or 0)
    impact = float(row.impact_subscore or 0)
    demand = float(row.demand_subscore or 0)

    weakest_factor = identify_weakest_factor(supply, impact, demand)
    key_insight = compute_key_insight(row)
    recommendations_block = pick_recommendations(weakest_factor, row.region)

    return {
        "region": row.region,
        "quarter": quarter,
        "year": year,
        "generated_date": generated_date,
        "computed_at": computed_at,
        "underserved_score": round(float(row.underserved_score or 0), 1),
        "severity_phrase": _SEVERITY_PHRASES.get(traffic_light_val, "unknown status"),
        "traffic_light": traffic_light_val,
        "key_insight": key_insight,
        "weakest_factor": weakest_factor,
        # Supply
        "teacher_student_ratio": round(float(row.teacher_student_ratio or 0), 1),
        "supply_band": supply_band(float(row.teacher_student_ratio or 0)),
        "specialization_pct": round(float(row.specialization_pct or 0), 1),
        "spec_band": spec_band(float(row.specialization_pct or 0)),
        "supply_subscore": round(supply, 1),
        # Impact
        "star_coverage_pct": round(float(row.star_coverage_pct or 0), 1),
        "coverage_band": coverage_band(float(row.star_coverage_pct or 0)),
        "avg_nat_score": round(float(row.avg_nat_score or 0), 1),
        "nat_band": nat_band(float(row.avg_nat_score or 0)),
        "impact_subscore": round(impact, 1),
        # Demand
        "demand_subscore": round(demand, 1),
        "demand_band": demand_band(demand),
        "demand_signal_count": int(row.demand_signal_count or 0),
        # Recommendations
        "recommendations_block": recommendations_block,
    }


@router.post("/reports/generate", response_model=ReportGenerateResponse)
async def generate_report(
    body: ReportGenerateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ReportGenerateResponse:
    pitch_mode: bool = request.app.state.pitch_mode

    # ── Fetch regional_scores row ────────────────────────────────────────────
    result = await db.execute(
        select(RegionalScore).where(RegionalScore.region == body.region)
    )
    row: RegionalScore | None = result.scalar_one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Region '{body.region}' not found in regional_scores.",
        )

    # ── Load template ────────────────────────────────────────────────────────
    template = _load_template(body.report_type)

    # ── Compute all derived values ────────────────────────────────────────────
    values = _build_values(row, body.report_type)

    # ── PITCH MODE: deterministic render ─────────────────────────────────────
    if pitch_mode:
        markdown = template.format_map(SafeDict(values))
        await asyncio.sleep(1.2)

    # ── HACKATHON MODE ────────────────────────────────────────────────────────
    else:
        # TODO (polaris_starbot_roadmap.md): call GeminiClient to generate only
        # {key_insight} and {recommendations_block} using a REPORT_INSIGHT system
        # prompt, then merge into values before format_map. The deterministic path
        # below is the production-safe fallback.
        markdown = template.format_map(SafeDict(values))

    # ── Build filename ────────────────────────────────────────────────────────
    filename = _build_filename(body.report_type, body.region)

    return ReportGenerateResponse(
        markdown=markdown,
        filename=filename,
        generated_at=datetime.now(tz=timezone.utc),
    )
