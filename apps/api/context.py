from fastapi import WebSocket
from pople_logging import get_logger

logger = get_logger("api.websocket")


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, job_id: int, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(job_id, []).append(ws)
        logger.info(
            "WebSocket connected (job=%s, clients=%d)", job_id, len(self.active[job_id])
        )

    def disconnect(self, job_id: int, ws: WebSocket):
        connections = self.active.get(job_id, [])
        if ws in connections:
            connections.remove(ws)
        if not connections and job_id in self.active:
            del self.active[job_id]
        logger.info(
            "WebSocket disconnected (job=%s, clients=%d)",
            job_id,
            len(self.active.get(job_id, [])),
        )

    async def broadcast(self, job_id: int, message: dict):
        dead: list[WebSocket] = []
        for ws in self.active.get(job_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        if dead:
            logger.warning(
                "WebSocket send failed for %d client(s) (job=%s)", len(dead), job_id
            )
        for ws in dead:
            self.disconnect(job_id, ws)
        logger.debug(
            "WebSocket broadcast (job=%s, clients=%d)",
            job_id,
            len(self.active.get(job_id, [])),
        )


def get_manager() -> ConnectionManager:
    return _manager


_manager = ConnectionManager()

__all__ = ["get_manager"]
