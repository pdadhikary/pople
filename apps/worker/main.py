import os
import queue
import signal
import subprocess
import threading
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import cast

from database.models import Atom, GeometryStep, Job, JobMetric, JobStatus, MetricType
from database.session import get_session
from orca.models import AtomCoordinate, GeometryConvergence, TotalEnergy
from orca.parser import OrcaParser
from pople_logging import get_logger, setup_logging
from sqlalchemy import ColumnElement
from sqlmodel import select

from settings import settings

logger = get_logger("worker")

ORCA_PATH = "/opt/orca/orca"

def get_next_job() -> Job | None:
    with get_session() as db:
        q = (
            select(Job)
            .where(Job.status == JobStatus.QUEUED)
            .order_by(cast(ColumnElement, Job.queued_dt))
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        job = db.exec(q).first()

        if job:
            logger.info("Claimed job %s (id=%s)", job.name, job.id)

        return job


def stream_orca_job(job: Job, timeout_seconds: float):
    job_dir = Path(job.job_dir_path)
    input_path = Path(job.job_input_path).resolve()

    process = subprocess.Popen(
        [ORCA_PATH, str(input_path)],
        cwd=job_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        text=True,
        bufsize=1,
        start_new_session=True,
    )

    stdout = process.stdout
    if stdout is None:
        raise OSError("Process could not be started")

    logger.info(
        "ORCA spawned for job %s (pid=%s, timeout=%.0fs)",
        job.name,
        process.pid,
        timeout_seconds,
    )

    deadline = time.monotonic() + timeout_seconds
    line_queue: queue.Queue[str | None] = queue.Queue()

    def read_stdout():
        for line in stdout:
            line_queue.put(line.rstrip("\n"))
        line_queue.put(None)

    reader = threading.Thread(target=read_stdout, daemon=True)
    reader.start()

    try:
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError(
                    f"ORCA exceeded {timeout_seconds:.0f}s timeout for job {job.name}"
                )
            try:
                line = line_queue.get(timeout=remaining)
            except queue.Empty:
                continue
            if line is None:
                break
            yield line
        stdout.close()
        returncode = process.wait(timeout=timeout_seconds)
    finally:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()

    if returncode != 0:
        raise RuntimeError(f"ORCA exited with code {returncode} for job {job.name}")

    logger.info("ORCA finished for job %s (exit code 0)", job.name)


def update_job_status(job_id: int, status: JobStatus):
    with get_session() as db:
        job = db.get(Job, job_id)

        if not job:
            logger.warning("Cannot update status for missing job %s", job_id)
            return

        job.status = status
        current_time = datetime.now(tz=UTC)
        match status:
            case JobStatus.RUNNING:
                job.started_dt = current_time
            case JobStatus.FINISHED:
                job.finished_dt = current_time
            case JobStatus.CANCELLED:
                job.finished_dt = current_time
            case JobStatus.ERROR:
                job.finished_dt = current_time
        db.add(job)
        logger.debug("Job %s status -> %s", job_id, status)


def update_convergence_metrics(data: GeometryConvergence, job_id: int):
    with get_session() as db:
        job = db.get(Job, job_id)

        if not job or job.id is None:
            raise ValueError("Job not found.")

        current_time = datetime.now(tz=UTC)

        metric_energy_change = JobMetric(
            job_id=job_id,
            metric_type=MetricType.ENERGY_CHANGE,
            value=data.energy_change,
            threshold=data.energy_change_threshold,
            recorded_dt=current_time,
        )
        db.add(metric_energy_change)

        metric_max_grad = JobMetric(
            job_id=job_id,
            metric_type=MetricType.MAX_GRAD,
            value=data.max_grad,
            threshold=data.max_grad_threshold,
            recorded_dt=current_time,
        )
        db.add(metric_max_grad)

        metric_max_step = JobMetric(
            job_id=job_id,
            metric_type=MetricType.MAX_STEP,
            value=data.max_step,
            threshold=data.max_step_threshold,
            recorded_dt=current_time,
        )
        db.add(metric_max_step)

        metric_rms_grad = JobMetric(
            job_id=job_id,
            metric_type=MetricType.RMS_GRAD,
            value=data.rms_grad,
            threshold=data.rms_grad_threshold,
            recorded_dt=current_time,
        )
        db.add(metric_rms_grad)

        metric_rms_step = JobMetric(
            job_id=job_id,
            metric_type=MetricType.RMS_STEP,
            value=data.rms_step,
            threshold=data.rms_step_threshold,
            recorded_dt=current_time,
        )
        db.add(metric_rms_step)


def update_total_energy_metric(data: TotalEnergy, job_id: int):
    with get_session() as db:
        job = db.get(Job, job_id)

        if not job or job.id is None:
            raise ValueError("Job not found.")

        current_time = datetime.now(tz=UTC)

        metric = JobMetric(
            job_id=job_id,
            metric_type=MetricType.TOTAL_SCF_ENERGY,
            value=data.total_energy,
            threshold=None,
            recorded_dt=current_time,
        )
        db.add(metric)


def update_geometry(data: list[AtomCoordinate], job_id: int):
    atoms = [
        Atom(
            element=coord.atomic_symbol,
            x=coord.x_coord,
            y=coord.y_coord,
            z=coord.z_coord,
        )
        for coord in data
    ]

    with get_session() as db:
        job = db.get(Job, job_id)

        if not job or job.id is None:
            raise ValueError("Job not found.")

        current_time = datetime.now(tz=UTC)

        geometry = GeometryStep(job_id=job.id, atoms=atoms, recorded_dt=current_time)
        db.add(geometry)


def main():
    setup_logging("worker", level=settings.log_level)
    logger.info("Pople worker started (log_level=%s)", settings.log_level)

    while True:
        job = get_next_job()

        if not job or job.id is None:
            logger.info("No jobs queued. Sleeping...")
            time.sleep(60)
            continue

        update_job_status(job.id, JobStatus.RUNNING)

        job_id = job.id
        out_path = Path(job.job_dir_path) / f"{job.name}.out"

        try:
            parser = OrcaParser()
            parser.register_convergence_updates(
                lambda data, job_id=job_id: update_convergence_metrics(data, job_id)
            )
            parser.register_energy_updates(
                lambda data, job_id=job_id: update_total_energy_metric(data, job_id)
            )
            parser.register_geometry_updates(
                lambda data, job_id=job_id: update_geometry(data, job_id)
            )

            logger.info("Writing ORCA output for job %s to %s", job.name, out_path)
            with out_path.open(
                mode="w", encoding="utf-8", newline="\n", buffering=1
            ) as out:
                for line in stream_orca_job(job, settings.job_timeout_seconds):
                    out.write(line + "\n")
                    logger.debug("job %s: %s", job.name, line)
                    try:
                        parser.parse(line)
                    except Exception:
                        logger.error(
                            "Parse failed for job %s on line %r", job.name, line
                        )
                        raise

            update_job_status(job_id, JobStatus.FINISHED)
            logger.info("Job %s (id=%s) finished", job.name, job_id)
        except Exception:
            logger.exception("Job %s (id=%s) failed", job.name, job_id)
            update_job_status(job_id, JobStatus.ERROR)


if __name__ == "__main__":
    main()
