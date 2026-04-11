"""PDS file download with friendly Content-Disposition (v3.4 BE5)."""

from __future__ import annotations

import os
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.db import get_db
from api.models.event_registration import EventRegistration
from api.models.teacher import Teacher

router = APIRouter(tags=["downloads"])

OUTPUT_DIR = Path(os.getenv("POLARIS_OUTPUT_DIR", "/var/polaris/generated"))
_PDS_FILENAME_RE = re.compile(r"^\d+_pds\.xlsx$")

_PITCH_FRIENDLY_NAME = "Renato_DelaCruz_PDS.xlsx"


def _friendly_from_teacher(first_name: str, last_name: str) -> str:
    """Build `{First}_{Last}_PDS.xlsx` with spaces normalized to underscores."""
    fn = "_".join(first_name.split())
    ln = "_".join(last_name.split())
    return f"{fn}_{ln}_PDS.xlsx"


@router.get("/downloads/{filename}")
async def download_pds(
    filename: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    if not _PDS_FILENAME_RE.match(filename):
        raise HTTPException(status_code=404, detail="File not found")

    full_path = OUTPUT_DIR / filename
    if not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    pitch_mode: bool = request.app.state.pitch_mode
    if pitch_mode:
        download_name = _PITCH_FRIENDLY_NAME
    else:
        m = re.match(r"^(\d+)_pds\.xlsx$", filename)
        reg_id = int(m.group(1)) if m else 0
        reg = await db.scalar(
            select(EventRegistration)
            .where(EventRegistration.id == reg_id)
            .options(selectinload(EventRegistration.teacher))
        )
        if reg and reg.teacher:
            t = reg.teacher
            download_name = _friendly_from_teacher(t.first_name, t.last_name)
        else:
            download_name = filename

    media_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    return FileResponse(
        path=str(full_path),
        media_type=media_type,
        filename=download_name,
        content_disposition_type="attachment",
    )
