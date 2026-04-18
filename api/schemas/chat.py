from typing import Literal, Optional

from pydantic import BaseModel, Field


class CriticalPing(BaseModel):
    region: str
    severity: Literal["CRITICAL", "WARNING", "GAP"]
    message: str


class SupplyMetricPoint(BaseModel):
    label: str
    value: float


class DemandMetricPoint(BaseModel):
    label: str
    requests: int


class ImpactSeriesPoint(BaseModel):
    year: str
    training: float
    nat: float
    feedback: float


class ImpactRowPoint(BaseModel):
    period: str
    training: float
    nat: float


class RegionalScoreContext(BaseModel):
    region: str
    region_code: str
    underserved_score: float
    traffic_light: Literal["green", "yellow", "red"]
    supply_subscore: float
    impact_subscore: float
    demand_subscore: float
    teacher_student_ratio: float
    specialization_pct: float
    star_coverage_pct: float
    avg_nat_score: float
    total_teachers: int | None = None
    student_pop: int | None = None
    economic_loss: float | None = None
    lays_score: float | None = None
    ppst_content_knowledge: float
    ppst_curriculum_planning: float
    ppst_research_based_practice: float
    ppst_assessment_literacy: float
    ppst_professional_development: float
    demand_signal_count: int
    critical_pings: list[CriticalPing] | None = None
    # Optional enriched dashboard payload fields
    supply_score_badge: float | None = None
    supply_metrics: list[SupplyMetricPoint] | None = None
    demand_score_badge: float | None = None
    demand_legend_label: str | None = None
    demand_metrics: list[DemandMetricPoint] | None = None
    demand_note: str | None = None
    impact_score_badge: float | None = None
    impact_series: list[ImpactSeriesPoint] | None = None
    impact_rows: list[ImpactRowPoint] | None = None


class DashboardAiReportsResponse(BaseModel):
    total_count: int
    limited_results: list[RegionalScoreContext]


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=500)
    mode: Literal[
        "advisor",
        "drafting_accomplishment",
        "drafting_intervention",
        "drafting_needs_assessment",
    ] = "advisor"
    region_context: Optional[RegionalScoreContext] = None


class ChatResponse(BaseModel):
    response: str
    sources: list[str]
