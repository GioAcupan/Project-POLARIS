import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import api.models  # noqa: F401 — ensures all ORM models are registered on startup
from api.routers import chat as chat_router
from api.routers import reports as reports_router

logger = logging.getLogger("polaris")


def _read_pitch_mode() -> bool:
    return os.getenv("POLARIS_PITCH_MODE", "true").strip().lower() == "true"


def _check_report_templates() -> None:
    """Warn at startup if any report template file is missing (§E.2.1)."""
    templates_dir = Path(__file__).resolve().parent / "templates" / "reports"
    required = [
        "quarterly_performance.md",
        "intervention_priority.md",
        "executive_summary.md",
    ]
    for name in required:
        if not (templates_dir / name).exists():
            logger.warning("Missing report template: api/templates/reports/%s", name)


app = FastAPI(title="POLARIS API")
app.state.pitch_mode = _read_pitch_mode()

app.include_router(chat_router.router)
app.include_router(reports_router.router)

_check_report_templates()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "pitch_mode": app.state.pitch_mode,
    }
