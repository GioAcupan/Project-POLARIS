"""SQLAlchemy ORM model for the regional_scores table.

Mirrors the v3.1 DDL (Section 2.3.8 of polaris_mvp_v3.1.md) verbatim.
This table is a pre-aggregated summary table — it is never computed live.
Writes happen only via POST /admin/recompute-regional-scores.
"""

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from api.models.base import Base


class TrafficLightEnum(enum.Enum):
    green = "green"
    yellow = "yellow"
    red = "red"


class RegionalScore(Base):
    __tablename__ = "regional_scores"

    # Primary key
    region: Mapped[str] = mapped_column(String(100), primary_key=True)
    psgc_code: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Composite scores (0.00 – 100.00)
    underserved_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    supply_subscore: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    impact_subscore: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    demand_subscore: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)

    # Raw 4-Factor Core values (used by hover tooltip and Health Card)
    teacher_student_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    specialization_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    star_coverage_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    avg_nat_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    student_pop: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    economic_loss: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    lays_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    supply_score_badge: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    impact_score_badge: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    demand_score_badge: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    demand_legend_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    demand_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    demand_signal_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # PPST axis averages (0.000 – 1.000)
    ppst_content_knowledge: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False, default=0)
    ppst_curriculum_planning: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False, default=0)
    ppst_research_based_practice: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False, default=0)
    ppst_assessment_literacy: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False, default=0)
    ppst_professional_development: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False, default=0)

    # Rule-based alert pings
    critical_pings: Mapped[list[Any]] = mapped_column(JSON, nullable=False, default=list)

    # Derived
    total_teachers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    traffic_light: Mapped[TrafficLightEnum] = mapped_column(
        Enum(TrafficLightEnum, name="traffic_light", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=TrafficLightEnum.red,
    )
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )
