from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ReportType = Literal["quarterly_performance", "intervention_priority", "executive_summary"]


class ReportGenerateRequest(BaseModel):
    region: str
    report_type: ReportType


class ReportGenerateResponse(BaseModel):
    markdown: str
    filename: str
    generated_at: datetime
