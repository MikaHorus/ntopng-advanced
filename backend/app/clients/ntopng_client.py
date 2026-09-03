from typing import Any

import httpx

from app.core.config import Settings


class NtopngClientError(Exception):
    """Raised when communication with ntopng cannot be completed."""


class NtopngClient:
    def __init__(self, config: Settings) -> None:
        if not config.ntopng_base_url:
            raise NtopngClientError("NTOPNG_BASE_URL is not configured")
        self._config = config

    async def get_endpoint(
        self,
        path: str,
        params: dict[str, Any] | None = None,
    ) -> tuple[int, Any]:
        return await self._request(path, method="GET", params=params)

    async def post_endpoint(
        self,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> tuple[int, Any]:
        return await self._request(path, method="POST", json=payload or {})

    async def get_interfaces(self) -> tuple[int, Any]:
        return await self.get_endpoint("/lua/rest/v2/get/ntopng/interfaces.lua")

    async def get_interface_data(self, interface_id: int) -> tuple[int, Any]:
        return await self.get_endpoint(
            "/lua/rest/v2/get/interface/data.lua",
            params={"ifid": interface_id},
        )

    async def get_active_hosts(
        self,
        interface_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[int, Any]:
        return await self.get_endpoint(
            "/lua/rest/v2/get/host/active.lua",
            params={
                "ifid": interface_id,
                "currentPage": page,
                "perPage": page_size,
            },
        )

    async def get_active_flows(
        self,
        interface_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[int, Any]:
        return await self.get_endpoint(
            "/lua/rest/v2/get/flow/active.lua",
            params={
                "ifid": interface_id,
                "currentPage": page,
                "perPage": page_size,
            },
        )

    async def _request(
        self,
        path: str,
        method: str,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
    ) -> tuple[int, Any]:
        auth = None
        if self._config.ntopng_username:
            auth = (
                self._config.ntopng_username,
                self._config.ntopng_password,
            )

        headers = {}
        if self._config.ntopng_api_key:
            headers["Authorization"] = f"Token {self._config.ntopng_api_key}"

        try:
            async with httpx.AsyncClient(
                verify=self._config.ntopng_verify_ssl,
                timeout=10.0,
                follow_redirects=True,
            ) as client:
                response = await client.request(
                    method,
                    f"{self._config.ntopng_base_url.rstrip('/')}/{path.lstrip('/')}",
                    auth=auth,
                    headers=headers,
                    params=params,
                    json=json,
                )
        except httpx.TimeoutException as exc:
            raise NtopngClientError("NTOPNG_TIMEOUT") from exc
        except httpx.HTTPError as exc:
            raise NtopngClientError("NTOPNG_CONNECTION_ERROR") from exc

        try:
            payload = response.json()
        except ValueError:
            payload = {"content_type": response.headers.get("content-type", "")}

        return response.status_code, payload