export type JobStatus = 'queued' | 'running' | 'finished' | 'cancelled' | 'error';

export interface Atom {
    element: string;
    x: number;
    y: number;
    z: number;
}

export interface GeometryStep {
    atoms: Atom[];
    /** ISO timestamp when the geometry step was recorded. */
    recordedAt: string;
}

export interface GeometryData {
    numSteps: number;
    steps: GeometryStep[];
}

export interface Job {
    id: number;
    name: string;
    status: JobStatus;
    /** ISO timestamp when the job was submitted and queued. */
    queuedAt: string;
    /** ISO timestamp when the worker started the job, or null if not yet running. */
    startedAt: string | null;
    /** ISO timestamp when the job finished, or null if not yet finished. */
    finishedAt: string | null;
}

export interface JobQueryResponse {
    jobs: Job[];
    totalJobs: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface Metric {
    value: number;
    /** ISO timestamp when the metric was recorded. */
    recordedAt: string;
}

export interface Thresholds {
    energyChange: number;
    rmsGrad: number;
    maxGrad: number;
    rmsStep: number;
    maxStep: number;
}

export interface OptimizationData {
    numOptSteps: number;
    thresholds: Thresholds;
    energyChange: Metric[];
    rmsGrad: Metric[];
    maxGrad: Metric[];
    rmsStep: Metric[];
    maxStep: Metric[];
    scfEnergySteps: Metric[];
}

export interface JobFile {
    filename: string;
    size: number;
    /** Server-relative download URL (e.g. "/jobs/1/files/foo.inp"). */
    downloadPath: string;
    createdAt: string;
    updatedAt: string;
}
