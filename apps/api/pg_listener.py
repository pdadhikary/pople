import asyncio
import json

import psycopg
from database.models import (
    GeometryStep,
    Job,
    JobMetric,
)
from pople_logging import get_logger
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from context import get_manager
from schemas import (
    JobStatusChangeMessage,
    MessageType,
    NewGeometryMessage,
    NewMetricMessage,
    WsMessage,
)

logger = get_logger("api.pg_listener")

CHANNELS = ("job_metrics", "job_geometry", "job_control")


class PGListener:
    def __init__(self, dsn: str, session_factory: async_sessionmaker[AsyncSession]):
        self.dsn = dsn
        self.session_factory = session_factory
        self._task: asyncio.Task | None = None
        self._conn: psycopg.AsyncConnection | None = None

    async def start(self):
        self._task = asyncio.create_task(self._run(), name="pg-listener")

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._conn:
            await self._conn.close()

    async def _run(self):
        while True:
            try:
                await self._listen()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("PG listener connection dropped, retrying in 3s")
                await asyncio.sleep(3)

    async def _listen(self):
        self._conn = await psycopg.AsyncConnection.connect(self.dsn, autocommit=True)
        async with self._conn.cursor() as cur:
            for channel in CHANNELS:
                await cur.execute(f"LISTEN {channel}")
        logger.info("Listening on channels: %s", CHANNELS)

        async for notify in self._conn.notifies():
            try:
                payload = json.loads(notify.payload)
            except json.JSONDecodeError:
                logger.warning(
                    "Bad notify payload on %s: %s", notify.channel, notify.payload
                )
                continue

            message = await self._build_message(notify.channel, payload)
            if message is None:
                continue

            await get_manager().broadcast(message.job_id, message.model_dump(mode="json"))

    async def _build_message(self, channel: str, payload: dict) -> WsMessage | None:
        job_id: int | None = payload.get("job_id")
        if job_id is None:
            return None

        if channel == "job_control":
            async with self.session_factory() as session:
                job = await session.get(Job, payload["job_id"])
                if job is None or job.id is None:
                    logger.warning("Job id=%s not found", payload["job_id"])
                    return None
                return JobStatusChangeMessage(
                    type=MessageType.JOB_STATUS_CHANGED,
                    job_id=job_id,
                    job_name=job.name,
                    job_status=job.status,
                    queued_dt=job.queued_dt,
                    started_dt=job.started_dt,
                    finished_dt=job.finished_dt,
                )

        if channel == "job_geometry":
            async with self.session_factory() as session:
                job = await session.get(Job, payload["job_id"])
                geometry_step = await session.get(GeometryStep, payload["id"])

                if job is None or job.id is None or geometry_step is None:
                    logger.warning(
                        "GeometryStep id=%s not found (job=%s)", payload["id"], job_id
                    )
                    return None
            return NewGeometryMessage(
                type=MessageType.NEW_GEOMETRY,
                job_id=job.id,
                atoms=geometry_step.atoms,
                recorded_dt=geometry_step.recorded_dt,
            )

        if channel == "job_metrics":
            async with self.session_factory() as session:
                job = await session.get(Job, payload["job_id"])
                metric = await session.get(JobMetric, payload["id"])
                if job is None or job.id is None or metric is None:
                    logger.warning(
                        "JobMetric id=%s not found (job=%s)", payload["id"], job_id
                    )
                    return None
                return NewMetricMessage(
                    type=MessageType.NEW_METRIC,
                    job_id=job_id,
                    metric_type=metric.metric_type,
                    value=metric.value,
                    threshold=metric.threshold,
                    recorded_dt=metric.recorded_dt,
                )

        logger.warning("Unknown channel: %s", channel)
        return None
