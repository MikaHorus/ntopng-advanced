from datetime import datetime, time

from sqlalchemy import Select, Time, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import NavigationHistory


class NavigationHistoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def build_filters(
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        local_ip: str | None = None,
        hostname: str | None = None,
        domain: str | None = None,
        search: str | None = None,
        time_from: time | None = None,
        time_to: time | None = None,
    ) -> list:
        filters = []
        if date_from:
            filters.append(NavigationHistory.timestamp >= date_from)
        if date_to:
            filters.append(NavigationHistory.timestamp <= date_to)
        if time_from:
            filters.append(cast(NavigationHistory.timestamp, Time) >= cast(time_from, Time))
        if time_to:
            filters.append(cast(NavigationHistory.timestamp, Time) <= cast(time_to, Time))
        if local_ip:
            filters.append(NavigationHistory.local_ip == local_ip)
        if hostname:
            filters.append(NavigationHistory.hostname.ilike(f"%{hostname}%"))
        if domain:
            filters.append(NavigationHistory.domain.ilike(f"%{domain}%"))
        if search:
            term = f"%{search}%"
            filters.append(or_(
                NavigationHistory.local_ip.ilike(term),
                NavigationHistory.hostname.ilike(term),
                NavigationHistory.domain.ilike(term),
            ))
        return filters

    def filtered_query(self, **filters: object) -> Select[tuple[NavigationHistory]]:
        return select(NavigationHistory).where(
            *self.build_filters(**filters)
        ).order_by(NavigationHistory.timestamp.desc())

    async def list(
        self,
        page: int,
        page_size: int,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        local_ip: str | None = None,
        hostname: str | None = None,
        domain: str | None = None,
        search: str | None = None,
        time_from: str | None = None,
        time_to: str | None = None,
    ) -> tuple[list[NavigationHistory], int]:
        query: Select[tuple[NavigationHistory]] = select(NavigationHistory)
        count_query = select(func.count()).select_from(NavigationHistory)
        filters = self.build_filters(
            date_from=date_from, date_to=date_to, local_ip=local_ip,
            hostname=hostname, domain=domain, search=search,
            time_from=time_from, time_to=time_to,
        )
        query = query.where(*filters).order_by(NavigationHistory.timestamp.desc())
        count_query = count_query.where(*filters)
        total = int((await self.session.execute(count_query)).scalar_one())
        result = await self.session.execute(
            query.offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars()), total
