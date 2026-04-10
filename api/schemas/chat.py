from typing import Literal

from pydantic import BaseModel, Field


class CriticalPing(BaseModel):
    region: str
    severity: Literal["CRITICAL", "WARNING", "GAP"]
    message: str


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
    ppst_content_knowledge: float
    ppst_curriculum_planning: float
    ppst_research_based_practice: float
    ppst_assessment_literacy: float
    ppst_professional_development: float
    demand_signal_count: float
    critical_pings: list[CriticalPing] | None = None


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=500)
    region_context: RegionalScoreContext | None = None


class ChatResponse(BaseModel):
    response: str
    sources: list[str]
