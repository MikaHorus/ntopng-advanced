from datetime import datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import NavigationHistory


class NavigationHistoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

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
    ) -> tuple[list[NavigationHistory], int]:
        query: Select[tuple[NavigationHistory]] = select(NavigationHistory)
        count_query = select(func.count()).select_from(NavigationHistory)
        filters = []
        if date_from:
            filters.append(NavigationHistory.timestamp >= date_from)
        if date_to:
            filters.append(NavigationHistory.timestamp <= date_to)
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
        query = query.where(*filters).order_by(NavigationHistory.timestamp.desc())
        count_query = count_query.where(*filters)
        total = int((await self.session.execute(count_query)).scalar_one())
        result = await self.session.execute(
            query.offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars()), total
