from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict

FormKey = Literal["pds", "authority_to_travel", "csc_form_6", "school_clearance"]
EventSpecificFieldType = Literal["text", "select"]


class EventSpecificFieldDef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    label: str
    type: EventSpecificFieldType
    required: bool
    max_length: int | None = None
    options: list[str] | None = None


class TrainingEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    program_id: int
    program_name: str
    subject_area: str
    title: str
    organizer: str
    venue: str | None = None
    venue_region: str | None = None
    start_date: date
    end_date: date
    registration_deadline: date
    is_star_partnered: bool
    funding_source: str | None = None
    required_forms: list[FormKey]
    event_specific_fields: list[EventSpecificFieldDef]
    description: str | None = None
    capacity: int | None = None
    slots_remaining: int | None = None


class RecommendedEventOut(TrainingEventOut):
    reason_chip: str
    is_eligible: bool
    nomination_id: int | None = None
