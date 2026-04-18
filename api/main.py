import logging
import os
import json
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import api.models  # noqa: F401 — ensures all ORM models are registered on startup
import api.tables.nominations  # noqa: F401 — nominations Table on Base.metadata
from api.runtime_paths import ensure_output_dir
from api.routers import chat as chat_router
from api.routers import downloads as downloads_router
from api.routers import events as events_router
from api.routers import intelligence as intelligence_router
from api.routers import profile_extended as profile_extended_router
from api.routers import regions as regions_router
from api.routers import registrations as registrations_router
from api.routers import reports as reports_router

if not logging.root.handlers:
    logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("polaris")
DEBUG_LOG_PATH = Path("debug-180a45.log")


def _debug_log(
    *,
    hypothesis_id: str,
    location: str,
    message: str,
    data: dict[str, object],
    run_id: str = "initial",
) -> None:
    payload = {
        "sessionId": "180a45",
        "runId": run_id,
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    with DEBUG_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, separators=(",", ":")) + "\n")


def _read_pitch_mode() -> bool:
    return os.getenv("POLARIS_PITCH_MODE", "false").strip().lower() == "true"


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


def _read_cors_origins() -> list[str]:
    """
    Read comma-separated allowed origins for browser clients.
    Defaults cover local Vite dev + preview ports.
    """
    raw = os.getenv(
        "POLARIS_CORS_ORIGINS",
        ",".join(
            [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:4173",
                "http://127.0.0.1:4173",
            ]
        ),
    )
    # region agent log
    _debug_log(
        hypothesis_id="H1",
        location="api/main.py:_read_cors_origins",
        message="Raw CORS origins env value",
        data={"rawOrigins": raw},
    )
    # endregion
    origins = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
    # region agent log
    _debug_log(
        hypothesis_id="H2",
        location="api/main.py:_read_cors_origins",
        message="Parsed CORS origins list",
        data={"parsedOrigins": origins, "count": len(origins)},
    )
    # endregion
    if origins:
        return origins
    return ["http://localhost:5173", "http://127.0.0.1:5173"]


app = FastAPI(title="POLARIS API")
app.state.pitch_mode = _read_pitch_mode()

app.include_router(chat_router.router)
app.include_router(regions_router.router)
app.include_router(intelligence_router.router)
app.include_router(reports_router.router)
app.include_router(events_router.router)
app.include_router(registrations_router.router)
app.include_router(profile_extended_router.router)
app.include_router(downloads_router.router)

logger.info("POLARIS pitch_mode=%s", app.state.pitch_mode)

_check_report_templates()

cors_origins = _read_cors_origins()
logger.info("POLARIS CORS allow_origins=%s", cors_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def debug_request_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    # region agent log
    _debug_log(
        hypothesis_id="H3",
        location="api/main.py:debug_request_origin",
        message="Incoming request origin",
        data={"path": request.url.path, "method": request.method, "origin": origin},
    )
    # endregion
    response = await call_next(request)
    # region agent log
    _debug_log(
        hypothesis_id="H4",
        location="api/main.py:debug_request_origin",
        message="Outgoing CORS response header",
        data={
            "path": request.url.path,
            "allowOriginHeader": response.headers.get("access-control-allow-origin"),
            "status": response.status_code,
        },
    )
    # endregion
    return response

DOWNLOADS_DIR = str(ensure_output_dir())

static_dir = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "pitch_mode": app.state.pitch_mode,
    }
