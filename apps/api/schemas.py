from datetime import datetime
from enum import Enum
from typing import Annotated

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


class Metric(BaseModel):
    value: float
    recorded_dt: datetime


class JobDetailQueryResponse(JobSubmissionResponse):
    num_opt_steps: int
    thresholds: Thresholds
    energy_change: list[Metric]
    rms_grad: list[Metric]
    max_grad: list[Metric]
    rms_step: list[Metric]
    max_step: list[Metric]
    scf_energy_steps: list[Metric]


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


class MessageType(str, Enum):
    JOB_STATUS_CHANGED = "job_status_changed"
    NEW_METRIC = "new_metric"
    NEW_GEOMETRY = "new_geometry"


class WsMessage(BaseModel):
    type: MessageType
    job_id: int


class JobStatusChangeMessage(WsMessage):
    job_id: int
    job_name: str
    job_status: JobStatus
    queued_dt: datetime
    started_dt: datetime | None
    finished_dt: datetime | None


class NewMetricMessage(WsMessage):
    type: MessageType
    job_id: int
    metric_type: MetricType
    value: float
    threshold: float | None = None
    recorded_dt: datetime


class NewGeometryMessage(WsMessage):
    type: MessageType
    job_id: int
    atoms: list[Atom]
    recorded_dt: datetime
