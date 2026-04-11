"""Temporary pre-flight script: verify Phase A tables exist in Supabase/Postgres.

Usage (from repo root, with DATABASE_URL in environment or .env):
    python check_db.py

Exits 0 if all tables exist, 1 otherwise.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import asyncpg

REQUIRED = ("teacher_profile_extended", "training_events", "event_registrations")


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    root = Path(__file__).resolve().parent
    load_dotenv(root / ".env")


def _dsn_from_database_url(raw: str) -> str:
    """Strip SQLAlchemy driver prefix so asyncpg can connect."""
    if raw.startswith("postgresql+asyncpg://"):
        return "postgresql://" + raw.split("postgresql+asyncpg://", 1)[1]
    return raw


async def _run() -> int:
    _load_env()
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL is not set (add to .env or export it).", file=sys.stderr)
        return 1

    dsn = _dsn_from_database_url(url)
    try:
        conn = await asyncpg.connect(dsn=dsn)
    except Exception as e:
        print(f"ERROR: could not connect: {e}", file=sys.stderr)
        return 1

    try:
        missing: list[str] = []
        for name in REQUIRED:
            exists = await conn.fetchval(
                """
                SELECT EXISTS (
                  SELECT 1
                  FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = $1
                )
                """,
                name,
            )
            status = "OK" if exists else "MISSING"
            print(f"  {name}: {status}")
            if not exists:
                missing.append(name)

        if missing:
            print(f"\nFAIL: missing table(s): {', '.join(missing)}", file=sys.stderr)
            return 1
        print("\nAll Phase A tables present.")
        return 0
    finally:
        await conn.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_run()))
