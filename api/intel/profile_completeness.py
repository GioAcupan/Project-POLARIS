"""Tier-1 profile completeness for `teacher_profile_extended` (v3.4 Prompt B.2)."""

from __future__ import annotations

from decimal import Decimal

# 14 fields with PDS cell mappings
TIER_1_MAPPED_FIELDS: list[str] = [
    "name_extension",
    "sex",
    "date_of_birth",
    "civil_status",
    "mobile_number",
    "telephone_number",
    "email",
    "addr_house_no",
    "addr_street",
    "addr_subdivision",
    "addr_barangay",
    "addr_city",
    "addr_province",
    "addr_zip",
]

# 5 fields collected but not yet mapped to PDS cells
TIER_1_UNMAPPED_FIELDS: list[str] = [
    "place_of_birth",
    "citizenship",
    "height_cm",
    "weight_kg",
    "blood_type",
]

ALL_TIER_1_FIELDS: list[str] = TIER_1_MAPPED_FIELDS + TIER_1_UNMAPPED_FIELDS

# 9 fields required before event sign-up (Part A §A.1)
REQUIRED_FOR_SIGNUP: frozenset[str] = frozenset(
    {
        "sex",
        "date_of_birth",
        "civil_status",
        "mobile_number",
        "email",
        "addr_barangay",
        "addr_city",
        "addr_province",
        "addr_zip",
    }
)


def _is_filled(val: object) -> bool:
    """True if the value counts as present for completeness / eligibility."""
    if val is None:
        return False
    if isinstance(val, str):
        return val.strip() != ""
    if isinstance(val, Decimal):
        return True
    if isinstance(val, (int, float)):
        return True
    # date, datetime, etc.
    return True


def compute_completeness(profile: object) -> int:
    """Return 0–100: percentage of ALL_TIER_1_FIELDS that are non-null/non-empty."""
    total = len(ALL_TIER_1_FIELDS)
    if total == 0:
        return 0
    filled = sum(
        1 for name in ALL_TIER_1_FIELDS if _is_filled(getattr(profile, name, None))
    )
    return int(round(100.0 * filled / total))


def is_signup_eligible(profile: object) -> bool:
    """True iff every REQUIRED_FOR_SIGNUP field is non-null/non-empty."""
    for name in REQUIRED_FOR_SIGNUP:
        if not _is_filled(getattr(profile, name, None)):
            return False
    return True
