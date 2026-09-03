from fastapi import APIRouter, Depends, Query

from app.clients.ntopng_client import NtopngClient
from app.core.config import settings
from app.schemas.ntopng import (
    InterfaceListResponse,
    NtopngResponse,
    PaginatedResponse,
)
from app.services.ntopng_service import NtopngService

router = APIRouter(prefix="/ntopng", tags=["ntopng"])


def get_service() -> NtopngService:
    return NtopngService(NtopngClient(settings))


@router.get("/interfaces", response_model=InterfaceListResponse)
async def get_interfaces(
    service: NtopngService = Depends(get_service),
) -> InterfaceListResponse:
    return await service.get_interfaces()


@router.get("/interfaces/{interface_id}", response_model=NtopngResponse)
async def get_interface_data(
    interface_id: int,
    service: NtopngService = Depends(get_service),
) -> NtopngResponse:
    return await service.get_interface_data(interface_id)


@router.get("/hosts", response_model=PaginatedResponse)
async def get_hosts(
    interface_id: int = Query(..., alias="ifid"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    service: NtopngService = Depends(get_service),
) -> PaginatedResponse:
    return await service.get_active_hosts(interface_id, page, page_size)


@router.get("/flows", response_model=PaginatedResponse)
async def get_flows(
    interface_id: int = Query(..., alias="ifid"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    service: NtopngService = Depends(get_service),
) -> PaginatedResponse:
    return await service.get_active_flows(interface_id, page, page_size)