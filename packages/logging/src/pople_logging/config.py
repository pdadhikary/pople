import os
from dataclasses import dataclass
from pathlib import Path

from .root import resolve_log_dir

DEFAULT_MAX_BYTES = 10 * 1024 * 1024
DEFAULT_BACKUP_COUNT = 5

_TRUE = {"1", "true", "yes", "on"}


def _as_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in _TRUE


def _as_int(value: object, default: int) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int | float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(value)
        except ValueError:
            return default
    return default


@dataclass(frozen=True)
class LoggingConfig:
    service: str
    log_dir: Path
    level: str
    console: bool
    text: bool
    json: bool
    max_bytes: int
    backup_count: int

    @property
    def level_name(self) -> str:
        return self.level.upper()

    @classmethod
    def from_env(cls, service: str, **overrides: object) -> "LoggingConfig":
        level = str(overrides.get("level", os.environ.get("POPLE_LOG_LEVEL", "INFO"))).upper()
        log_dir_raw = overrides.get("log_dir", os.environ.get("POPLE_LOG_DIR"))
        log_dir = resolve_log_dir(str(log_dir_raw) if log_dir_raw is not None else None)
        console = _as_bool(overrides.get("console", os.environ.get("POPLE_LOG_CONSOLE", "1")))
        text = _as_bool(overrides.get("text", os.environ.get("POPLE_LOG_TEXT", "1")))
        json_enabled = _as_bool(overrides.get("json", os.environ.get("POPLE_LOG_JSON", "1")))
        max_bytes = _as_int(
            overrides.get("max_bytes", os.environ.get("POPLE_LOG_MAX_BYTES", DEFAULT_MAX_BYTES)),
            DEFAULT_MAX_BYTES,
        )
        backup_count = _as_int(
            overrides.get(
                "backup_count", os.environ.get("POPLE_LOG_BACKUP_COUNT", DEFAULT_BACKUP_COUNT)
            ),
            DEFAULT_BACKUP_COUNT,
        )
        return cls(
            service=service,
            log_dir=log_dir,
            level=level,
            console=console,
            text=text,
            json=json_enabled,
            max_bytes=max_bytes,
            backup_count=backup_count,
        )


__all__ = ["DEFAULT_BACKUP_COUNT", "DEFAULT_MAX_BYTES", "LoggingConfig"]
