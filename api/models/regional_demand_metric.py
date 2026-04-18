"""ORM model for the `regional_demand_metrics` table (v3.6)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class RegionalDemandMetric(Base):
    """Per-region demand bar chart points for Regional Health detail tab."""

    __tablename__ = "regional_demand_metrics"
    __table_args__ = (
        Index("idx_regional_demand_metrics_region", "region"),
    )

    region: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("regional_scores.region", ondelete="CASCADE"),
        primary_key=True,
    )
    label: Mapped[str] = mapped_column(String(100), primary_key=True)
    requests: Mapped[int] = mapped_column(Integer, nullable=False)
    display_order: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="0"
    )
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
