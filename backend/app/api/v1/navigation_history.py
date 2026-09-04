import csv
from datetime import date, datetime, time
from math import ceil
from collections.abc import AsyncIterator
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
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
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    time_from: time | None = Query(None),
    time_to: time | None = Query(None),
    local_ip: str | None = None,
    hostname: str | None = None,
    domain: str | None = None,
    search: str | None = None,
    service: NavigationHistoryService = Depends(get_service),
) -> NavigationHistoryResponse:
    items, total = await service.list(
        page=page,
        page_size=page_size,
        date_from=datetime.combine(date_from, datetime.min.time()) if date_from else None,
        date_to=datetime.combine(date_to, datetime.max.time()) if date_to else None,
        local_ip=local_ip,
        hostname=hostname,
        domain=domain,
        search=search,
        time_from=time_from,
        time_to=time_to,
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


def export_filters(
    date_from: date | None,
    date_to: date | None,
    time_from: time | None,
    time_to: time | None,
    local_ip: str | None,
    domain: str | None,
    search: str | None,
) -> dict[str, object]:
    return {
        "date_from": datetime.combine(date_from, datetime.min.time()) if date_from else None,
        "date_to": datetime.combine(date_to, datetime.max.time()) if date_to else None,
        "time_from": time_from,
        "time_to": time_to,
        "local_ip": local_ip,
        "domain": domain,
        "search": search,
    }


async def ensure_export_size(service: NavigationHistoryService, filters: dict[str, object]) -> None:
    if await service.export_count(**filters) > 100_000:
        raise HTTPException(status_code=413, detail="L’export dépasse la limite de 100 000 lignes.")


@router.get("/export/csv")
async def export_navigation_history_csv(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    time_from: time | None = Query(None),
    time_to: time | None = Query(None),
    local_ip: str | None = None,
    domain: str | None = None,
    search: str | None = None,
    service: NavigationHistoryService = Depends(get_service),
) -> StreamingResponse:
    filters = export_filters(date_from, date_to, time_from, time_to, local_ip, domain, search)
    await ensure_export_size(service, filters)

    async def rows() -> AsyncIterator[str]:
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["Date", "Heure", "Adresse IP locale", "Nom d’hôte", "Domaine", "Adresse IP distante", "Protocole", "Application"])
        yield "\ufeff" + buffer.getvalue()
        async for record in service.export_rows(**filters):
            buffer.seek(0)
            buffer.truncate(0)
            writer.writerow(service.csv_row(record))
            yield buffer.getvalue()

    return StreamingResponse(
        rows(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=historique_navigation.csv"},
    )


@router.get("/export/xlsx")
async def export_navigation_history_xlsx(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    time_from: time | None = Query(None),
    time_to: time | None = Query(None),
    local_ip: str | None = None,
    domain: str | None = None,
    search: str | None = None,
    service: NavigationHistoryService = Depends(get_service),
) -> Response:
    filters = export_filters(date_from, date_to, time_from, time_to, local_ip, domain, search)
    await ensure_export_size(service, filters)
    content = await service.export_xlsx(**filters)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=historique_navigation.xlsx"},
    )
