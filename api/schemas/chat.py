from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=500)
    region_context: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    response: str
    sources: list[str]
