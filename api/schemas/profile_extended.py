from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

SexLiteral = Literal["Male", "Female"]
CivilStatusLiteral = Literal["Single", "Married", "Separated", "Widowed"]


class ProfileExtendedUpsert(BaseModel):
    """Mirrors TS ProfileExtendedUpsert (omits deped_id, completeness_score, last_verified_at, updated_at)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name_extension: str | None = None
    sex: SexLiteral | None = None
    date_of_birth: date | None = None
    civil_status: CivilStatusLiteral | None = None
    place_of_birth: str | None = None
    citizenship: str | None = None
    height_cm: float | None = Field(None, ge=50, le=250)
    weight_kg: float | None = Field(None, ge=20, le=300)
    blood_type: str | None = None
    mobile_number: str | None = None
    telephone_number: str | None = None
    email: EmailStr | None = None
    addr_house_no: str | None = None
    addr_street: str | None = None
    addr_subdivision: str | None = None
    addr_barangay: str | None = None
    addr_city: str | None = None
    addr_province: str | None = None
    addr_zip: str | None = Field(None, pattern=r"^\d{4}$")

    @field_validator("mobile_number", "telephone_number", mode="before")
    @classmethod
    def normalize_phone(cls, v: object) -> str | None:
        # Optional leading '+', then digits only; empty/whitespace -> None.
        if v is None:
            return None
        if not isinstance(v, str):
            raise TypeError("expected string or null")
        s = v.strip()
        if not s:
            return None
        leading_plus = s.startswith("+")
        digits = "".join(c for c in s if c.isdigit())
        if not digits:
            return None
        return f"+{digits}" if leading_plus else digits
