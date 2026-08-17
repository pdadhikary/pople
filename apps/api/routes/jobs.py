import io
import zipfile
from collections import deque
from datetime import UTC, datetime
from math import ceil
from pathlib import Path
from typing import Annotated, cast

import database.models as mo
from database.session import get_db
from fastapi import APIRouter, Depends, Form, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from pople_logging import get_logger
from sqlalchemy import ColumnElement
from sqlmodel import Session, col, func, select

import schemas as sc
from settings import settings

jobs_router = APIRouter()

logger = get_logger("api.routes.jobs")

JOBS_DIR = Path(settings.jobs_dir)
INCLUDED_EXTENSIONS = {
    ".out",
    ".xyz",
    ".inp",
    ".hess",
    ".trj",
    ".allxyz",
    ".engrad",
    ".molden.input",
}


@jobs_router.get("/")
def get_jobs(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    db: Session = Depends(get_db),
) -> sc.JobQueryResponse:
    logger.debug("Listing jobs (page=%s, page_size=%s)", page, page_size)

    total_jobs = db.exec(select(func.count(col(mo.Job.id)))).one()

    skip = (page - 1) * page_size
    jobs_result = db.exec(select(mo.Job).offset(skip).limit(page_size))
    jobs = jobs_result.all()
    job_list = []

    for job in jobs:
        if job.id is not None:
            job_list.append(
                sc.JobSubmissionResponse(
                    job_id=job.id,
                    job_status=job.status,
                    job_name=job.name,
                    queued_dt=job.queued_dt,
                    started_dt=job.started_dt,
                    finished_dt=job.finished_dt,
                )
            )

    total_pages = max(1, ceil(total_jobs / page_size))
    logger.debug("Listed %d jobs (total=%d, page=%d)", len(job_list), total_jobs, page)
    return sc.JobQueryResponse(
        jobs=job_list,
        total_jobs=total_jobs,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@jobs_router.post("/")
async def create_job(
    form_data: Annotated[sc.JobSubmissionRequest, Form()],
    db: Session = Depends(get_db),
) -> sc.JobSubmissionResponse:
    job_name = Path(form_data.job_name).name
    job_fs_root = JOBS_DIR / job_name

    logger.info("Submitting job %s", job_name)
    if job_fs_root.exists():
        logger.warning("Job name already exists: %s", job_name)
        raise HTTPException(status_code=502, detail="Job name already exists")

    job_fs_input = job_fs_root / f"{job_name}.inp"

    queued_dt = datetime.now(tz=UTC)

    new_job = mo.Job(
        name=job_name,
        job_dir_path=str(job_fs_root),
        job_input_path=str(job_fs_input),
        queued_dt=queued_dt,
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    if (not new_job) or (new_job.id is None):
        logger.error("Job %s could not be committed", job_name)
        raise HTTPException(status_code=502, detail="Could not submit job")

    logger.info("Job %s created (id=%s)", job_name, new_job.id)

    bytes_uploaded = 0
    try:
        job_fs_root.mkdir()
        with job_fs_input.open(mode="wb") as out:
            while chunk := await form_data.input_file.read(1024 * 1024):
                bytes_uploaded += len(chunk)
                if bytes_uploaded > settings.max_upload_bytes:
                    raise OSError("File size too large.")
                out.write(chunk)
    except (OSError, FileExistsError) as exc:
        logger.exception(
            "Upload failed for job %s (%d bytes written)", job_name, bytes_uploaded
        )
        db.delete(new_job)
        db.commit()
        raise HTTPException(
            status_code=502,
            detail="Could not submit job.",
        ) from exc

    logger.info("Job %s input uploaded (%d bytes)", job_name, bytes_uploaded)
    return sc.JobSubmissionResponse(
        job_id=new_job.id,
        job_status=new_job.status,
        job_name=new_job.name,
        queued_dt=new_job.queued_dt,
        started_dt=None,
        finished_dt=None,
    )


@jobs_router.get("/{job_id}")
def get_job_with_id(
    job_id: int, db: Session = Depends(get_db)
) -> sc.JobSubmissionResponse:
    logger.debug("Fetching job %s", job_id)
    job = db.get(mo.Job, job_id)
    if not job:
        logger.warning("Job %s not found", job_id)
        raise HTTPException(status_code=404, detail="Job not found")

    return sc.JobSubmissionResponse(
        job_id=job_id,
        job_status=job.status,
        job_name=job.name,
        queued_dt=job.queued_dt,
        started_dt=job.started_dt,
        finished_dt=job.finished_dt,
    )


@jobs_router.post("/{job_id}/cancel")
def cancel_job(job_id: int, db: Session = Depends(get_db)):
    logger.info("Cancelling job %s", job_id)
    job = db.get(mo.Job, job_id)
    if not job:
        logger.warning("Cancel requested for missing job %s", job_id)
        raise HTTPException(status_code=404, detail="Job not found.")

    db.delete(job)
    db.commit()
    logger.info("Job %s cancelled", job_id)


@jobs_router.get("/{job_id}/files")
def get_files(job_id: int, db: Session = Depends(get_db)) -> sc.JobFileQueryResponse:
    logger.debug("Listing files for job %s", job_id)
    job = db.get(mo.Job, job_id)
    if not job:
        logger.warning("Files requested for missing job %s", job_id)
        raise HTTPException(status_code=404, detail="Job not found.")
    job_wdir = Path(job.job_dir_path)

    if not job_wdir.exists():
        logger.debug("Job %s working dir missing: %s", job_id, job_wdir)
        return sc.JobFileQueryResponse(num_files=0, files=[])

    job_files = []
    for file in job_wdir.glob("*"):
        if file.is_file() and file.suffix in INCLUDED_EXTENSIONS:
            file_stat = file.stat()
            created_dt = datetime.fromtimestamp(
                file_stat.st_birthtime
                if hasattr(file_stat, "st_birthtime")
                else file_stat.st_ctime,
                tz=UTC,
            )

            updated_dt = datetime.fromtimestamp(file_stat.st_mtime, tz=UTC)
            job_files.append(
                sc.JobFile(
                    filename=file.name,
                    size=file_stat.st_size,
                    download_path=f"/jobs/{job_id}/files/{file.name}",
                    created_dt=created_dt,
                    last_updated_dt=updated_dt,
                )
            )

    logger.debug("Job %s has %d files", job_id, len(job_files))
    return sc.JobFileQueryResponse(num_files=len(job_files), files=job_files)


@jobs_router.get("/{job_id}/files/zip")
def get_zip(job_id: int, db: Session = Depends(get_db)) -> StreamingResponse:
    logger.info("Zipping files for job %s", job_id)
    job = db.get(mo.Job, job_id)
    if not job:
        logger.warning("Zip requested for missing job %s", job_id)
        raise HTTPException(status_code=404, detail="Job not found.")
    job_wdir = Path(job.job_dir_path)

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in job_wdir.glob("*"):
            if file.is_file() and file.suffix in INCLUDED_EXTENSIONS:
                zf.write(file, arcname=file.relative_to(job_wdir))

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=job_{job_id}.zip"},
    )


@jobs_router.get("/{job_id}/files/{filename}")
def get_file(job_id: int, filename: str, db: Session = Depends(get_db)) -> FileResponse:
    logger.info("Downloading file %s for job %s", filename, job_id)
    job = db.get(mo.Job, job_id)
    if not job:
        logger.warning("File download requested for missing job %s", job_id)
        raise HTTPException(status_code=404, detail="Job not found.")
    job_wdir = Path(job.job_dir_path)

    file_path = job_wdir / Path(filename).name

    if (
        file_path.exists()
        and file_path.is_file()
        and file_path.suffix in INCLUDED_EXTENSIONS
    ):
        return FileResponse(file_path)

    logger.warning("File %s not found for job %s", filename, job_id)
    raise HTTPException(status_code=404, detail="File not found.")


def get_job_metric_series(
    db: Session, job_id: int, metric_name: str
) -> list[mo.JobMetric]:
    statement = (
        select(mo.JobMetric)
        .where(mo.JobMetric.job_id == job_id, mo.JobMetric.metric_type == metric_name)
        .order_by(cast(ColumnElement, mo.JobMetric.recorded_dt))
    )
    return cast(list, db.exec(statement).all())


@jobs_router.get("/{job_id}/optimization")
def get_optimization_data(
    job_id: int, db: Session = Depends(get_db)
) -> sc.JobDetailQueryResponse:
    logger.debug("Fetching optimization data for job %s", job_id)
    job = db.get(mo.Job, job_id)
    if not job or job.id is None:
        logger.warning("Optimization requested for missing job %s", job_id)
        raise HTTPException(status_code=404, detail="Job not found.")

    total_scf_energy = get_job_metric_series(db, job_id, mo.MetricType.TOTAL_SCF_ENERGY)
    energy_change = get_job_metric_series(db, job_id, mo.MetricType.ENERGY_CHANGE)
    max_grad = get_job_metric_series(db, job_id, mo.MetricType.MAX_GRAD)
    rms_grad = get_job_metric_series(db, job_id, mo.MetricType.RMS_GRAD)
    max_step = get_job_metric_series(db, job_id, mo.MetricType.MAX_STEP)
    rms_step = get_job_metric_series(db, job_id, mo.MetricType.RMS_STEP)

    optimization_steps: list[sc.OptimizationStep] = []
    for ec, mg, rg, ms, rs in zip(
        energy_change, max_grad, rms_grad, max_step, rms_step, strict=False
    ):
        optimization_steps.append(
            sc.OptimizationStep(
                energy_change=ec.value,
                rms_grad=rg.value,
                max_grad=mg.value,
                rms_step=rs.value,
                max_step=ms.value,
            )
        )

    num_steps = len(optimization_steps)
    scf_energy_steps = [metric.value for metric in total_scf_energy]

    logger.debug("Job %s optimization: %d steps", job_id, num_steps)

    return sc.JobDetailQueryResponse(
        job_id=job.id,
        job_status=job.status,
        job_name=job.name,
        queued_dt=job.queued_dt,
        started_dt=job.started_dt,
        finished_dt=job.finished_dt,
        num_opt_steps=num_steps,
        opt_steps=optimization_steps,
        scf_energy_steps=scf_energy_steps,
        thresholds=sc.Thresholds(
            energy_change=energy_change[0].threshold or 0.0,
            rms_grad=rms_grad[0].threshold or 0.0,
            max_grad=max_grad[0].threshold or 0.0,
            rms_step=rms_step[0].threshold or 0.0,
            max_step=max_step[0].threshold or 0.0,
        )
        if num_steps > 0
        else sc.Thresholds(),
    )


@jobs_router.get("/{job_id}/geometry")
def get_geometry_data(
    job_id: int, db: Session = Depends(get_db)
) -> sc.GeometryQueryResponse:
    logger.debug("Fetching geometry data for job %s", job_id)
    job = db.get(mo.Job, job_id)
    if not job or job.id is None:
        logger.warning("Geometry requested for missing job %s", job_id)
        raise HTTPException(status_code=404, detail="Job not found.")

    statement = (
        select(mo.GeometryStep)
        .where(mo.GeometryStep.job_id == job_id)
        .order_by(cast(ColumnElement, mo.GeometryStep.recorded_dt))
    )

    geometry_steps = db.exec(statement).all()

    logger.debug("Job %s geometry: %d steps", job_id, len(geometry_steps))

    return sc.GeometryQueryResponse(
        num_steps=len(geometry_steps),
        steps=[
            sc.GeometryQueryItem(atoms=step.atoms, recorded_dt=step.recorded_dt)
            for step in geometry_steps
        ],
    )


@jobs_router.get("/{job_id}/output")
def get_output(job_id: int, db: Session = Depends(get_db)) -> sc.OutputQueryResponse:
    logger.debug("Fetching outputs for job %s", job_id)
    job = db.get(mo.Job, job_id)
    if not job or job.id is None:
        logger.warning("Outputs requested for missing job %s", job_id)
        raise HTTPException(status_code=404, detail="Job not found.")

    lines = []
    output_file = Path(job.job_dir_path) / f"{job.name}.out"
    if not output_file.exists():
        return sc.OutputQueryResponse(lines=lines)

    with open(output_file, "r", encoding="utf-8") as f:
        lines = list(deque(f, maxlen=200))

    return sc.OutputQueryResponse(lines=lines)
