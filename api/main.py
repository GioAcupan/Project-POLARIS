import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


def _read_pitch_mode() -> bool:
    return os.getenv("POLARIS_PITCH_MODE", "true").strip().lower() == "true"


app = FastAPI(title="POLARIS API")
app.state.pitch_mode = _read_pitch_mode()

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
