from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app


class _FakeResult:
    def __init__(self, rows: list[Any] | None = None, scalar: Any | None = None) -> None:
        self._rows = rows or []
        self._scalar = scalar

    def scalars(self) -> "_FakeResult":
        return self

    def all(self) -> list[Any]:
        return self._rows

    def scalar_one(self) -> Any:
        return self._scalar


class _FakeSession:
    async def execute(self, statement: Any) -> _FakeResult:
        sql = str(statement)

        if "count(*)" in sql and "regional_scores" in sql:
            return _FakeResult(scalar=1)

        if "FROM regional_scores" in sql:
            row = SimpleNamespace(
                region="Region VIII",
                psgc_code="0800000000",
                underserved_score=72.0,
                supply_subscore=0,
                impact_subscore=0,
                demand_subscore=0,
                teacher_student_ratio=40,
                specialization_pct=61.0,
                star_coverage_pct=34.0,
                avg_nat_score=41.2,
                total_teachers=8400,
                student_pop=1_200_000,
                economic_loss=204.6,
                lays_score=4.9,
                demand_signal_count=47,
                ppst_content_knowledge=0.55,
                ppst_curriculum_planning=0.48,
                ppst_research_based_practice=0.62,
                ppst_assessment_literacy=0.42,
                ppst_professional_development=0.58,
                critical_pings=[],
                traffic_light="red",
                supply_score_badge=78.0,
                demand_score_badge=69.0,
                demand_legend_label="Requests",
                demand_note="Demand note",
                impact_score_badge=54.0,
            )
            return _FakeResult(rows=[row])

        if "FROM regional_supply_metrics" in sql:
            # Assert query carries display ordering requirement.
            assert "display_order" in sql
            rows = [
                SimpleNamespace(region="Region VIII", label="A", value=10.0),
                SimpleNamespace(region="Region VIII", label="B", value=20.0),
            ]
            return _FakeResult(rows=rows)

        if "FROM regional_demand_metrics" in sql:
            assert "display_order" in sql
            rows = [
                SimpleNamespace(region="Region VIII", label="X", requests=3),
                SimpleNamespace(region="Region VIII", label="Y", requests=5),
            ]
            return _FakeResult(rows=rows)

        if "FROM regional_impact_series" in sql:
            assert "year" in sql
            rows = [
                SimpleNamespace(region="Region VIII", year=2024, training_volume=120, avg_nat_score=44.5, avg_feedback=4.2),
                SimpleNamespace(region="Region VIII", year=2025, training_volume=150, avg_nat_score=46.0, avg_feedback=4.4),
            ]
            return _FakeResult(rows=rows)

        raise AssertionError(f"Unexpected SQL statement: {sql}")


def test_regions_endpoint_includes_enriched_payload_shape() -> None:
    async def _override_get_db():
        yield _FakeSession()

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app)
        response = client.get("/regions/")
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list) and len(body) == 1

        region = body[0]
        assert region["region"] == "Region VIII"

        assert region["supply_score_badge"] == 78.0
        assert region["supply_metrics"] == [
            {"label": "A", "value": 10.0},
            {"label": "B", "value": 20.0},
        ]

        assert region["demand_score_badge"] == 69.0
        assert region["demand_legend_label"] == "Requests"
        assert region["demand_note"] == "Demand note"
        assert region["demand_metrics"] == [
            {"label": "X", "requests": 3},
            {"label": "Y", "requests": 5},
        ]

        assert region["impact_score_badge"] == 54.0
        assert region["impact_series"] == [
            {"year": "2024", "training": 120.0, "nat": 44.5, "feedback": 4.2},
            {"year": "2025", "training": 150.0, "nat": 46.0, "feedback": 4.4},
        ]
    finally:
        app.dependency_overrides.clear()
