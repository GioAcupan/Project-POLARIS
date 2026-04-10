"""ORM model for the `programs` table (v3.1 §2.3.2)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .training_event import TrainingEvent

# Mirror the subject_area Postgres ENUM (also used by the teachers table).
# create_type=False: the type already exists from migration 001.
SubjectAreaEnum = Enum(
    "Science",
    "Mathematics",
    "Both",
    name="subject_area",
    create_type=False,
)


class Program(Base):
    """A POLARIS training program (CBEP, STAR Fellowship, etc.)."""

    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    program_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    subject_area: Mapped[str] = mapped_column(SubjectAreaEnum, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    eligibility_rules: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="'{}'"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )

    events: Mapped[list[TrainingEvent]] = relationship(
        "TrainingEvent",
        back_populates="program",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Program id={self.id} name={self.program_name!r}>"
