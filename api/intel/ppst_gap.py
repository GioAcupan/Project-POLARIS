"""Regional PPST gap axis for training event ranking (v3.4 B.5).

Teacher rows do not store PPST axes; we use `regional_scores` for the teacher's
region and pick the axis with the lowest score (largest gap).
"""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.regional_score import RegionalScore

# Column name on RegionalScore -> (display name for reason_chip, matching program.subject_area values)
_PPST_AXIS_CONFIG: dict[str, tuple[str, tuple[str, ...]]] = {
    "ppst_content_knowledge": (
        "Content Knowledge",
        ("Science", "Mathematics", "Both"),
    ),
    "ppst_curriculum_planning": (
        "Curriculum Planning",
        ("Both",),
    ),
    "ppst_research_based_practice": (
        "Research-Based Practice",
        ("Science", "Both"),
    ),
    "ppst_assessment_literacy": (
        "Assessment Literacy",
        ("Science", "Mathematics", "Both"),
    ),
    "ppst_professional_development": (
        "Professional Development",
        ("Both",),
    ),
}

_PPST_COLUMNS = tuple(_PPST_AXIS_CONFIG.keys())


def _to_float(v: Decimal | float | None) -> float:
    if v is None:
        return 0.0
    if isinstance(v, Decimal):
        return float(v)
    return float(v)


async def get_largest_ppst_gap(
    db: AsyncSession,
    region: str,
) -> tuple[str, list[str]]:
    """Return the weakest PPST axis display name and matching `programs.subject_area` values.

    The axis with the **lowest** regional score is the largest gap. Ties break
    in deterministic column order (as listed in ``_PPST_COLUMNS``).

    If no ``regional_scores`` row exists for ``region``, defaults to Assessment
    Literacy (demo-stable).
    """
    row = await db.scalar(select(RegionalScore).where(RegionalScore.region == region))
    if row is None:
        name, areas = _PPST_AXIS_CONFIG["ppst_assessment_literacy"]
        return name, list(areas)

    best_col: str | None = None
    best_val: float | None = None
    for col in _PPST_COLUMNS:
        val = _to_float(getattr(row, col))
        if best_val is None or val < best_val:
            best_val = val
            best_col = col
        elif val == best_val and best_col is not None:
            # Tie-break: keep earlier column in _PPST_COLUMNS order (already iterating)
            pass

    assert best_col is not None
    display_name, areas = _PPST_AXIS_CONFIG[best_col]
    return display_name, list(areas)
