"""Centralised async database connectivity for POLARIS.

All routers that need a database session should import and use `get_db`:

    from api.db import get_db
    from fastapi import Depends
    from sqlalchemy.ext.asyncio import AsyncSession

    async def my_endpoint(db: AsyncSession = Depends(get_db)) -> ...:
        ...
"""

import os
from collections.abc import AsyncGenerator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Repo-root `.env` (local dev). Safe no-op when the file is absent (e.g. Docker env).
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,      # detects dead connections (Supabase cold start)
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,        # recycle connections every 5 min
    # Supabase pooler (PgBouncer, transaction mode) cannot reuse asyncpg prepared
    # statements across pooled server connections — disable statement cache.
    connect_args={"statement_cache_size": 0},
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a managed async session."""
    async with async_session_factory() as session:
        yield session
