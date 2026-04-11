"""Temporary pre-flight script: verify Phase A tables exist in Supabase/Postgres.

Also verifies `teacher_profile_extended` has a PRIMARY KEY on `deped_id` (required
for POST ... ON CONFLICT (deped_id)).

Usage (from repo root, with DATABASE_URL in environment or .env):
    python check_db.py

Exits 0 if all checks pass, 1 otherwise.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import asyncpg

REQUIRED = ("teacher_profile_extended", "training_events", "event_registrations")

_EXPECTED_TPE_PK = ("deped_id",)


async def _primary_key_columns(
    conn: asyncpg.Connection, table_name: str
) -> list[str]:
    """Ordered PK column names for `public.table_name`, or empty if none."""
    rows = await conn.fetch(
        """
        SELECT kcu.column_name
        FROM information_schema.table_constraints AS tc
        INNER JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_catalog = kcu.constraint_catalog
          AND tc.constraint_schema = kcu.constraint_schema
          AND tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position
        """,
        table_name,
    )
    return [str(r["column_name"]) for r in rows]


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

        pk_cols = await _primary_key_columns(conn, "teacher_profile_extended")
        if tuple(pk_cols) != _EXPECTED_TPE_PK:
            print(
                f"\nFAIL: teacher_profile_extended PRIMARY KEY must be {_EXPECTED_TPE_PK!r}, "
                f"got {tuple(pk_cols)!r}. Apply db/migrations/003_v34_module4_and_starbot.sql "
                "on your database (direct connection, not pooler).",
                file=sys.stderr,
            )
            return 1
        print(
            f"  teacher_profile_extended PK: OK ({', '.join(pk_cols)} - UPSERT conflict target valid)."
        )
        return 0
    finally:
        await conn.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_run()))
