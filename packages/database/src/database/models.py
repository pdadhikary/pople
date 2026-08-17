from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel
from sqlalchemy.types import JSON, TypeDecorator
from sqlmodel import Column, Field, Index, Relationship, SQLModel


class MetricType(StrEnum):
    TOTAL_SCF_ENERGY = "total_scf_energy"
    ENERGY_CHANGE = "energy_change"
    MAX_GRAD = "max_grad"
    RMS_GRAD = "rms_grad"
    MAX_STEP = "max_step"
    RMS_STEP = "rms_step"


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    FINISHED = "finished"
    CANCELLED = "cancelled"
    ERROR = "error"


class Atom(BaseModel):
    element: str
    x: float
    y: float
    z: float


class AtomListJSON(TypeDecorator):
    impl = JSON
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return [atom.model_dump() for atom in value]

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return [Atom(**atom) for atom in value]


class Job(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    status: JobStatus = JobStatus.QUEUED
    job_dir_path: str
    job_input_path: str
    queued_dt: datetime
    started_dt: datetime | None = None
    finished_dt: datetime | None = None
    metrics: list["JobMetric"] = Relationship(
        back_populates="job",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    geometry_steps: list["GeometryStep"] = Relationship(
        back_populates="job",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class JobMetric(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    job_id: int = Field(
        foreign_key="job.id",
        index=True,
        ondelete="CASCADE",
    )
    metric_type: MetricType = Field(index=True)
    value: float
    threshold: float | None = None
    recorded_dt: datetime

    job: Job = Relationship(back_populates="metrics")


class GeometryStep(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="job.id", ondelete="CASCADE")
    atoms: list[Atom] = Field(sa_column=Column(AtomListJSON))
    recorded_dt: datetime

    job: Job = Relationship(back_populates="geometry_steps")

    __table_args__ = (Index("ix_geometry_step_job_id_recorded_dt", "job_id", "recorded_dt"),)
