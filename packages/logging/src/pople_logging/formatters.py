import json
import logging
from datetime import UTC, datetime

from .context import get_request_id

TEXT_FORMAT = "%(asctime)s.%(msecs)03d %(levelname)-8s %(name)s [%(req_id)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def _req_id(record: logging.LogRecord) -> str:
    return getattr(record, "req_id", None) or get_request_id()


class TextFormatter(logging.Formatter):
    def __init__(self) -> None:
        super().__init__(fmt=TEXT_FORMAT, datefmt=DATE_FORMAT)

    def format(self, record: logging.LogRecord) -> str:
        record.req_id = _req_id(record)
        return super().format(record)


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "service": getattr(record, "service", "-"),
            "req_id": _req_id(record),
            "pid": record.process,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str, ensure_ascii=False)


__all__ = ["JsonFormatter", "TextFormatter"]
