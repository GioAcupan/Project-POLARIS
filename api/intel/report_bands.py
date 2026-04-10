"""Band-classification functions for POLARIS report generation.

Each function takes a raw numeric value and returns one of four string labels:
  "Above target" | "On target" | "Needs improvement" | "Below target"

Threshold rationale:
  supply  — teacher-to-student ratio; lower is better (fewer students per teacher)
  spec    — specialization match rate (%); higher is better
  coverage — STAR program coverage (%); higher is better
  nat     — average NAT score; higher is better
  demand  — demand subscore (0–100); higher = more unmet demand = WORSE (inverted)
"""


def supply_band(teacher_student_ratio: float) -> str:
    """Teacher-to-student ratio (lower = better).

    Reference: fewer than 25 students per teacher is the DepEd target.
    """
    if teacher_student_ratio < 25:
        return "Above target"
    if teacher_student_ratio < 30:
        return "On target"
    if teacher_student_ratio < 35:
        return "Needs improvement"
    return "Below target"


def spec_band(specialization_pct: float) -> str:
    """Specialization match rate % (higher = better).

    Reference: 70% or more means the majority of teachers are matched to their subject.
    """
    if specialization_pct >= 70:
        return "Above target"
    if specialization_pct >= 60:
        return "On target"
    if specialization_pct >= 50:
        return "Needs improvement"
    return "Below target"


def coverage_band(star_coverage_pct: float) -> str:
    """STAR program coverage % (higher = better).

    Reference: 60% coverage indicates broad professional development reach.
    """
    if star_coverage_pct >= 60:
        return "Above target"
    if star_coverage_pct >= 45:
        return "On target"
    if star_coverage_pct >= 30:
        return "Needs improvement"
    return "Below target"


def nat_band(avg_nat_score: float) -> str:
    """Average NAT score (higher = better).

    Reference: 70 is the passing threshold used by DepEd for school-level assessment.
    """
    if avg_nat_score >= 70:
        return "Above target"
    if avg_nat_score >= 60:
        return "On target"
    if avg_nat_score >= 50:
        return "Needs improvement"
    return "Below target"


def demand_band(demand_subscore: float) -> str:
    """Demand subscore (higher = MORE unmet demand = WORSE — inverted polarity).

    A low demand subscore means training supply is meeting needs (good).
    A high demand subscore means there is significant unmet demand (bad).
    """
    if demand_subscore < 30:
        return "Above target"
    if demand_subscore < 50:
        return "On target"
    if demand_subscore < 70:
        return "Needs improvement"
    return "Below target"
