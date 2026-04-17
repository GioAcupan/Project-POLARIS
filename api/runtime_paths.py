"""Runtime-safe shared path helpers."""

from __future__ import annotations

import os
from pathlib import Path


def get_output_dir() -> Path:
    """Resolve writable output directory for generated artifacts."""
    configured = os.getenv("POLARIS_OUTPUT_DIR")
    if configured:
        return Path(configured)
    if os.getenv("VERCEL"):
        return Path("/tmp/polaris/generated")
    return Path("api/generated")


def ensure_output_dir() -> Path:
    """Create output directory when possible and return its path."""
    out_dir = get_output_dir()
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir
