from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

RegistrationStatus = Literal[
    "draft",
    "forms_generated",
    "submitted",
    "approved",
    "attended",
    "completed",
    "cancelled",
]


class RegisterEventRequest(BaseModel):
    deped_id: str
    event_specific_answers: dict[str, str]


class RegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: str
    event_id: int
    status: RegistrationStatus
    event_specific_answers: dict[str, str]
    nomination_id: int | None = None
    generated_pds_path: str | None = None
    generated_at: datetime | None = None
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
    attended_at: datetime | None = None
    cancelled_at: datetime | None = None
    next_action: str = ""
    created_at: datetime
    updated_at: datetime


class ActiveRegistrationEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    organizer: str
    venue: str | None = None
    start_date: date
    end_date: date


class ActiveRegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: RegistrationStatus
    next_action: str
    event: ActiveRegistrationEventOut
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
    generated_at: datetime | None = None


class VerifyResponse(BaseModel):
    verified_at: datetime


class GeneratePDSResponse(BaseModel):
    download_url: str
    preview_image_url: str
    generated_at: datetime
    registration: RegistrationOut


class StatusPatchRequest(BaseModel):
    status: RegistrationStatus
