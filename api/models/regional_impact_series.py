"""ORM model for the `regional_impact_series` table (v3.6)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, Numeric, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class RegionalImpactSeries(Base):
    """Per-region yearly impact time series for Regional Health detail tab."""

    __tablename__ = "regional_impact_series"
    __table_args__ = (
        Index("idx_regional_impact_series_region", "region"),
        Index("idx_regional_impact_series_year", "year"),
    )

    region: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("regional_scores.region", ondelete="CASCADE"),
        primary_key=True,
    )
    year: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    training_volume: Mapped[int] = mapped_column(Integer, nullable=False)
    avg_nat_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    avg_feedback: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
