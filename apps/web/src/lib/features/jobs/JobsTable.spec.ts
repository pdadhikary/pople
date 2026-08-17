import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import JobsTable from './JobsTable.svelte';
import type { Job } from '$lib/types/domain';

function makeJob(id: number, status: Job['status']): Job {
    return {
        id,
        name: `job-${id}`,
        status,
        queuedAt: '2024-01-01T00:00:00.000Z',
        startedAt: null,
        finishedAt: null
    };
}

describe('JobsTable', () => {
    it('renders a row per job with a link to the detail page', () => {
        const jobs = [makeJob(1, 'running'), makeJob(2, 'finished')];
        render(JobsTable, { jobs });

        expect(screen.getByRole('link', { name: 'job-1' })).toHaveAttribute('href', '/jobs/1');
        expect(screen.getByRole('link', { name: 'job-2' })).toHaveAttribute('href', '/jobs/2');
        expect(screen.getByText('Running')).toBeInTheDocument();
        expect(screen.getByText('Finished')).toBeInTheDocument();
    });

    it('shows a placeholder duration for queued jobs', () => {
        render(JobsTable, { jobs: [makeJob(1, 'queued')] });
        expect(screen.getAllByText('--').length).toBeGreaterThan(0);
    });

    it('renders no rows when the list is empty', () => {
        const { container } = render(JobsTable, { jobs: [] });
        expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
    });
});
