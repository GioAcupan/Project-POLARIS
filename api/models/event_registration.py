"""ORM model for the `event_registrations` table (v3.4 DB4)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .teacher import Teacher
    from .training_event import TrainingEvent

# Mirror the 7-value registration_status Postgres ENUM (DB1).
# `native_enum=True` (default) binds to the pre-existing Postgres type by name so
# SQLAlchemy does not attempt to create or drop it on metadata operations.
RegistrationStatusEnum = Enum(
    "draft",
    "forms_generated",
    "submitted",
    "approved",
    "attended",
    "completed",
    "cancelled",
    name="registration_status",
    create_type=False,  # type already created by migration 003
)


class EventRegistration(Base):
    """A teacher's registration record for a specific training event."""

    __tablename__ = "event_registrations"
    __table_args__ = (
        UniqueConstraint("teacher_id", "event_id", name="uq_er_teacher_event"),
        Index("idx_event_registrations_teacher_id", "teacher_id"),
        Index("idx_event_registrations_event_id", "event_id"),
        Index("idx_event_registrations_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    teacher_id: Mapped[str] = mapped_column(
        String(30),
        ForeignKey("teachers.deped_id", ondelete="CASCADE"),
        nullable=False,
    )
    event_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("training_events.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        RegistrationStatusEnum,
        nullable=False,
        server_default="draft",
    )
    event_specific_answers: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="'{}'"
    )
    nomination_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("nominations.id"),
    )
    generated_pds_path: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime | None] = mapped_column()
    submitted_at: Mapped[datetime | None] = mapped_column()
    approved_at: Mapped[datetime | None] = mapped_column()
    attended_at: Mapped[datetime | None] = mapped_column()
    cancelled_at: Mapped[datetime | None] = mapped_column()
    next_action: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )

    teacher: Mapped[Teacher] = relationship(
        "Teacher",
        back_populates="registrations",
        lazy="select",
    )
    event: Mapped[TrainingEvent] = relationship(
        "TrainingEvent",
        back_populates="registrations",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<EventRegistration id={self.id} "
            f"teacher={self.teacher_id!r} status={self.status!r}>"
        )
