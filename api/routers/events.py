"""Training events — recommended list for a teacher (v3.4 B.5 / BE3)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.intel.ppst_gap import get_largest_ppst_gap
from api.models.program import Program
from api.models.teacher import Teacher
from api.models.training_event import TrainingEvent
from api.tables.nominations import nominations_table
from api.schemas.events import (
    EventSpecificFieldDef,
    FormKey,
    RecommendedEventOut,
    TrainingEventOut,
)

router = APIRouter(tags=["events"])


def _program_subject_area_str(program: Program) -> str:
    sa = program.subject_area
    if hasattr(sa, "value"):
        return str(sa.value)
    return str(sa)


def _training_event_to_out(event: TrainingEvent, program: Program) -> TrainingEventOut:
    raw_fields = event.event_specific_fields or []
    fields: list[EventSpecificFieldDef] = []
    for item in raw_fields:
        if isinstance(item, dict):
            fields.append(EventSpecificFieldDef.model_validate(item))

    raw_forms = event.required_forms or []
    forms: list[FormKey] = []
    for k in raw_forms:
        if k in ("pds", "authority_to_travel", "csc_form_6", "school_clearance"):
            forms.append(k)  # type: ignore[arg-type]

    return TrainingEventOut(
        id=event.id,
        program_id=program.id,
        program_name=program.program_name,
        subject_area=_program_subject_area_str(program),
        title=event.title,
        organizer=event.organizer,
        venue=event.venue,
        venue_region=event.venue_region,
        start_date=event.start_date,
        end_date=event.end_date,
        registration_deadline=event.registration_deadline,
        is_star_partnered=event.is_star_partnered,
        funding_source=event.funding_source,
        required_forms=forms,
        event_specific_fields=fields,
        description=event.description,
        capacity=event.capacity,
        slots_remaining=event.slots_remaining,
    )


def _matches_specialization(teacher: Teacher, program: Program) -> bool:
    """Tier-2 heuristic: program subject area vs teacher.subject_specialization text."""
    s = teacher.subject_specialization.lower()
    sa = _program_subject_area_str(program)
    if sa == "Both":
        return any(
            w in s
            for w in ("science", "math", "mathematics", "physics", "chem", "stem")
        )
    if sa == "Science":
        return any(w in s for w in ("science", "physics", "chem", "bio", "stem"))
    if sa == "Mathematics":
        return "math" in s or "mathematics" in s
    return False


def _compute_tier(
    program: Program,
    gap_subject_areas: list[str],
    teacher: Teacher,
) -> int:
    sa = _program_subject_area_str(program)
    if sa in gap_subject_areas:
        return 1
    if _matches_specialization(teacher, program):
        return 2
    return 3


def _compute_reason_chip(
    tier: int,
    gap_axis_name: str,
) -> str:
    if tier == 1:
        return f"Closes your {gap_axis_name} gap"
    if tier == 2:
        return "Matches your specialization"
    return "STAR-partnered"


@router.get("/events/recommended", response_model=list[RecommendedEventOut])
async def recommended_events(
    deped_id: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[RecommendedEventOut]:
    teacher = await db.scalar(select(Teacher).where(Teacher.deped_id == deped_id))
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    gap_axis_name, gap_subject_areas = await get_largest_ppst_gap(db, teacher.region)

    # registration_deadline > current_date + 3 days; start_date > current_date (Part A B.5)
    stmt = (
        select(TrainingEvent, Program, nominations_table.c.id.label("nomination_id"))
        .join(Program, TrainingEvent.program_id == Program.id)
        .outerjoin(
            nominations_table,
            and_(
                nominations_table.c.teacher_id == deped_id,
                nominations_table.c.program_id == Program.id,
                nominations_table.c.status == "eligible",
            ),
        )
        .where(
            TrainingEvent.is_star_partnered.is_(True),
            TrainingEvent.registration_deadline
            > text("CURRENT_DATE + INTERVAL '3 days'"),
            TrainingEvent.start_date > func.current_date(),
        )
    )

    result = await db.execute(stmt)
    rows = result.all()

    decorated: list[tuple[int, TrainingEvent, Program, int | None]] = []
    for event, program, nomination_id in rows:
        tier = _compute_tier(program, gap_subject_areas, teacher)
        decorated.append((tier, event, program, nomination_id))

    decorated.sort(key=lambda t: (t[0], t[1].start_date))
    decorated = decorated[:limit]

    out: list[RecommendedEventOut] = []
    for tier, event, program, nomination_id in decorated:
        base = _training_event_to_out(event, program)
        is_eligible = nomination_id is not None
        chip = _compute_reason_chip(tier, gap_axis_name)
        out.append(
            RecommendedEventOut(
                **base.model_dump(),
                reason_chip=chip,
                is_eligible=is_eligible,
                nomination_id=nomination_id,
            )
        )
    return out
