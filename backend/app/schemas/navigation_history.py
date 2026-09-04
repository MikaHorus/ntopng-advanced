from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NavigationHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    local_ip: str
    hostname: str | None = None
    domain: str
    remote_ip: str | None = None
    protocol: str | None = None
    application: str | None = None
    interface_id: str | None = None


class NavigationHistoryResponse(BaseModel):
    items: list[NavigationHistoryItem] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
    total_pages: int


class NavigationHistoryFilters(BaseModel):
    date_from: datetime | None = None
    date_to: datetime | None = None
    local_ip: str | None = None
    hostname: str | None = None
    domain: str | None = None
    search: str | None = None
