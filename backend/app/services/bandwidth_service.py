from datetime import date, datetime, time, timezone
from ipaddress import ip_address
from typing import Any

from sqlalchemy import Time, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.ntopng_client import NtopngClient
from app.models import NavigationHistory
from app.schemas.bandwidth import (
    BandwidthConsumption,
    BandwidthDestinationStat,
    BandwidthDevice,
    BandwidthDeviceDetail,
    BandwidthDeviceList,
    BandwidthDomainStat,
    BandwidthUsagePoint,
)


class BandwidthService:
    def __init__(self, session: AsyncSession, client: NtopngClient) -> None:
        self.session = session
        self.client = client

    async def list_devices(
        self,
        interface_id: int,
        page: int,
        page_size: int,
        search: str | None = None,
        sort_by: str = "total",
        sort_order: str = "desc",
    ) -> BandwidthDeviceList:
        _, flows_response = await self.client.get_active_flows(interface_id, 1, 500)
        devices_by_ip: dict[str, BandwidthDevice] = {}
        for flow in (flows_response.get("rsp") or {}).get("data", []):
            client = flow.get("client") or flow.get("cli") or {}
            local_ip = client.get("ip")
            if not self._is_private_ip(local_ip):
                continue
            total = int(flow.get("bytes") or 0)
            breakdown = flow.get("breakdown") or {}
            upload = int(total * float(breakdown.get("cli2srv", 0)) / 100)
            device = devices_by_ip.setdefault(local_ip, BandwidthDevice(
                id=str(client.get("key") or local_ip).replace(".", "__"),
                hostname=client.get("name"),
                local_ip=local_ip,
                upload_bytes=0,
                download_bytes=0,
                total_bytes=0,
                last_seen=None,
            ))
            device.upload_bytes += upload
            device.download_bytes += total - upload
            device.total_bytes += total
            last_seen = flow.get("last_seen")
            if isinstance(last_seen, (int, float)):
                timestamp = datetime.fromtimestamp(last_seen, timezone.utc)
                if device.last_seen is None or timestamp > device.last_seen:
                    device.last_seen = timestamp
        devices = list(devices_by_ip.values())
        if search:
            term = search.casefold()
            devices = [
                device for device in devices
                if term in (device.hostname or "").casefold()
                or term in (device.local_ip or "").casefold()
                or term in (device.mac_address or "").casefold()
            ]
        key = {
            "total": lambda item: item.total_bytes,
            "download": lambda item: item.download_bytes,
            "upload": lambda item: item.upload_bytes,
            "hostname": lambda item: item.hostname or "",
            "ip": lambda item: item.local_ip or "",
        }.get(sort_by, lambda item: item.total_bytes)
        devices.sort(key=key, reverse=sort_order.lower() != "asc")
        total = len(devices)
        start = (page - 1) * page_size
        return BandwidthDeviceList(
            items=devices[start:start + page_size],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=(total + page_size - 1) // page_size if total else 0,
        )

    async def get_device(self, interface_id: int, device_id: str) -> BandwidthDeviceDetail | None:
        devices = await self.list_devices(interface_id, 1, 500)
        device = next((item for item in devices.items if item.id == device_id), None)
        if device is None:
            return None
        return BandwidthDeviceDetail(
            device=device,
            consumption=BandwidthConsumption(
                upload_bytes=device.upload_bytes,
                download_bytes=device.download_bytes,
                total_bytes=device.total_bytes,
            ),
        )

    async def get_device_by_ip(self, interface_id: int, local_ip: str) -> BandwidthDeviceDetail | None:
        devices = await self.list_devices(interface_id, 1, 100, search=local_ip)
        device = next((item for item in devices.items if item.local_ip == local_ip), None)
        if device is None:
            return None
        return BandwidthDeviceDetail(
            device=device,
            consumption=BandwidthConsumption(
                upload_bytes=device.upload_bytes,
                download_bytes=device.download_bytes,
                total_bytes=device.total_bytes,
            ),
        )

    async def domains_by_ip(
        self,
        interface_id: int,
        local_ip: str,
        page: int,
        page_size: int,
        domain: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        time_from: time | None = None,
        time_to: time | None = None,
        sort_by: str = "total",
        sort_order: str = "desc",
    ) -> tuple[list[BandwidthDomainStat], int]:
        filters = [NavigationHistory.local_ip == local_ip]
        if domain:
            filters.append(NavigationHistory.domain.ilike(f"%{domain}%"))
        if date_from:
            filters.append(NavigationHistory.timestamp >= datetime.combine(date_from, time.min, tzinfo=timezone.utc))
        if date_to:
            filters.append(NavigationHistory.timestamp <= datetime.combine(date_to, time.max, tzinfo=timezone.utc))
        if time_from:
            filters.append(cast(NavigationHistory.timestamp, Time) >= time_from)
        if time_to:
            filters.append(cast(NavigationHistory.timestamp, Time) <= time_to)
        result = await self.session.execute(
            select(
                NavigationHistory.domain,
                func.count(NavigationHistory.id).label("visits"),
                func.max(NavigationHistory.timestamp).label("last_activity"),
            )
            .where(*filters)
            .group_by(NavigationHistory.domain)
        )
        stats = {row.domain: BandwidthDomainStat(domain=row.domain, visit_count=row.visits, last_activity=row.last_activity) for row in result.all()}
        _, response = await self.client.get_active_flows(interface_id, 1, 500)
        for flow in (response.get("rsp") or {}).get("data", []):
            client = flow.get("client") or flow.get("cli") or {}
            server = flow.get("server") or flow.get("srv") or {}
            if client.get("ip") != local_ip:
                continue
            flow_domain = flow.get("domain") or server.get("name")
            if not flow_domain or flow_domain not in stats:
                continue
            total = int(flow.get("bytes") or 0)
            breakdown = flow.get("breakdown") or {}
            upload = int(total * float(breakdown.get("cli2srv", 0)) / 100)
            stats[flow_domain].upload_bytes = (stats[flow_domain].upload_bytes or 0) + upload
            stats[flow_domain].download_bytes = (stats[flow_domain].download_bytes or 0) + total - upload
            stats[flow_domain].total_bytes = (stats[flow_domain].total_bytes or 0) + total
        key = {
            "upload": lambda item: item.upload_bytes or -1,
            "download": lambda item: item.download_bytes or -1,
            "visits": lambda item: item.visit_count,
            "last_activity": lambda item: item.last_activity or datetime.min.replace(tzinfo=timezone.utc),
            "total": lambda item: item.total_bytes if item.total_bytes is not None else -1,
        }.get(sort_by, lambda item: item.total_bytes if item.total_bytes is not None else -1)
        stats_list = list(stats.values())
        stats_list.sort(key=key, reverse=sort_order.lower() != "asc")
        total = len(stats_list)
        start = (page - 1) * page_size
        return stats_list[start:start + page_size], total

    async def top_domains(self, local_ip: str, limit: int) -> list[BandwidthDomainStat]:
        stats, _ = await self.domains_by_ip(0, local_ip, 1, limit, sort_by="visits")
        return stats[:limit]

    async def usage(self, device_id: str, interface_id: int) -> list[BandwidthUsagePoint]:
        detail = await self.get_device(interface_id, device_id)
        if detail is None:
            return []
        return [BandwidthUsagePoint(
            timestamp=detail.device.last_seen or datetime.now(timezone.utc),
            upload_bytes=detail.consumption.upload_bytes,
            download_bytes=detail.consumption.download_bytes,
        )]

    async def destinations(self, interface_id: int, local_ip: str, limit: int) -> list[BandwidthDestinationStat]:
        _, response = await self.client.get_active_flows(interface_id, 1, 500)
        payload = response.get("rsp") or {}
        destinations: list[BandwidthDestinationStat] = []
        for flow in payload.get("data", []):
            client = flow.get("client") or flow.get("cli") or {}
            if client.get("ip") != local_ip:
                continue
            server = flow.get("server") or flow.get("srv") or {}
            total = int(flow.get("bytes") or 0)
            breakdown = flow.get("breakdown") or {}
            upload = int(total * float(breakdown.get("cli2srv", 0)) / 100)
            download = total - upload
            destinations.append(BandwidthDestinationStat(
                destination=server.get("name"),
                remote_ip=server.get("ip"),
                upload_bytes=upload,
                download_bytes=download,
                total_bytes=total,
            ))
        destinations.sort(key=lambda item: item.total_bytes, reverse=True)
        return destinations[:limit]

    @staticmethod
    def _is_private_ip(value: Any) -> bool:
        try:
            return ip_address(str(value)).is_private
        except ValueError:
            return False

    @staticmethod
    def _device(item: dict[str, Any]) -> BandwidthDevice:
        bytes_data = item.get("bytes") or {}
        last_seen = item.get("last_seen")
        timestamp = datetime.fromtimestamp(last_seen, timezone.utc) if isinstance(last_seen, (int, float)) else None
        return BandwidthDevice(
            id=str(item.get("key") or item.get("ip") or "unknown"),
            hostname=item.get("name"),
            local_ip=item.get("ip"),
            mac_address=item.get("mac") or item.get("mac_address"),
            upload_bytes=int(bytes_data.get("sent") or 0),
            download_bytes=int(bytes_data.get("recvd") or 0),
            total_bytes=int(bytes_data.get("total") or 0),
            last_seen=timestamp,
        )