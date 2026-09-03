from typing import Any

from app.clients.ntopng_client import NtopngClient
from app.schemas.ntopng import (
    InterfaceListResponse,
    InterfaceSummary,
    NtopngResponse,
    PaginatedResponse,
)


class NtopngService:
    def __init__(self, client: NtopngClient) -> None:
        self._client = client

    async def get_interfaces(self) -> InterfaceListResponse:
        _, response = await self._client.get_interfaces()
        items = [
            InterfaceSummary(interface_id=item["ifid"], name=item["ifname"])
            for item in response.get("rsp", [])
            if "ifid" in item and "ifname" in item
        ]
        return InterfaceListResponse(items=items)

    async def get_interface_data(self, interface_id: int) -> NtopngResponse:
        return await self._get_normalized(
            self._client.get_interface_data(interface_id)
        )

    async def get_active_hosts(
        self,
        interface_id: int,
        page: int,
        page_size: int,
    ) -> PaginatedResponse:
        return await self._get_paginated(
            self._client.get_active_hosts(interface_id, page, page_size),
            page,
            page_size,
        )

    async def get_active_flows(
        self,
        interface_id: int,
        page: int,
        page_size: int,
    ) -> PaginatedResponse:
        return await self._get_paginated(
            self._client.get_active_flows(interface_id, page, page_size),
            page,
            page_size,
        )

    async def _get_normalized(self, request: Any) -> NtopngResponse:
        _, response = await request
        return NtopngResponse(
            code=response.get("rc"),
            status=response.get("rc_str"),
            data=response.get("rsp"),
        )

    async def _get_paginated(
        self,
        request: Any,
        page: int,
        page_size: int,
    ) -> PaginatedResponse:
        _, response = await request
        payload = response.get("rsp") or {}
        return PaginatedResponse(
            items=payload.get("data", []),
            page=payload.get("currentPage", page),
            page_size=payload.get("perPage", page_size),
            total=payload.get("totalRows"),
        )