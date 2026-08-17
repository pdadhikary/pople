from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )
    job_timeout_seconds: float
    log_level: str = "INFO"


settings = WorkerSettings()

__all__ = ["settings"]
