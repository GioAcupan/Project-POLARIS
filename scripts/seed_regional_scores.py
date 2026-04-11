"""One-off: upsert Region VIII into regional_scores + verify DEMO-001 profile (B.1 DB5).

Usage (repo root, DATABASE_URL in .env):
    python scripts/seed_regional_scores.py

Values align with POLARIS_FINAL_EXECUTION_BLUEPRINT.md §C Step 8 (score 42, Assessment Literacy 0.42)
and the smoke-test curl (ppst_research_based_practice 0.61).

Requires: asyncpg, python-dotenv (see requirements.txt).
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path


def _dsn() -> str:
    raw = os.environ.get("DATABASE_URL", "").strip()
    if not raw:
        print("ERROR: DATABASE_URL not set.", file=sys.stderr)
        raise SystemExit(1)
    if raw.startswith("postgresql+asyncpg://"):
        return "postgresql://" + raw.split("postgresql+asyncpg://", 1)[1]
    return raw


# §C Step 2 / Step 8 — Region VIII demo row (STARBOT + dashboard)
REGION_VIII_ROW = {
    "region": "Region VIII",
    "psgc_code": "0800000000",
    "underserved_score": 42.0,
    "supply_subscore": 38.0,
    "impact_subscore": 44.0,
    "demand_subscore": 48.0,
    "teacher_student_ratio": 32.5,
    "specialization_pct": 55.0,
    "star_coverage_pct": 40.0,
    "avg_nat_score": 58.0,
    "demand_signal_count": 12,
    "ppst_content_knowledge": 0.68,
    "ppst_curriculum_planning": 0.74,
    "ppst_research_based_practice": 0.61,
    "ppst_assessment_literacy": 0.42,
    "ppst_professional_development": 0.60,
    "critical_pings": [
        {
            "region": "Region VIII",
            "severity": "CRITICAL",
            "message": "Region VIII — Underserved score 42; specialization and supply stress.",
        },
        {
            "region": "Region VIII",
            "severity": "WARNING",
            "message": "STAR coverage below national target in coastal divisions.",
        },
    ],
    "total_teachers": 12400,
    "traffic_light": "red",
}


async def _run() -> int:
    try:
        import asyncpg
    except ImportError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    try:
        from dotenv import load_dotenv
    except ImportError:
        load_dotenv = None  # type: ignore[assignment]

    root = Path(__file__).resolve().parents[1]
    if load_dotenv:
        load_dotenv(root / ".env")

    dsn = _dsn()
    pings_json = json.dumps(REGION_VIII_ROW["critical_pings"])

    sql_upsert = """
    INSERT INTO regional_scores (
      region,
      psgc_code,
      underserved_score,
      supply_subscore,
      impact_subscore,
      demand_subscore,
      teacher_student_ratio,
      specialization_pct,
      star_coverage_pct,
      avg_nat_score,
      demand_signal_count,
      ppst_content_knowledge,
      ppst_curriculum_planning,
      ppst_research_based_practice,
      ppst_assessment_literacy,
      ppst_professional_development,
      critical_pings,
      total_teachers,
      traffic_light,
      computed_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16, $17::jsonb, $18, $19::traffic_light, NOW()
    )
    ON CONFLICT (region) DO UPDATE SET
      psgc_code = EXCLUDED.psgc_code,
      underserved_score = EXCLUDED.underserved_score,
      supply_subscore = EXCLUDED.supply_subscore,
      impact_subscore = EXCLUDED.impact_subscore,
      demand_subscore = EXCLUDED.demand_subscore,
      teacher_student_ratio = EXCLUDED.teacher_student_ratio,
      specialization_pct = EXCLUDED.specialization_pct,
      star_coverage_pct = EXCLUDED.star_coverage_pct,
      avg_nat_score = EXCLUDED.avg_nat_score,
      demand_signal_count = EXCLUDED.demand_signal_count,
      ppst_content_knowledge = EXCLUDED.ppst_content_knowledge,
      ppst_curriculum_planning = EXCLUDED.ppst_curriculum_planning,
      ppst_research_based_practice = EXCLUDED.ppst_research_based_practice,
      ppst_assessment_literacy = EXCLUDED.ppst_assessment_literacy,
      ppst_professional_development = EXCLUDED.ppst_professional_development,
      critical_pings = EXCLUDED.critical_pings,
      total_teachers = EXCLUDED.total_teachers,
      traffic_light = EXCLUDED.traffic_light,
      computed_at = NOW();
    """

    conn = await asyncpg.connect(dsn=dsn, statement_cache_size=0)
    try:
        await conn.execute(
            sql_upsert,
            REGION_VIII_ROW["region"],
            REGION_VIII_ROW["psgc_code"],
            REGION_VIII_ROW["underserved_score"],
            REGION_VIII_ROW["supply_subscore"],
            REGION_VIII_ROW["impact_subscore"],
            REGION_VIII_ROW["demand_subscore"],
            REGION_VIII_ROW["teacher_student_ratio"],
            REGION_VIII_ROW["specialization_pct"],
            REGION_VIII_ROW["star_coverage_pct"],
            REGION_VIII_ROW["avg_nat_score"],
            REGION_VIII_ROW["demand_signal_count"],
            REGION_VIII_ROW["ppst_content_knowledge"],
            REGION_VIII_ROW["ppst_curriculum_planning"],
            REGION_VIII_ROW["ppst_research_based_practice"],
            REGION_VIII_ROW["ppst_assessment_literacy"],
            REGION_VIII_ROW["ppst_professional_development"],
            pings_json,
            REGION_VIII_ROW["total_teachers"],
            REGION_VIII_ROW["traffic_light"],
        )
        row = await conn.fetchrow(
            """
            SELECT region, underserved_score, traffic_light::text AS tl,
                   ppst_assessment_literacy, ppst_research_based_practice
            FROM regional_scores WHERE region = $1
            """,
            "Region VIII",
        )
        print("[1] regional_scores — Region VIII")
        print(f"    region={row['region']} underserved_score={row['underserved_score']} "
              f"traffic_light={row['tl']}")
        print(f"    ppst_assessment_literacy={row['ppst_assessment_literacy']} "
              f"ppst_research_based_practice={row['ppst_research_based_practice']}")

        demo = await conn.fetchrow(
            """
            SELECT deped_id, completeness_score, last_verified_at,
                   sex, email, addr_zip, mobile_number
            FROM teacher_profile_extended
            WHERE deped_id = 'DEMO-001'
            """
        )
        print("\n[2] teacher_profile_extended — DEMO-001 (Renato / DB5)")
        if demo is None:
            print("    MISSING: run db/migrations/002_seed.sql (after 003) or insert DEMO-001 profile.")
            return 1
        ok = demo["completeness_score"] == 100 and demo["last_verified_at"] is not None
        print(
            f"    completeness_score={demo['completeness_score']} "
            f"last_verified_at={'set' if demo['last_verified_at'] else 'NULL'}"
        )
        print(f"    gates: sex={demo['sex']!r} email={demo['email']!r} addr_zip={demo['addr_zip']!r} "
              f"mobile={demo['mobile_number']!r}")
        if not ok:
            print("    WARN: expected completeness_score=100 and last_verified_at NOT NULL for pitch path.")
            return 1
        print("    DEMO-001 OK (100% + verified timestamp).")
        return 0
    finally:
        await conn.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_run()))
