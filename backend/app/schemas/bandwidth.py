from datetime import datetime

from pydantic import BaseModel, Field


class BandwidthDevice(BaseModel):
    id: str
    hostname: str | None = None
    local_ip: str | None = None
    mac_address: str | None = None
    upload_bytes: int = 0
    download_bytes: int = 0
    total_bytes: int = 0
    last_seen: datetime | None = None


class BandwidthDeviceList(BaseModel):
    items: list[BandwidthDevice] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
    total_pages: int


class BandwidthConsumption(BaseModel):
    upload_bytes: int = 0
    download_bytes: int = 0
    total_bytes: int = 0


class BandwidthDeviceDetail(BaseModel):
    device: BandwidthDevice
    consumption: BandwidthConsumption


class IpBandwidthDetail(BandwidthDevice):
    pass


class BandwidthDomainList(BaseModel):
    items: list["BandwidthDomainStat"] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
    total_pages: int


class BandwidthDomainStat(BaseModel):
    domain: str
    upload_bytes: int | None = None
    download_bytes: int | None = None
    total_bytes: int | None = None
    visit_count: int
    last_activity: datetime | None = None


class BandwidthDestinationStat(BaseModel):
    destination: str | None = None
    remote_ip: str | None = None
    upload_bytes: int = 0
    download_bytes: int = 0
    total_bytes: int = 0


class BandwidthUsagePoint(BaseModel):
    timestamp: datetime
    upload_bytes: int = 0
    download_bytes: int = 0

