import { onDestroy } from 'svelte';
import type { Atom, JobStatus, MetricType } from '$lib/types/domain';

/**
 * Message pushed from the backend WebSocket. Field names match the backend
 * Pydantic WsMessage subclasses (snake_case) exactly.
 */
export interface JobWsMessage {
    type: 'job_status_changed' | 'new_metric' | 'new_geometry';
    job_id: number;
    // job_status_changed
    job_name?: string;
    job_status?: JobStatus;
    queued_dt?: string;
    started_dt?: string | null;
    finished_dt?: string | null;
    // new_metric
    metric_type?: MetricType;
    value?: number;
    threshold?: number | null;
    // new_geometry
    atoms?: Atom[];
    // common
    recorded_dt?: string;
}

/** Rewrite the HTTP API base URL to a WebSocket URL for the job's subscribe endpoint. */
export function wsUrl(jobId: number): string {
    const base: string = import.meta.env.VITE_API_BASE_URL ?? 'http://api:8000';
    return `${base.replace(/^http/, 'ws')}/jobs/${jobId}/ws`;
}

/**
 * Open a WebSocket subscription for a job. The server pushes status/metric/geometry
 * messages; each is parsed and passed to `onMessage`. The socket is closed when the
 * component that called this is destroyed.
 */
export function openJobSocket(
    jobId: number,
    onMessage: (message: JobWsMessage) => void
): WebSocket {
    const ws = new WebSocket(wsUrl(jobId));
    ws.onmessage = (event) => {
        onMessage(JSON.parse(event.data as string) as JobWsMessage);
    };
    onDestroy(() => ws.close());
    return ws;
}
