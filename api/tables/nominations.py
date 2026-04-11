"""SQLAlchemy ``Table`` for ``nominations`` (read-only joins; no ORM model)."""

from sqlalchemy import Column, Integer, String, Table
from sqlalchemy.dialects.postgresql import ENUM

from api.models.base import Base

# Mirrors db/migrations/001_init.sql — `status` is Postgres ENUM, not VARCHAR.
_nomination_status = ENUM(
    "pending_eligibility",
    "eligible",
    "ineligible",
    "enrolled",
    name="nomination_status",
    create_type=False,
)

nominations_table = Table(
    "nominations",
    Base.metadata,
    Column("id", Integer, primary_key=True),
    Column("teacher_id", String(30), nullable=False),
    Column("program_id", Integer, nullable=False),
    Column("status", _nomination_status, nullable=False),
    extend_existing=True,
)
