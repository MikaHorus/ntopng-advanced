from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ntopng-history-viewer"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    ntopng_base_url: str = ""
    ntopng_username: str = ""
    ntopng_password: str = ""
    ntopng_api_key: str = ""
    ntopng_verify_ssl: bool = False
    ntopng_interface_id: str = ""
    database_url: str = "postgresql+asyncpg://ntopng:ntopng@postgres:5432/ntopng"
    sync_interval_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        extra="ignore",
    )


settings = Settings()