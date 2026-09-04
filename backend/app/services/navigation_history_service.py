import hashlib
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.ntopng_client import NtopngClient
from app.models import NavigationHistory, SyncState
from app.repositories.navigation_history import NavigationHistoryRepository


class NavigationHistoryService:
    def __init__(self, session: AsyncSession, client: NtopngClient) -> None:
        self.session = session
        self.client = client

    async def list(self, **filters: Any) -> tuple[list[NavigationHistory], int]:
        return await NavigationHistoryRepository(self.session).list(**filters)

    async def sync(self, interface_id: int, page_size: int = 500) -> int:
        _, response = await self.client.get_active_flows(interface_id, 1, page_size)
        payload = response.get("rsp") or {}
        records = [self._record_from_flow(flow, interface_id) for flow in payload.get("data", [])]
        records = [record for record in records if record is not None]
        if records:
            statement = insert(NavigationHistory).values(records)
            statement = statement.on_conflict_do_nothing(index_elements=["event_key"])
            await self.session.execute(statement)
        now = datetime.now(timezone.utc)
        state = (await self.session.execute(
            select(SyncState).where(SyncState.source == "ntopng")
        )).scalar_one_or_none()
        if state is None:
            self.session.add(SyncState(source="ntopng", last_sync_timestamp=now))
        else:
            state.last_sync_timestamp = now
        await self.session.commit()
        return len(records)

    @staticmethod
    def _record_from_flow(flow: dict[str, Any], interface_id: int) -> dict[str, Any] | None:
        client = flow.get("cli") or flow.get("client") or {}
        server = flow.get("srv") or flow.get("server") or {}
        domain = flow.get("domain") or server.get("name") or server.get("hostname")
        local_ip = client.get("ip") or flow.get("local_ip")
        if not domain or not local_ip:
            return None
        raw_timestamp = flow.get("seen_first") or flow.get("timestamp") or flow.get("first_seen")
        timestamp = NavigationHistoryService._timestamp(raw_timestamp)
        remote_ip = server.get("ip") or flow.get("remote_ip")
        hostname = client.get("name") or client.get("hostname") or flow.get("hostname")
        protocol = flow.get("protocol")
        if isinstance(protocol, dict):
            protocol = protocol.get("l7") or protocol.get("name")
        application = flow.get("application")
        if isinstance(application, dict):
            application = application.get("name")
        key_data = "|".join(str(value or "") for value in (
            timestamp.isoformat(), local_ip, domain, remote_ip, interface_id
        ))
        return {
            "timestamp": timestamp,
            "local_ip": str(local_ip),
            "hostname": str(hostname) if hostname else None,
            "domain": str(domain),
            "remote_ip": str(remote_ip) if remote_ip else None,
            "protocol": str(protocol) if protocol else None,
            "application": str(application) if application else None,
            "interface_id": str(interface_id),
            "event_key": hashlib.sha256(key_data.encode()).hexdigest(),
        }

    @staticmethod
    def _timestamp(value: Any) -> datetime:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, timezone.utc)
        if isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        return datetime.now(timezone.utc)
