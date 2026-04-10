"""ORM model for the `training_events` table (v3.4 DB3)."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .event_registration import EventRegistration
    from .program import Program


class TrainingEvent(Base):
    """A STAR-linked or DepEd training event teachers can register for."""

    __tablename__ = "training_events"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_te_date_order"),
        Index("idx_training_events_program_id", "program_id"),
        Index("idx_training_events_start_date", "start_date"),
        Index("idx_training_events_is_star_partnered", "is_star_partnered"),
        Index("idx_training_events_registration_deadline", "registration_deadline"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    program_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("programs.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    organizer: Mapped[str] = mapped_column(String(255), nullable=False)
    venue: Mapped[str | None] = mapped_column(Text)
    venue_region: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    registration_deadline: Mapped[date] = mapped_column(Date, nullable=False)
    is_star_partnered: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    funding_source: Mapped[str | None] = mapped_column(String(50))
    required_forms: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, server_default='\'["pds"]\''
    )
    event_specific_fields: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, server_default="'[]'"
    )
    description: Mapped[str | None] = mapped_column(Text)
    capacity: Mapped[int | None] = mapped_column(Integer)
    slots_remaining: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )

    program: Mapped[Program] = relationship(
        "Program",
        back_populates="events",
        lazy="select",
    )
    registrations: Mapped[list[EventRegistration]] = relationship(
        "EventRegistration",
        back_populates="event",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<TrainingEvent id={self.id} title={self.title!r}>"
