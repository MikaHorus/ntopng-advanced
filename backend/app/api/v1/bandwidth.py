from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException, Query

from app.clients.ntopng_client import NtopngClient
from app.core.config import settings
from app.db import get_db
from app.schemas.bandwidth import (
    BandwidthDestinationStat,
    BandwidthDeviceDetail,
    BandwidthDeviceList,
    BandwidthDomainList,
    BandwidthDomainStat,
    IpBandwidthDetail,
    BandwidthUsagePoint,
)
from app.services.bandwidth_service import BandwidthService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/bandwidth", tags=["bandwidth"])


def get_service(session: AsyncSession = Depends(get_db)) -> BandwidthService:
    return BandwidthService(session, NtopngClient(settings))


@router.get("/devices", response_model=BandwidthDeviceList)
async def list_devices(
    interface_id: int = Query(0, alias="ifid"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("total"),
    sort_order: str = Query("desc"),
    service: BandwidthService = Depends(get_service),
) -> BandwidthDeviceList:
    return await service.list_devices(interface_id, page, page_size, search, sort_by, sort_order)


@router.get("/devices/{device_id}", response_model=BandwidthDeviceDetail)
async def get_device(
    device_id: str,
    interface_id: int = Query(0, alias="ifid"),
    service: BandwidthService = Depends(get_service),
) -> BandwidthDeviceDetail:
    result = await service.get_device(interface_id, device_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Appareil introuvable")
    return result


@router.get("/ip/{local_ip}", response_model=IpBandwidthDetail)
async def get_ip_detail(
    local_ip: str,
    interface_id: int = Query(0, alias="ifid"),
    service: BandwidthService = Depends(get_service),
) -> IpBandwidthDetail:
    result = await service.get_device_by_ip(interface_id, local_ip)
    if result is None:
        raise HTTPException(status_code=404, detail="Adresse IP introuvable")
    return IpBandwidthDetail(**result.device.model_dump())


@router.get("/ip/{local_ip}/domains", response_model=BandwidthDomainList)
async def get_ip_domains(
    local_ip: str,
    interface_id: int = Query(0, alias="ifid"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    time_from: time | None = Query(None),
    time_to: time | None = Query(None),
    domain: str | None = None,
    sort_by: str = Query("total"),
    sort_order: str = Query("desc"),
    service: BandwidthService = Depends(get_service),
) -> BandwidthDomainList:
    items, total = await service.domains_by_ip(
        interface_id, local_ip, page, page_size, domain, date_from, date_to,
        time_from, time_to, sort_by, sort_order,
    )
    return BandwidthDomainList(
        items=items, page=page, page_size=page_size, total=total,
        total_pages=(total + page_size - 1) // page_size if total else 0,
    )


@router.get("/devices/{device_id}/top-domains", response_model=list[BandwidthDomainStat])
async def top_domains(
    device_id: str,
    limit: int = Query(10, ge=1, le=100),
    interface_id: int = Query(0, alias="ifid"),
    service: BandwidthService = Depends(get_service),
) -> list[BandwidthDomainStat]:
    device = await service.get_device(interface_id, device_id)
    if device is None or not device.device.local_ip:
        raise HTTPException(status_code=404, detail="Appareil introuvable")
    return await service.top_domains(device.device.local_ip, limit)


@router.get("/devices/{device_id}/usage", response_model=list[BandwidthUsagePoint])
async def usage(
    device_id: str,
    interface_id: int = Query(0, alias="ifid"),
    service: BandwidthService = Depends(get_service),
) -> list[BandwidthUsagePoint]:
    result = await service.usage(device_id, interface_id)
    if not result:
        raise HTTPException(status_code=404, detail="Appareil introuvable")
    return result


@router.get("/devices/{device_id}/destinations", response_model=list[BandwidthDestinationStat])
async def destinations(
    device_id: str,
    interface_id: int = Query(0, alias="ifid"),
    limit: int = Query(10, ge=1, le=100),
    service: BandwidthService = Depends(get_service),
) -> list[BandwidthDestinationStat]:
    device = await service.get_device(interface_id, device_id)
    if device is None or not device.device.local_ip:
        raise HTTPException(status_code=404, detail="Appareil introuvable")
    return await service.destinations(interface_id, device.device.local_ip, limit)