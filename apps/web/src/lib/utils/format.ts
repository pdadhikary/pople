import type { Job } from '$lib/types/domain';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const SECOND = 1000;

/** Format a millisecond duration as e.g. "3m 25s", "00:05:12", or "--". */
export function formatDuration(ms: number | undefined | null): string {
    if (ms === undefined || ms === null || Number.isNaN(ms)) return '--';
    if (ms < 0) return '--';
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    const seconds = Math.floor((ms % MINUTE) / SECOND);
    if (hours > 0)
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    return `${seconds}s`;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

export function formatDate(iso: string | undefined | null): string {
    if (!iso) return '--';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--';
    return dateFormatter.format(d);
}

export function formatTime(iso: string | undefined | null): string {
    if (!iso) return '--';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--';
    return timeFormatter.format(d);
}

/**
 * Compute the elapsed execution duration of a job:
 * running = now - startedAt; finished/cancelled/error = finishedAt - startedAt; queued = undefined.
 */
export function computeDuration(
    job: Pick<Job, 'status' | 'startedAt' | 'finishedAt'>
): number | undefined {
    const start = job.startedAt ? new Date(job.startedAt).getTime() : NaN;
    if (Number.isNaN(start)) return undefined;

    if (job.status === 'running') return Date.now() - start;

    const end = job.finishedAt ? new Date(job.finishedAt).getTime() : NaN;
    if (!Number.isNaN(end)) return end - start;

    return undefined;
}

/** Format a coordinate with a fixed number of decimal places. */
export function formatCoordinate(value: number, decimals = 4): string {
    return value.toFixed(decimals);
}

/** Format a human-readable file size. */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatEnergy(value: number): string {
    return value.toFixed(6);
}
