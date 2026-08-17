import type { Job } from '$lib/types/domain';
import type { StatusFilter } from './JobsFilters.svelte';

export const JOBS_PAGE_SIZE = 10;

export function filterJobs(jobs: Job[], filter: StatusFilter): Job[] {
    return filter === 'all' ? jobs : jobs.filter((job) => job.status === filter);
}

/** Submission date — newest first (ISO strings compare lexicographically). */
export function sortJobsNewestFirst(jobs: Job[]): Job[] {
    return [...jobs].sort((a, b) => (b.queuedAt ?? '').localeCompare(a.queuedAt ?? ''));
}

export function paginateJobs(jobs: Job[], page: number, pageSize: number): Job[] {
    return jobs.slice((page - 1) * pageSize, page * pageSize);
}

export function jobStatusCounts(jobs: Job[]): Record<StatusFilter, number> {
    const counts: Record<StatusFilter, number> = {
        all: jobs.length,
        queued: 0,
        running: 0,
        finished: 0,
        cancelled: 0,
        error: 0
    };
    for (const job of jobs) counts[job.status]++;
    return counts;
}
