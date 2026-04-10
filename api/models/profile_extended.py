"""ORM model for the `teacher_profile_extended` table (v3.4 DB2)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .teacher import Teacher


class TeacherProfileExtended(Base):
    """Extended personal-data profile for a teacher (CSC Form 212 source data).

    One-to-one with `teachers.deped_id`; the FK is also the PK.
    """

    __tablename__ = "teacher_profile_extended"
    __table_args__ = (
        CheckConstraint("sex IS NULL OR sex IN ('Male', 'Female')", name="ck_tpe_sex"),
        CheckConstraint(
            "civil_status IS NULL OR civil_status IN "
            "('Single', 'Married', 'Separated', 'Widowed')",
            name="ck_tpe_civil_status",
        ),
        CheckConstraint(
            "completeness_score BETWEEN 0 AND 100",
            name="ck_tpe_completeness_score",
        ),
        Index("idx_teacher_profile_extended_last_verified_at", "last_verified_at"),
    )

    deped_id: Mapped[str] = mapped_column(
        String(30),
        ForeignKey("teachers.deped_id", ondelete="CASCADE"),
        primary_key=True,
    )
    name_extension: Mapped[str | None] = mapped_column(String(10))
    sex: Mapped[str | None] = mapped_column(String(10))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    civil_status: Mapped[str | None] = mapped_column(String(20))
    place_of_birth: Mapped[str | None] = mapped_column(String(255))
    citizenship: Mapped[str | None] = mapped_column(String(50), server_default="Filipino")
    height_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    blood_type: Mapped[str | None] = mapped_column(String(5))
    mobile_number: Mapped[str | None] = mapped_column(String(20))
    telephone_number: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(100))
    addr_house_no: Mapped[str | None] = mapped_column(String(50))
    addr_street: Mapped[str | None] = mapped_column(String(100))
    addr_subdivision: Mapped[str | None] = mapped_column(String(100))
    addr_barangay: Mapped[str | None] = mapped_column(String(100))
    addr_city: Mapped[str | None] = mapped_column(String(100))
    addr_province: Mapped[str | None] = mapped_column(String(100))
    addr_zip: Mapped[str | None] = mapped_column(String(10))
    completeness_score: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="0"
    )
    last_verified_at: Mapped[datetime | None] = mapped_column()
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )

    teacher: Mapped[Teacher] = relationship(
        "Teacher",
        back_populates="profile_extended",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<TeacherProfileExtended deped_id={self.deped_id!r} "
            f"completeness={self.completeness_score}>"
        )
