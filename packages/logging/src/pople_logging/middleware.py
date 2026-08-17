import logging
import time
import uuid
from typing import Any

from .context import request_id_var


class RequestLoggingMiddleware:
    """Pure ASGI middleware that logs each HTTP request with a request id.

    The request id is stored in a ContextVar so every log line emitted during
    request handling carries it via the package's formatters.
    """

    def __init__(self, app: Any, service: str = "api") -> None:
        self.app = app
        self.logger = logging.getLogger(service)

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        request_id = uuid.uuid4().hex
        token = request_id_var.set(request_id)
        method = scope.get("method", "-")
        path = scope.get("path", "-")
        started = time.perf_counter()
        status: dict[str, int] = {"code": 0}

        async def send_wrapper(message: dict[str, Any]) -> None:
            if message.get("type") == "http.response.start":
                status["code"] = message.get("status", 0)
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            latency_ms = (time.perf_counter() - started) * 1000.0
            self.logger.info(
                "%s %s %s %.0fms rid=%s",
                method,
                path,
                status["code"],
                latency_ms,
                request_id,
            )
            request_id_var.reset(token)


__all__ = ["RequestLoggingMiddleware"]
