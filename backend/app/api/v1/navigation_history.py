from datetime import datetime
from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.ntopng_client import NtopngClient
from app.core.config import settings
from app.db import get_db
from app.schemas.navigation_history import NavigationHistoryResponse
from app.services.navigation_history_service import NavigationHistoryService

router = APIRouter(prefix="/navigation-history", tags=["navigation-history"])


def get_service(session: AsyncSession = Depends(get_db)) -> NavigationHistoryService:
    return NavigationHistoryService(session, NtopngClient(settings))


@router.get("", response_model=NavigationHistoryResponse)
async def list_navigation_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    local_ip: str | None = None,
    hostname: str | None = None,
    domain: str | None = None,
    search: str | None = None,
    service: NavigationHistoryService = Depends(get_service),
) -> NavigationHistoryResponse:
    items, total = await service.list(
        page=page,
        page_size=page_size,
        date_from=date_from,
        date_to=date_to,
        local_ip=local_ip,
        hostname=hostname,
        domain=domain,
        search=search,
    )
    return NavigationHistoryResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=ceil(total / page_size) if total else 0,
    )


@router.post("/sync")
async def sync_navigation_history(
    interface_id: int = Query(..., alias="ifid"),
    service: NavigationHistoryService = Depends(get_service),
) -> dict[str, int | str]:
    count = await service.sync(interface_id)
    return {"status": "ok", "received": count}
