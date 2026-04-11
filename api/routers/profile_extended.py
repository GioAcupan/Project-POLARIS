"""Extended teacher profile upsert (v3.4 BE6)."""

from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.intel.profile_completeness import compute_completeness
from api.models.profile_extended import TeacherProfileExtended
from api.models.teacher import Teacher
from api.schemas.profile_extended import ProfileExtendedOut, ProfileExtendedUpsert

router = APIRouter(tags=["profile"])


def _normalize_upsert_payload(data: dict[str, object]) -> dict[str, object]:
    """Convert Pydantic dump values to DB-friendly types."""
    out = dict(data)
    if "height_cm" in out and out["height_cm"] is not None:
        out["height_cm"] = Decimal(str(out["height_cm"]))
    if "weight_kg" in out and out["weight_kg"] is not None:
        out["weight_kg"] = Decimal(str(out["weight_kg"]))
    return out


@router.post(
    "/teachers/{deped_id}/profile-extended",
    response_model=ProfileExtendedOut,
)
async def upsert_profile_extended(
    deped_id: str,
    body: ProfileExtendedUpsert,
    db: AsyncSession = Depends(get_db),
) -> ProfileExtendedOut:
    teacher_ok = await db.scalar(
        select(Teacher.deped_id).where(Teacher.deped_id == deped_id)
    )
    if teacher_ok is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    raw = body.model_dump(exclude_unset=True, mode="python")
    data = _normalize_upsert_payload(raw)

    tbl = TeacherProfileExtended.__table__
    insert_dict: dict[str, object] = {"deped_id": deped_id, **data}

    stmt = insert(TeacherProfileExtended).values(**insert_dict)
    if data:
        set_: dict[object, object] = {
            tbl.c[k]: stmt.excluded[k] for k in data.keys()
        }
        set_[tbl.c.updated_at] = func.now()
        stmt = stmt.on_conflict_do_update(
            index_elements=[tbl.c.deped_id],
            set_=set_,
        )
    else:
        stmt = stmt.on_conflict_do_nothing(index_elements=[tbl.c.deped_id])

    await db.execute(stmt)
    await db.commit()

    profile = await db.scalar(
        select(TeacherProfileExtended).where(
            TeacherProfileExtended.deped_id == deped_id
        )
    )
    if profile is None:
        raise HTTPException(
            status_code=500,
            detail="Profile row missing after upsert.",
        )

    score = compute_completeness(profile)
    if profile.completeness_score != score:
        profile.completeness_score = score
        await db.commit()
        await db.refresh(profile)

    return ProfileExtendedOut.model_validate(profile)
