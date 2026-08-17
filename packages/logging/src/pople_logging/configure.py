import logging
from pathlib import Path

from .config import LoggingConfig
from .handlers import build_handlers

_service: str = "app"


def setup_logging(service: str = "app", **overrides: object) -> logging.Logger:
    global _service
    config = LoggingConfig.from_env(service, **overrides)

    root = logging.getLogger()
    for handler in list(root.handlers):
        root.removeHandler(handler)
        handler.close()
    root.setLevel(config.level_name)
    for handler in build_handlers(config):
        root.addHandler(handler)

    _service = service
    logging.getLogger(service).info(
        "Logging initialized (service=%s, level=%s, log_dir=%s)",
        service,
        config.level_name,
        config.log_dir,
    )
    return logging.getLogger(service)


def get_logger(name: str | None = None) -> logging.Logger:
    if name is None:
        name = _service
    return logging.getLogger(name)


def get_service() -> str:
    return _service


def resolve_dir(log_dir: str | Path | None = None) -> Path:
    from .root import resolve_log_dir

    return resolve_log_dir(log_dir)


__all__ = ["get_logger", "get_service", "resolve_dir", "setup_logging"]
