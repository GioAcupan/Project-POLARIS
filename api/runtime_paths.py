"""Runtime-safe shared path helpers."""

from __future__ import annotations

import errno
import os
from pathlib import Path


def get_output_dir() -> Path:
    """Resolve writable output directory for generated artifacts."""
    configured = os.getenv("POLARIS_OUTPUT_DIR")
    if configured:
        return Path(configured)
    # Vercel serverless filesystems are read-only except /tmp.
    if (
        os.getenv("VERCEL")
        or os.getenv("VERCEL_ENV")
        or os.getenv("VERCEL_URL")
        or os.getenv("AWS_REGION")
        or os.getenv("LAMBDA_TASK_ROOT")
    ):
        return Path("/tmp/polaris/generated")
    return Path("api/generated")


def ensure_output_dir() -> Path:
    """Create output directory when possible and return its path."""
    out_dir = get_output_dir()
    try:
        out_dir.mkdir(parents=True, exist_ok=True)
        return out_dir
    except OSError as exc:
        # Some serverless runtimes may not expose expected env markers.
        # If the selected path is read-only, always fall back to /tmp.
        if exc.errno != errno.EROFS:
            raise
        fallback = Path("/tmp/polaris/generated")
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback
