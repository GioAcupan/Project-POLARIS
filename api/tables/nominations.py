"""SQLAlchemy ``Table`` for ``nominations`` (read-only joins; no ORM model)."""

from sqlalchemy import Column, Integer, String, Table

from api.models.base import Base

nominations_table = Table(
    "nominations",
    Base.metadata,
    Column("id", Integer, primary_key=True),
    Column("teacher_id", String(30), nullable=False),
    Column("program_id", Integer, nullable=False),
    Column("status", String, nullable=False),
    extend_existing=True,
)
