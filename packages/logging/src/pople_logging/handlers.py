import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from .config import LoggingConfig
from .context import get_request_id
from .formatters import JsonFormatter, TextFormatter


class _ServiceFilter(logging.Filter):
    def __init__(self, service: str) -> None:
        super().__init__()
        self.service = service

    def filter(self, record: logging.LogRecord) -> bool:
        record.service = self.service
        record.req_id = get_request_id()
        return True


def _rotating(
    path: Path,
    config: LoggingConfig,
    formatter: logging.Formatter,
    service: str,
) -> RotatingFileHandler:
    handler = RotatingFileHandler(
        path,
        maxBytes=config.max_bytes,
        backupCount=config.backup_count,
        encoding="utf-8",
    )
    handler.setFormatter(formatter)
    handler.addFilter(_ServiceFilter(service))
    return handler


def build_handlers(config: LoggingConfig) -> list[logging.Handler]:
    handlers: list[logging.Handler] = []
    text_fmt = TextFormatter()
    json_fmt = JsonFormatter()

    if config.text:
        handlers.append(
            _rotating(config.log_dir / f"{config.service}.log", config, text_fmt, config.service)
        )
    if config.json:
        handlers.append(
            _rotating(config.log_dir / f"{config.service}.jsonl", config, json_fmt, config.service)
        )
    if config.console:
        console = logging.StreamHandler()
        console.setFormatter(text_fmt)
        console.addFilter(_ServiceFilter(config.service))
        handlers.append(console)

    return handlers


__all__ = ["build_handlers"]
