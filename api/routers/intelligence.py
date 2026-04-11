"""Intelligence router — national radar aggregates for dashboard Panel 1."""

from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.models.regional_score import RegionalScore

router = APIRouter(tags=["intelligence"])


class SkillRadarAxes(BaseModel):
    content_knowledge: float
    learning_environment: float
    diversity_of_learners: float
    curriculum_planning: float
    assessment_reporting: float


class NationalSkillRadarOut(BaseModel):
    current: SkillRadarAxes
    target: SkillRadarAxes


TARGET_AXES = SkillRadarAxes(
    content_knowledge=85.0,
    learning_environment=85.0,
    diversity_of_learners=85.0,
    curriculum_planning=85.0,
    assessment_reporting=85.0,
)


def _to_pct(value: Decimal | float | None) -> float:
    if value is None:
        return 0.0
    return round(max(0.0, min(100.0, float(value) * 100.0)), 1)


@router.get(
    "/intelligence/national-skill-radar",
    response_model=NationalSkillRadarOut,
)
async def national_skill_radar(db: AsyncSession = Depends(get_db)) -> NationalSkillRadarOut:
    result = await db.execute(
        select(
            func.avg(RegionalScore.ppst_content_knowledge),
            func.avg(RegionalScore.ppst_professional_development),
            func.avg(RegionalScore.ppst_research_based_practice),
            func.avg(RegionalScore.ppst_curriculum_planning),
            func.avg(RegionalScore.ppst_assessment_literacy),
        )
    )
    (
        avg_content_knowledge,
        avg_learning_environment,
        avg_diversity_of_learners,
        avg_curriculum_planning,
        avg_assessment_reporting,
    ) = result.one()

    if all(
        value is None
        for value in (
            avg_content_knowledge,
            avg_learning_environment,
            avg_diversity_of_learners,
            avg_curriculum_planning,
            avg_assessment_reporting,
        )
    ):
        # TODO(seed): Backfill national/regional PPST seed rows in db/migrations/002_seed.sql.
        current_axes = SkillRadarAxes(
            content_knowledge=66.0,
            learning_environment=64.0,
            diversity_of_learners=62.0,
            curriculum_planning=65.0,
            assessment_reporting=63.0,
        )
    else:
        current_axes = SkillRadarAxes(
            content_knowledge=_to_pct(avg_content_knowledge),
            learning_environment=_to_pct(avg_learning_environment),
            diversity_of_learners=_to_pct(avg_diversity_of_learners),
            curriculum_planning=_to_pct(avg_curriculum_planning),
            assessment_reporting=_to_pct(avg_assessment_reporting),
        )

    return NationalSkillRadarOut(current=current_axes, target=TARGET_AXES)
