from typing import Any

from pydantic import BaseModel, Field


class NtopngResponse(BaseModel):
    code: int | None = None
    status: str | None = None
    data: Any = None


class InterfaceSummary(BaseModel):
    interface_id: int
    name: str


class InterfaceListResponse(BaseModel):
    items: list[InterfaceSummary] = Field(default_factory=list)


class PaginatedResponse(BaseModel):
    items: list[Any] = Field(default_factory=list)
    page: int = 1
    page_size: int = 50
    total: int | None = None