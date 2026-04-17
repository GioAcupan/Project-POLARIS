"""Region name → short code mapping for POLARIS report filenames.

Source: POLARIS_FINAL_EXECUTION_BLUEPRINT.md §E.2.3
"""

REGION_CODE_MAP: dict[str, str] = {
    "Region I": "R1",
    "Region II": "R2",
    "Region III": "R3",
    "Region IV-A": "R4A",
    "Region IV-B": "R4B",
    "Region V": "R5",
    "Region VI": "R6",
    "Region VII": "R7",
    "Region VIII": "R8",
    "Region IX": "R9",
    "Region X": "R10",
    "Region XI": "R11",
    "Region XII": "R12",
    "Region XIII": "R13",
    "MIMAROPA": "MIMAROPA",
    "NCR": "NCR",
    "CAR": "CAR",
    "BARMM": "BARMM",
}


def region_code(region: str) -> str:
    """Return the short region code for a full region name.

    Falls back to replacing spaces with underscores if the region is not in
    the map (guards against future region additions).
    """
    return REGION_CODE_MAP.get(region, region.replace(" ", "_"))
