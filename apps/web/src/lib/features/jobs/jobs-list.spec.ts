import { describe, expect, it } from 'vitest';
import { filterJobs, jobStatusCounts, paginateJobs, sortJobsNewestFirst } from './jobs-list';
import type { Job, JobStatus } from '$lib/types/domain';

function makeJob(id: number, status: JobStatus, queuedAt: string): Job {
    return {
        id,
        name: `job-${id}`,
        status,
        queuedAt,
        startedAt: null,
        finishedAt: null
    };
}

const jobs = [
    makeJob(1, 'queued', '2024-01-01T00:00:00.000Z'),
    makeJob(2, 'running', '2024-01-03T00:00:00.000Z'),
    makeJob(3, 'finished', '2024-01-02T00:00:00.000Z'),
    makeJob(4, 'error', '2024-01-04T00:00:00.000Z')
];

describe('filterJobs', () => {
    it('returns all jobs for the "all" filter', () => {
        expect(filterJobs(jobs, 'all')).toHaveLength(4);
    });

    it('filters by status', () => {
        const running = filterJobs(jobs, 'running');
        expect(running.map((j) => j.id)).toEqual([2]);
        const errored = filterJobs(jobs, 'error');
        expect(errored.map((j) => j.id)).toEqual([4]);
    });

    it('returns an empty array when nothing matches', () => {
        expect(filterJobs(jobs, 'cancelled')).toHaveLength(0);
    });
});

describe('sortJobsNewestFirst', () => {
    it('sorts by submission date descending', () => {
        const sorted = sortJobsNewestFirst(jobs);
        expect(sorted.map((j) => j.id)).toEqual([4, 2, 3, 1]);
    });
});

describe('paginateJobs', () => {
    it('pages jobs by page size', () => {
        expect(paginateJobs(jobs, 1, 2).map((j) => j.id)).toEqual([1, 2]);
        expect(paginateJobs(jobs, 2, 2).map((j) => j.id)).toEqual([3, 4]);
        expect(paginateJobs(jobs, 3, 2)).toHaveLength(0);
    });
});

describe('jobStatusCounts', () => {
    it('counts each status', () => {
        const counts = jobStatusCounts(jobs);
        expect(counts.all).toBe(4);
        expect(counts.queued).toBe(1);
        expect(counts.running).toBe(1);
        expect(counts.finished).toBe(1);
        expect(counts.error).toBe(1);
        expect(counts.cancelled).toBe(0);
    });
});
