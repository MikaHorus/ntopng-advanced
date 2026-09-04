from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from app.api.v1.navigation_history import router as navigation_history_router
from app.api.v1.ntopng import router as ntopng_router
from app.api.v1.bandwidth import router as bandwidth_router
from app.core.config import settings
from app.db import SessionLocal
from app.services.navigation_history_service import NavigationHistoryService
from app.clients.ntopng_client import NtopngClient

app = FastAPI(title=settings.app_name, version="0.1.0")
app.include_router(ntopng_router, prefix=settings.api_v1_prefix)
app.include_router(bandwidth_router, prefix=settings.api_v1_prefix)
app.include_router(navigation_history_router, prefix=settings.api_v1_prefix)
scheduler = AsyncIOScheduler()


async def scheduled_sync() -> None:
    if not settings.ntopng_interface_id:
        return
    async with SessionLocal() as session:
        service = NavigationHistoryService(session, NtopngClient(settings))
        await service.sync(int(settings.ntopng_interface_id))


@app.on_event("startup")
async def start_scheduler() -> None:
    scheduler.add_job(scheduled_sync, "interval", seconds=settings.sync_interval_seconds)
    scheduler.start()


@app.on_event("shutdown")
async def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}