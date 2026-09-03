import asyncio
import json
from typing import Any

from app.clients.ntopng_client import NtopngClient, NtopngClientError
from app.core.config import settings


async def discover() -> None:
    client = NtopngClient(settings)
    status, response = await client.get_interfaces()
    interfaces = response.get("rsp", []) if isinstance(response, dict) else []

    summary: dict[str, Any] = {
        "interfaces": {
            "http_status": status,
            "api_code": response.get("rc") if isinstance(response, dict) else None,
            "api_status": response.get("rc_str") if isinstance(response, dict) else None,
            "items": interfaces,
        },
        "checks": [],
    }

    for interface in interfaces:
        interface_id = interface.get("ifid")
        if interface_id is None:
            continue

        for name, request in (
            ("interface_data", client.get_interface_data(interface_id)),
            ("active_hosts", client.get_active_hosts(interface_id, 1, 1)),
            ("active_flows", client.get_active_flows(interface_id, 1, 1)),
        ):
            endpoint_status, endpoint_response = await request
            payload = endpoint_response.get("rsp") or {}
            summary["checks"].append(
                {
                    "name": name,
                    "ifid": interface_id,
                    "http_status": endpoint_status,
                    "api_code": endpoint_response.get("rc"),
                    "api_status": endpoint_response.get("rc_str"),
                    "item_count": len(payload.get("data", []))
                    if isinstance(payload, dict)
                    else None,
                    "total_rows": payload.get("totalRows")
                    if isinstance(payload, dict)
                    else None,
                }
            )

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    try:
        asyncio.run(discover())
    except NtopngClientError as error:
        raise SystemExit(str(error)) from error