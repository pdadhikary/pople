from pydantic_settings import BaseSettings, SettingsConfigDict


class APISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )
    jobs_dir: str
    max_upload_bytes: int
    cors_origins: str = "*"
    log_level: str = "INFO"


settings = APISettings()

__all__ = ["settings"]
