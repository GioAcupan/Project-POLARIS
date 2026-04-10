"""Regional scoring helpers for POLARIS reports and the Health Card.

Functions
---------
compute_key_insight(row)         — Rule-based key-insight sentence for a region.
identify_weakest_factor(...)     — Which of the 3 sub-scores is the weakest.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from api.models.regional_score import RegionalScore

# ---------------------------------------------------------------------------
# National baseline constants
# These are approximate DepEd-level targets used to compute "furthest below
# national average". Refined against real seed data in polaris_starbot_roadmap.
# ---------------------------------------------------------------------------
_NATIONAL_AVG_RATIO = 30.0          # teacher-to-student ratio national average
_NATIONAL_AVG_SPEC = 58.0           # specialization % national average
_NATIONAL_AVG_COVERAGE = 42.0       # STAR coverage % national average
_NATIONAL_AVG_NAT = 61.0            # average NAT score national average

# Severity of deviation for each factor (normalised gap score)
# A higher value means the factor is "more below average" for this region.
_FACTOR_LABELS = ("supply", "specialization", "coverage", "nat")


def _deviation_scores(row: "RegionalScore") -> dict[str, float]:
    """Compute a deviation score for each of the 4 raw factors.

    For "lower is better" metrics (teacher_student_ratio) we invert.
    Returns a dict of factor → normalised gap (higher = further below target).
    """
    ratio = float(row.teacher_student_ratio or 0)
    spec = float(row.specialization_pct or 0)
    coverage = float(row.star_coverage_pct or 0)
    nat = float(row.avg_nat_score or 0)

    return {
        # For ratio: being above national average is bad, so gap = (value - avg) / avg
        "supply": max(0.0, (ratio - _NATIONAL_AVG_RATIO) / _NATIONAL_AVG_RATIO),
        "specialization": max(0.0, (_NATIONAL_AVG_SPEC - spec) / _NATIONAL_AVG_SPEC),
        "coverage": max(0.0, (_NATIONAL_AVG_COVERAGE - coverage) / _NATIONAL_AVG_COVERAGE),
        "nat": max(0.0, (_NATIONAL_AVG_NAT - nat) / _NATIONAL_AVG_NAT),
    }


def compute_key_insight(row: "RegionalScore") -> str:
    """Return a rule-based key insight sentence for the given regional row.

    Identifies which of the 4 factors is furthest below the national average
    and returns a templated sentence (per v3.1 spec §3.1, line 979-981).
    """
    region = row.region
    devs = _deviation_scores(row)
    worst_factor = max(devs, key=lambda k: devs[k])

    ratio = float(row.teacher_student_ratio or 0)
    spec = float(row.specialization_pct or 0)
    coverage = float(row.star_coverage_pct or 0)
    nat = float(row.avg_nat_score or 0)

    if worst_factor == "supply":
        return (
            f"{region} has a teacher-to-student ratio of {ratio:.1f}, "
            f"which is above the national average of {_NATIONAL_AVG_RATIO:.0f} — "
            f"indicating a significant shortage of qualified teachers in the region."
        )
    if worst_factor == "specialization":
        return (
            f"{region} has the lowest Science/Math specialization match rate "
            f"among comparable regions ({spec:.0f}%), meaning most teachers are "
            f"deployed outside their primary subject expertise."
        )
    if worst_factor == "coverage":
        return (
            f"{region} has only {coverage:.0f}% STAR Program coverage, "
            f"well below the national average of {_NATIONAL_AVG_COVERAGE:.0f}% — "
            f"leaving most teachers without recent professional development support."
        )
    # nat
    return (
        f"{region} records an average NAT score of {nat:.1f}, "
        f"below the national average of {_NATIONAL_AVG_NAT:.0f}, "
        f"indicating systemic gaps in student learning outcomes tied to teacher effectiveness."
    )


def identify_weakest_factor(
    supply_subscore: float,
    impact_subscore: float,
    demand_subscore: float,
) -> str:
    """Identify the weakest of the 3 composite sub-scores.

    Formula (per blueprint prompt B.3 addendum):
      - Compare supply_subscore, impact_subscore, and (100 - demand_subscore).
      - The lowest resulting value identifies the weakness.
      - For demand, high subscore = more unmet demand = bad, so we invert it.

    Returns one of: "supply", "impact", "demand"
    """
    candidates = {
        "supply": float(supply_subscore),
        "impact": float(impact_subscore),
        "demand": 100.0 - float(demand_subscore),
    }
    return min(candidates, key=lambda k: candidates[k])
