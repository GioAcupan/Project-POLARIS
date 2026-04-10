"""Shared SQLAlchemy 2.0 DeclarativeBase for all POLARIS ORM models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
