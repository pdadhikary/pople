import type {
    GeometryData,
    GeometryStep,
    Job,
    JobFile,
    JobStatus,
    OptimizationData,
    OptimizationStep,
    Thresholds
} from '$lib/types/domain';

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://api:8000';

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

interface ApiJob {
    job_id: number;
    job_status: string;
    job_name: string;
    queued_dt: string;
    started_dt: string | null;
    finished_dt: string | null;
}

interface ApiJobListResponse {
    jobs: ApiJob[];
    total_jobs: number;
    page: number;
    page_size: number;
    total_pages: number;
}

interface ApiFile {
    filename: string;
    size: number;
    download_path: string;
    created_dt: string;
    last_updated_dt: string;
}

interface ApiFileListResponse {
    num_files: number;
    files: ApiFile[];
}

interface ApiOptimizationStep {
    energy_change: number;
    rms_grad: number;
    max_grad: number;
    rms_step: number;
    max_step: number;
}

interface ApiThresholds {
    energy_change: number;
    rms_grad: number;
    max_grad: number;
    rms_step: number;
    max_step: number;
}

interface ApiOptimizationData {
    job_id: number;
    job_status: string;
    job_name: string;
    queued_dt: string;
    started_dt: string | null;
    finished_dt: string | null;
    num_opt_steps: number;
    thresholds: ApiThresholds;
    opt_steps: ApiOptimizationStep[];
    scf_energy_steps: number[];
    trajectory_file_path: string;
}

interface ApiGeometryStep {
    atoms: { element: string; x: number; y: number; z: number }[];
    recorded_dt: string;
}

interface ApiGeometryData {
    num_steps: number;
    steps: ApiGeometryStep[];
}

function mapStatus(value: string): JobStatus {
    if (value === 'queued' || value === 'running' || value === 'finished' || value === 'error') {
        return value;
    }
    if (value === 'cancelled' || value === 'canceled') {
        return 'cancelled';
    }
    return 'error';
}

function mapJob(job: ApiJob): Job {
    return {
        id: job.job_id,
        name: job.job_name,
        status: mapStatus(job.job_status),
        queuedAt: job.queued_dt,
        startedAt: job.started_dt,
        finishedAt: job.finished_dt
    };
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) {
        let detail = res.statusText;
        try {
            const body = (await res.json()) as { detail?: unknown };
            if (typeof body.detail === 'string') detail = body.detail;
        } catch {
            // non-JSON error body
        }
        throw new ApiError(res.status, detail || 'Request failed');
    }
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
}

/** Full URL for a server-relative download path returned by the API. */
export function fileUrl(downloadPath: string): string {
    if (downloadPath.startsWith('http://') || downloadPath.startsWith('https://')) {
        return downloadPath;
    }
    return `${API_BASE}${downloadPath}`;
}

/** Full URL of the server-generated ZIP of a job's files. */
export function zipUrl(jobId: number): string {
    return `${API_BASE}/jobs/${jobId}/files/zip`;
}

/** List jobs (fetches a single large page; server-side pagination reserved for later). */
export async function getJobs(): Promise<Job[]> {
    const data = await http<ApiJobListResponse>('/jobs/?page=1&page_size=100');
    return data.jobs.map(mapJob);
}

export async function getJob(jobId: number): Promise<Job> {
    const data = await http<ApiJob>(`/jobs/${jobId}`);
    return mapJob(data);
}

export async function submitJob(name: string, file: File): Promise<Job> {
    const form = new FormData();
    form.append('job_name', name);
    form.append('input_file', file);
    const data = await http<ApiJob>('/jobs/', { method: 'POST', body: form });
    return mapJob(data);
}

export async function cancelJob(jobId: number): Promise<void> {
    await http<void>(`/jobs/${jobId}/cancel`, { method: 'POST' });
}

export async function getJobFiles(jobId: number): Promise<JobFile[]> {
    const data = await http<ApiFileListResponse>(`/jobs/${jobId}/files`);
    return data.files.map((file) => ({
        filename: file.filename,
        size: file.size,
        downloadPath: file.download_path,
        createdAt: file.created_dt,
        updatedAt: file.last_updated_dt
    }));
}

/** Fetch the text content of a job's input file (named `{jobName}.inp`). */
export async function getJobInputFileText(jobId: number, jobName: string): Promise<string> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/files/${encodeURIComponent(jobName)}.inp`);
    if (!res.ok) {
        throw new ApiError(res.status, res.statusText || 'Failed to load input file');
    }
    return res.text();
}

function mapThresholds(t: ApiThresholds): Thresholds {
    return {
        energyChange: t.energy_change,
        rmsGrad: t.rms_grad,
        maxGrad: t.max_grad,
        rmsStep: t.rms_step,
        maxStep: t.max_step
    };
}

function mapOptimizationStep(s: ApiOptimizationStep): OptimizationStep {
    return {
        energyChange: s.energy_change,
        rmsGrad: s.rms_grad,
        maxGrad: s.max_grad,
        rmsStep: s.rms_step,
        maxStep: s.max_step
    };
}

export async function getOptimizationData(jobId: number): Promise<OptimizationData> {
    const data = await http<ApiOptimizationData>(`/jobs/${jobId}/optimization`);
    return {
        numOptSteps: data.num_opt_steps,
        thresholds: mapThresholds(data.thresholds),
        optSteps: data.opt_steps.map(mapOptimizationStep),
        scfEnergySteps: data.scf_energy_steps,
        trajectoryFilePath: data.trajectory_file_path
    };
}

export async function getGeometryData(jobId: number): Promise<GeometryData> {
    const data = await http<ApiGeometryData>(`/jobs/${jobId}/geometry`);
    const steps: GeometryStep[] = data.steps.map((step) => ({
        atoms: step.atoms.map((atom) => ({
            element: atom.element,
            x: atom.x,
            y: atom.y,
            z: atom.z
        })),
        recordedAt: step.recorded_dt
    }));
    return { numSteps: data.num_steps, steps };
}
