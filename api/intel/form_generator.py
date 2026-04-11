"""PDS XLSX generation (hackathon path — Prompt B.6)."""

from __future__ import annotations

from typing import Any


async def generate_pds_xlsx(reg_id: int, joined_context: dict[str, Any]) -> str:
    """Generate a prefilled PDS workbook and return the absolute filesystem path.

    Not implemented until Prompt B.6; live mode should call openpyxl against
    ``api/templates/forms/csc_form_212.xlsx`` using ``joined_context``.
    """
    del reg_id, joined_context
    raise NotImplementedError("generate_pds_xlsx is implemented in Prompt B.6")
