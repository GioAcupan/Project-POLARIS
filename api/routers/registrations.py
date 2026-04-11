"""Event registration lifecycle (v3.4 B.5 / BE4)."""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.db import get_db
from api.intel.form_generator import generate_pds_xlsx
from api.models.event_registration import EventRegistration
from api.models.profile_extended import TeacherProfileExtended
from api.models.teacher import Teacher
from api.models.training_event import TrainingEvent
from api.schemas.events import EventSpecificFieldDef
from api.schemas.registrations import (
    ActiveRegistrationEventOut,
    ActiveRegistrationOut,
    GeneratePDSResponse,
    RegisterEventRequest,
    RegistrationOut,
    StatusPatchRequest,
    VerifyResponse,
)
from api.tables.nominations import nominations_table

logger = logging.getLogger(__name__)

router = APIRouter(tags=["registrations"])

OUTPUT_DIR = os.getenv("POLARIS_OUTPUT_DIR", "/var/polaris/generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["forms_generated", "cancelled"],
    "forms_generated": ["submitted", "cancelled"],
    "submitted": ["approved", "cancelled"],
    "approved": ["attended", "cancelled"],
    "attended": ["completed"],
    "completed": [],
    "cancelled": [],
}


def compute_next_action(status: str, event: TrainingEvent) -> str:
    """Human-readable next step for the teacher (Part C §14–18)."""
    if status == "draft":
        return "Complete sign-up to generate your forms"
    if status == "forms_generated":
        return "Get school head signature on your PDS"
    if status == "submitted":
        return "Waiting for division approval"
    if status == "approved":
        return f"Prepare for {event.title} on {event.start_date}"
    if status == "attended":
        return "Upload your certificate of appearance"
    if status == "completed":
        return "All done"
    if status == "cancelled":
        return "Cancelled"
    return ""


def _registration_out(reg: EventRegistration) -> RegistrationOut:
    return RegistrationOut(
        id=reg.id,
        teacher_id=reg.teacher_id,
        event_id=reg.event_id,
        status=reg.status,  # type: ignore[arg-type]
        event_specific_answers=dict(reg.event_specific_answers or {}),
        nomination_id=reg.nomination_id,
        generated_pds_path=reg.generated_pds_path,
        generated_at=reg.generated_at,
        submitted_at=reg.submitted_at,
        approved_at=reg.approved_at,
        attended_at=reg.attended_at,
        cancelled_at=reg.cancelled_at,
        next_action=reg.next_action or "",
        created_at=reg.created_at,
        updated_at=reg.updated_at,
    )


def _validate_event_specific_answers(
    event: TrainingEvent,
    answers: dict[str, str],
) -> None:
    raw = event.event_specific_fields or []
    for item in raw:
        if not isinstance(item, dict):
            continue
        field = EventSpecificFieldDef.model_validate(item)
        val = answers.get(field.key)
        if field.required and (val is None or val.strip() == ""):
            raise HTTPException(
                status_code=422,
                detail=f"Missing or empty required field: {field.key}",
            )
        if val is None:
            continue
        if field.type == "text":
            if field.max_length is not None and len(val) > field.max_length:
                raise HTTPException(
                    status_code=422,
                    detail=f"Field {field.key} exceeds max_length {field.max_length}",
                )
        elif field.type == "select":
            opts = field.options or []
            if val not in opts:
                raise HTTPException(
                    status_code=422,
                    detail=f"Field {field.key} must be one of {opts!r}",
                )


