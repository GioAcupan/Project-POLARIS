"""ORM model for the `teachers` table (v3.1 §2.3.3)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Enum,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .program import SubjectAreaEnum

if TYPE_CHECKING:
    from .event_registration import EventRegistration
    from .profile_extended import TeacherProfileExtended

# Mirror the qualification_level Postgres ENUM.
# create_type=False: the type already exists from migration 001.
QualificationLevelEnum = Enum(
    "Bachelor",
    "Master",
    "Doctorate",
    "None",
    name="qualification_level",
    create_type=False,
)


class Teacher(Base):
    """A DepEd teacher registered in the POLARIS system."""

    __tablename__ = "teachers"
    __table_args__ = (
        CheckConstraint("years_experience >= 0", name="ck_teachers_years_experience"),
        CheckConstraint("tvi_score BETWEEN 0 AND 4", name="ck_teachers_tvi_score"),
        Index("idx_teachers_region", "region"),
        Index("idx_teachers_division", "division"),
        Index("idx_teachers_school_id", "school_id"),
        Index("idx_teachers_subject_area", "subject_area"),
        Index("idx_teachers_tvi_score", "tvi_score"),
        Index("idx_teachers_is_gida", "is_gida"),
    )

    # Identity
    deped_id: Mapped[str] = mapped_column(String(30), primary_key=True)
    star_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100))

    # Location (fully denormalized per §2.3.3)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    division: Mapped[str] = mapped_column(String(100), nullable=False)
    school_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("schools.school_id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    psgc_code: Mapped[str] = mapped_column(String(10), nullable=False)
    is_gida: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )

    # Professional profile
    subject_specialization: Mapped[str] = mapped_column(String(100), nullable=False)
    subject_area: Mapped[str] = mapped_column(SubjectAreaEnum, nullable=False)
    qualification_level: Mapped[str] = mapped_column(
        QualificationLevelEnum, nullable=False, server_default="'Bachelor'"
    )
    position_title: Mapped[str | None] = mapped_column(String(100))
    years_experience: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="0"
    )

    # POLARIS-ME display
    photo_url: Mapped[str | None] = mapped_column(Text)
    is_profile_public: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    work_history: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, server_default="'[]'"
    )

    # TVI (computed, never user-editable)
    tvi_score: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="0"
    )
    tvi_flag_recency: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    tvi_flag_mismatch: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    tvi_flag_gida: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    tvi_flag_outcomes: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )

    profile_extended: Mapped[TeacherProfileExtended | None] = relationship(
        "TeacherProfileExtended",
        back_populates="teacher",
        uselist=False,
        lazy="select",
    )
    registrations: Mapped[list[EventRegistration]] = relationship(
        "EventRegistration",
        back_populates="teacher",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Teacher deped_id={self.deped_id!r} name={self.last_name!r}>"
