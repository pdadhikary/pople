import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import JobsPage from '../../routes/jobs/+page.svelte';
import { mockFetch, resetFetch } from '../mock-fetch';

const apiJob = (id: number, status: string) => ({
    job_id: id,
    job_name: `job-${id}`,
    job_status: status,
    queued_dt: `2024-01-0${id}T00:00:00Z`,
    started_dt: null,
    finished_dt: null
});

beforeEach(() => {
    resetFetch();
});

afterEach(() => {
    resetFetch();
});

describe('JobsPage', () => {
    it('shows an empty state when no jobs exist', async () => {
        mockFetch({
            'GET /jobs/': {
                body: { jobs: [], total_jobs: 0, page: 1, page_size: 100, total_pages: 1 }
            }
        });
        render(JobsPage);
        expect(await screen.findByText('No jobs submitted yet')).toBeInTheDocument();
    });

    it('filters jobs by status', async () => {
        mockFetch({
            'GET /jobs/': {
                body: {
                    jobs: [apiJob(1, 'queued'), apiJob(2, 'cancelled')],
                    total_jobs: 2,
                    page: 1,
                    page_size: 100,
                    total_pages: 1
                }
            }
        });

        render(JobsPage);
        await screen.findByText('job-1');
        expect(screen.getByText('job-2')).toBeInTheDocument();

        await fireEvent.click(screen.getByRole('button', { name: /Cancelled/ }));
        expect(screen.getByText('job-2')).toBeInTheDocument();
        expect(screen.queryByText('job-1')).toBeNull();

        await fireEvent.click(screen.getByRole('button', { name: /Queued/ }));
        expect(screen.getByText('job-1')).toBeInTheDocument();
        expect(screen.queryByText('job-2')).toBeNull();

        await fireEvent.click(screen.getByRole('button', { name: /^All/ }));
        expect(screen.getByText('job-1')).toBeInTheDocument();
        expect(screen.getByText('job-2')).toBeInTheDocument();
    });

    it('shows an empty state when no jobs match the selected filter', async () => {
        mockFetch({
            'GET /jobs/': {
                body: {
                    jobs: [apiJob(1, 'queued')],
                    total_jobs: 1,
                    page: 1,
                    page_size: 100,
                    total_pages: 1
                }
            }
        });

        render(JobsPage);
        await screen.findByText('job-1');
        await fireEvent.click(screen.getByRole('button', { name: /Running/ }));
        expect(await screen.findByText('No jobs match this filter')).toBeInTheDocument();
    });

    it('shows an error state when the request fails', async () => {
        mockFetch({ 'GET /jobs/': { status: 500, body: { detail: 'boom' } } });
        render(JobsPage);
        expect(await screen.findByText('Failed to load jobs')).toBeInTheDocument();
    });
});
