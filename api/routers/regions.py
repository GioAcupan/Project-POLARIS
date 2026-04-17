"""Regions router — returns cached regional score rows for dashboard/report UI."""

from collections import defaultdict
from typing import TypedDict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.intel.region_codes import region_code
from api.models.regional_demand_metric import RegionalDemandMetric
from api.models.regional_impact_series import RegionalImpactSeries
from api.models.regional_score import RegionalScore
from api.models.regional_supply_metric import RegionalSupplyMetric
from api.schemas.chat import (
    DashboardAiReportsResponse,
    DemandMetricPoint,
    ImpactSeriesPoint,
    RegionalScoreContext,
    SupplyMetricPoint,
)

router = APIRouter(tags=["regions"])


class EnrichedRegionMetrics(TypedDict):
    supply_metrics: list[SupplyMetricPoint]
    demand_metrics: list[DemandMetricPoint]
    impact_series: list[ImpactSeriesPoint]


async def _load_enriched_metrics(
    db: AsyncSession,
    region_names: list[str],
) -> dict[str, EnrichedRegionMetrics]:
    if not region_names:
        return {}

    supply_result = await db.execute(
        select(RegionalSupplyMetric)
        .where(RegionalSupplyMetric.region.in_(region_names))
        .order_by(RegionalSupplyMetric.region.asc(), RegionalSupplyMetric.display_order.asc(), RegionalSupplyMetric.label.asc())
    )
    demand_result = await db.execute(
        select(RegionalDemandMetric)
        .where(RegionalDemandMetric.region.in_(region_names))
        .order_by(RegionalDemandMetric.region.asc(), RegionalDemandMetric.display_order.asc(), RegionalDemandMetric.label.asc())
    )
    impact_result = await db.execute(
        select(RegionalImpactSeries)
        .where(RegionalImpactSeries.region.in_(region_names))
        .order_by(RegionalImpactSeries.region.asc(), RegionalImpactSeries.year.asc())
    )

    supply_by_region: dict[str, list[SupplyMetricPoint]] = defaultdict(list)
    for metric in supply_result.scalars().all():
        supply_by_region[metric.region].append(
            SupplyMetricPoint(
                label=metric.label,
                value=float(metric.value or 0),
            )
        )

    demand_by_region: dict[str, list[DemandMetricPoint]] = defaultdict(list)
    for metric in demand_result.scalars().all():
        demand_by_region[metric.region].append(
            DemandMetricPoint(
                label=metric.label,
                requests=int(metric.requests or 0),
            )
        )

    impact_by_region: dict[str, list[ImpactSeriesPoint]] = defaultdict(list)
    for point in impact_result.scalars().all():
        impact_by_region[point.region].append(
            ImpactSeriesPoint(
                year=str(point.year),
                training=float(point.training_volume or 0),
                nat=float(point.avg_nat_score or 0),
                feedback=float(point.avg_feedback or 0),
            )
        )

    out: dict[str, EnrichedRegionMetrics] = {}
    for region in region_names:
        out[region] = {
            "supply_metrics": supply_by_region.get(region, []),
            "demand_metrics": demand_by_region.get(region, []),
            "impact_series": impact_by_region.get(region, []),
        }
    return out


def _to_context(row: RegionalScore, enriched: EnrichedRegionMetrics | None = None) -> RegionalScoreContext:
    traffic_light_value = (
        row.traffic_light.value
        if hasattr(row.traffic_light, "value")
        else str(row.traffic_light)
    )
    enriched = enriched or {}
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
        total_teachers=int(row.total_teachers or 0),
        student_pop=int(row.student_pop or 0),
        economic_loss=float(row.economic_loss or 0),
        lays_score=float(row.lays_score or 0),
        ppst_content_knowledge=float(row.ppst_content_knowledge or 0),
        ppst_curriculum_planning=float(row.ppst_curriculum_planning or 0),
        ppst_research_based_practice=float(row.ppst_research_based_practice or 0),
        ppst_assessment_literacy=float(row.ppst_assessment_literacy or 0),
        ppst_professional_development=float(row.ppst_professional_development or 0),
        demand_signal_count=int(row.demand_signal_count or 0),
        critical_pings=row.critical_pings or [],
        supply_score_badge=(
            float(row.supply_score_badge)
            if getattr(row, "supply_score_badge", None) is not None
            else None
        ),
        supply_metrics=enriched.get("supply_metrics"),
        demand_score_badge=(
            float(row.demand_score_badge)
            if getattr(row, "demand_score_badge", None) is not None
            else None
        ),
        demand_legend_label=row.demand_legend_label,
        demand_metrics=enriched.get("demand_metrics"),
        demand_note=row.demand_note,
        impact_score_badge=(
            float(row.impact_score_badge)
            if getattr(row, "impact_score_badge", None) is not None
            else None
        ),
        impact_series=enriched.get("impact_series"),
    )


@router.get("/regions/", response_model=list[RegionalScoreContext])
async def list_regions(db: AsyncSession = Depends(get_db)) -> list[RegionalScoreContext]:
    result = await db.execute(select(RegionalScore).order_by(RegionalScore.region.asc()))
    rows = result.scalars().all()
    region_names = [row.region for row in rows]
    enriched_by_region = await _load_enriched_metrics(db, region_names)
    return [_to_context(row, enriched_by_region.get(row.region)) for row in rows]


@router.get("/regions/dashboard-ai-reports", response_model=DashboardAiReportsResponse)
async def list_dashboard_ai_reports(
    limit: int = Query(default=5, ge=1),
    db: AsyncSession = Depends(get_db),
) -> DashboardAiReportsResponse:
    total_count_result = await db.execute(select(func.count()).select_from(RegionalScore))
    total_count = int(total_count_result.scalar_one() or 0)

    limited_rows_result = await db.execute(
        select(RegionalScore).order_by(RegionalScore.region.asc()).limit(limit)
    )
    limited_rows = limited_rows_result.scalars().all()
    region_names = [row.region for row in limited_rows]
    enriched_by_region = await _load_enriched_metrics(db, region_names)

    return DashboardAiReportsResponse(
        total_count=total_count,
        limited_results=[
            _to_context(row, enriched_by_region.get(row.region))
            for row in limited_rows
        ],
    )
