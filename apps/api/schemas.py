from datetime import datetime
from typing import Annotated, Literal

from database.models import Atom, JobStatus, MetricType
from fastapi import File, Form, UploadFile
from pydantic import BaseModel


class JobBase(BaseModel):
    job_name: str


class JobSubmissionRequest(JobBase):
    job_name: Annotated[
        str, Form(pattern=r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$", min_length=1, max_length=20)
    ]
    input_file: UploadFile = File(...)


class JobSubmissionResponse(JobBase):
    job_id: int
    job_status: JobStatus
    queued_dt: datetime
    started_dt: datetime | None
    finished_dt: datetime | None


class JobQueryResponse(BaseModel):
    jobs: list[JobSubmissionResponse]
    total_jobs: int
    page: int
    page_size: int
    total_pages: int


class Thresholds(BaseModel):
    energy_change: float = 0.0
    rms_grad: float = 0.0
    max_grad: float = 0.0
    rms_step: float = 0.0
    max_step: float = 0.0


class OptimizationStep(BaseModel):
    energy_change: float
    rms_grad: float
    max_grad: float
    rms_step: float
    max_step: float


class JobDetailQueryResponse(JobSubmissionResponse):
    num_opt_steps: int
    thresholds: Thresholds
    opt_steps: list[OptimizationStep]
    scf_energy_steps: list[float]


class JobFile(BaseModel):
    filename: str
    size: int
    download_path: str
    created_dt: datetime
    last_updated_dt: datetime


class JobFileQueryResponse(BaseModel):
    num_files: int
    files: list[JobFile]


class GeometryQueryItem(BaseModel):
    atoms: list[Atom]
    recorded_dt: datetime


class GeometryQueryResponse(BaseModel):
    num_steps: int
    steps: list[GeometryQueryItem]

class OutputQueryResponse(BaseModel):
    lines: list[str]


class JobStatusMessage(BaseModel):
    type: Literal["job_status"] = "job_status"
    job_id: int
    status: JobStatus


class MetricUpdateMessage(BaseModel):
    type: Literal["metric_update"] = "metric_update"
    job_id: int
    metric_type: MetricType
    value: float
    threshold: float | None = None


class GeometryUpdateMessage(BaseModel):
    type: Literal["geometry_update"] = "geometry_update"
    job_id: int
    geometry_step_id: int


WsMessage = JobStatusMessage | MetricUpdateMessage | GeometryUpdateMessage
