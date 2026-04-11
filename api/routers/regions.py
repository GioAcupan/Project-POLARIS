"""Regions router — returns cached regional score rows for dashboard/report UI."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.intel.region_codes import region_code
from api.models.regional_score import RegionalScore
from api.schemas.chat import RegionalScoreContext

router = APIRouter(tags=["regions"])


def _to_context(row: RegionalScore) -> RegionalScoreContext:
    traffic_light_value = (
        row.traffic_light.value
        if hasattr(row.traffic_light, "value")
        else str(row.traffic_light)
    )
    return RegionalScoreContext(
        region=row.region,
        region_code=region_code(row.region),
        underserved_score=float(row.underserved_score or 0),
        traffic_light=traffic_light_value,
        supply_subscore=float(row.supply_subscore or 0),
        impact_subscore=float(row.impact_subscore or 0),
        demand_subscore=float(row.demand_subscore or 0),
        teacher_student_ratio=float(row.teacher_student_ratio or 0),
        specialization_pct=float(row.specialization_pct or 0),
        star_coverage_pct=float(row.star_coverage_pct or 0),
        avg_nat_score=float(row.avg_nat_score or 0),
        ppst_content_knowledge=float(row.ppst_content_knowledge or 0),
        ppst_curriculum_planning=float(row.ppst_curriculum_planning or 0),
        ppst_research_based_practice=float(row.ppst_research_based_practice or 0),
        ppst_assessment_literacy=float(row.ppst_assessment_literacy or 0),
        ppst_professional_development=float(row.ppst_professional_development or 0),
        demand_signal_count=int(row.demand_signal_count or 0),
        critical_pings=row.critical_pings or [],
    )


@router.get("/regions/", response_model=list[RegionalScoreContext])
async def list_regions(db: AsyncSession = Depends(get_db)) -> list[RegionalScoreContext]:
    result = await db.execute(select(RegionalScore).order_by(RegionalScore.region.asc()))
    rows = result.scalars().all()
    return [_to_context(row) for row in rows]