@router.post("/events/{event_id}/register", response_model=RegistrationOut)
async def register_for_event(
    event_id: int,
    body: RegisterEventRequest,
    db: AsyncSession = Depends(get_db),
) -> RegistrationOut:
    teacher_ok = await db.scalar(
        select(Teacher.deped_id).where(Teacher.deped_id == body.deped_id)
    )
    if teacher_ok is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    event = await db.scalar(
        select(TrainingEvent).where(TrainingEvent.id == event_id)
    )
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    nomination_id = await db.scalar(
        select(nominations_table.c.id).where(
            nominations_table.c.teacher_id == body.deped_id,
            nominations_table.c.program_id == event.program_id,
            nominations_table.c.status == "eligible",
        )
    )
    if nomination_id is None:
        raise HTTPException(
            status_code=403,
            detail="No eligible nomination for this program.",
        )

    _validate_event_specific_answers(event, body.event_specific_answers)

    existing = await db.scalar(
        select(EventRegistration.id).where(
            EventRegistration.teacher_id == body.deped_id,
            EventRegistration.event_id == event_id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Already registered for this event.")

    reg = EventRegistration(
        teacher_id=body.deped_id,
        event_id=event_id,
        status="draft",
        event_specific_answers=body.event_specific_answers,
        nomination_id=nomination_id,
        next_action=compute_next_action("draft", event),
    )
    db.add(reg)
    await db.commit()
    await db.refresh(reg)
    return _registration_out(reg)


@router.post("/registrations/{reg_id}/verify", response_model=VerifyResponse)
async def verify_registration(
    reg_id: int,
    db: AsyncSession = Depends(get_db),
) -> VerifyResponse:
    reg = await db.scalar(select(EventRegistration).where(EventRegistration.id == reg_id))
    if reg is None:
        raise HTTPException(status_code=404, detail="Registration not found")

    profile = await db.scalar(
        select(TeacherProfileExtended).where(
            TeacherProfileExtended.deped_id == reg.teacher_id
        )
    )
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Extended profile not found for this teacher; complete Tier 1 profile first.",
        )

    now = datetime.now(timezone.utc)
    profile.last_verified_at = now
    await db.commit()

    return VerifyResponse(verified_at=now)


@router.post("/registrations/{reg_id}/generate-pds", response_model=GeneratePDSResponse)
async def generate_pds(
    reg_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> GeneratePDSResponse:
    pitch_mode: bool = request.app.state.pitch_mode

    reg = await db.scalar(
        select(EventRegistration)
        .where(EventRegistration.id == reg_id)
        .options(
            selectinload(EventRegistration.event),
            selectinload(EventRegistration.teacher).selectinload(Teacher.profile_extended),
        )
    )
    if reg is None:
        raise HTTPException(status_code=404, detail="Registration not found")

    profile = reg.teacher.profile_extended if reg.teacher else None
    if profile is None or profile.last_verified_at is None:
        raise HTTPException(
            status_code=428,
            detail="Profile must be verified before generating PDS.",
        )

    age = datetime.now(timezone.utc) - profile.last_verified_at
    if age.total_seconds() >= 3600:
        raise HTTPException(
            status_code=428,
            detail="Verification expired; verify again within 1 hour before generating PDS.",
        )

    event = reg.event
    if event is None:
        raise HTTPException(status_code=500, detail="Event missing for registration.")

    out_path = Path(OUTPUT_DIR) / f"{reg_id}_pds.xlsx"
    template = Path(__file__).resolve().parents[1] / "templates" / "forms" / "demo_pds_prefilled.xlsx"

    if pitch_mode:
        await asyncio.sleep(1.2)
        if not out_path.exists():
            if not template.is_file():
                raise HTTPException(
                    status_code=500,
                    detail=f"Demo template missing: {template}",
                )
            shutil.copy(template, out_path)
    else:
        joined_context = {
            "registration_id": reg_id,
            "teacher": reg.teacher,
            "profile_extended": profile,
            "event": event,
        }
        try:
            path_str = await generate_pds_xlsx(reg_id, joined_context)
        except FileNotFoundError as exc:
            logger.error("PDS generation failed: %s", exc)
            raise HTTPException(
                status_code=500,
                detail=(
                    "PDS template is not available on the server "
                    "(expected api/templates/forms/csc_form_212.xlsx)."
                ),
            ) from exc
        out_path = Path(path_str)

    generated_at = datetime.now(timezone.utc)
    reg.status = "forms_generated"
    reg.generated_pds_path = str(out_path)
    reg.generated_at = generated_at
    reg.next_action = compute_next_action("forms_generated", event)
    await db.commit()
    await db.refresh(reg)

    return GeneratePDSResponse(
        download_url=f"/downloads/{reg_id}_pds.xlsx",
        preview_image_url="/static/forms/demo_pds_preview.png",
        generated_at=generated_at,
        registration=_registration_out(reg),
    )


def _apply_status_timestamp(reg: EventRegistration, new_status: str) -> None:
    now = datetime.now(timezone.utc)
    if new_status == "submitted":
        reg.submitted_at = now
    elif new_status == "approved":
        reg.approved_at = now
    elif new_status == "attended":
        reg.attended_at = now
    elif new_status == "cancelled":
        reg.cancelled_at = now


@router.patch("/registrations/{reg_id}/status", response_model=RegistrationOut)
async def patch_registration_status(
    reg_id: int,
    body: StatusPatchRequest,
    db: AsyncSession = Depends(get_db),
) -> RegistrationOut:
    reg = await db.scalar(
        select(EventRegistration)
        .where(EventRegistration.id == reg_id)
        .options(selectinload(EventRegistration.event))
    )
    if reg is None:
        raise HTTPException(status_code=404, detail="Registration not found")

    current = reg.status
    allowed = ALLOWED_TRANSITIONS.get(current, [])
    if body.status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid transition from {current!r} to {body.status!r}.",
        )

    event = reg.event
    if event is None:
        raise HTTPException(status_code=500, detail="Event missing for registration.")

    reg.status = body.status
    _apply_status_timestamp(reg, body.status)
    reg.next_action = compute_next_action(body.status, event)
    await db.commit()
    await db.refresh(reg)
    return _registration_out(reg)


@router.get(
    "/teachers/{deped_id}/active-registrations",
    response_model=list[ActiveRegistrationOut],
)
async def active_registrations(
    deped_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[ActiveRegistrationOut]:
    stmt = (
        select(EventRegistration, TrainingEvent)
        .join(TrainingEvent, EventRegistration.event_id == TrainingEvent.id)
        .where(
            EventRegistration.teacher_id == deped_id,
            EventRegistration.status.in_(
                ("forms_generated", "submitted", "approved")
            ),
        )
        .order_by(TrainingEvent.start_date.asc())
        .limit(3)
    )
    result = await db.execute(stmt)
    rows = result.all()

    out: list[ActiveRegistrationOut] = []
    for reg, event in rows:
        out.append(
            ActiveRegistrationOut(
                id=reg.id,
                status=reg.status,  # type: ignore[arg-type]
                next_action=reg.next_action or "",
                event=ActiveRegistrationEventOut(
                    id=event.id,
                    title=event.title,
                    organizer=event.organizer,
                    venue=event.venue,
                    start_date=event.start_date,
                    end_date=event.end_date,
                ),
                submitted_at=reg.submitted_at,
                approved_at=reg.approved_at,
                generated_at=reg.generated_at,
            )
        )
    return out
