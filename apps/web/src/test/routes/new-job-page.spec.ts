import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import NewJobPage from '../../routes/jobs/new/+page.svelte';
import { mockFetch, resetFetch } from '../mock-fetch';

const gotoMock = vi.hoisted(() => vi.fn());
vi.mock('$app/navigation', () => ({ goto: gotoMock }));

beforeEach(() => {
    resetFetch();
    gotoMock.mockReset();
});

afterEach(() => {
    resetFetch();
});

describe('NewJobPage', () => {
    it('submits a valid job and navigates to its detail page', async () => {
        const fn = mockFetch({
            'POST /jobs/': {
                body: {
                    job_id: 7,
                    job_name: 'water_optimization',
                    job_status: 'queued',
                    queued_dt: '2024-01-01T00:00:00Z',
                    started_dt: null,
                    finished_dt: null
                }
            }
        });
        render(NewJobPage);

        await fireEvent.input(screen.getByLabelText('Job Name'), {
            target: { value: 'water_optimization' }
        });

        const file = new File(['! B3LYP OPT\n* xyz 0 1\nO 0 0 0\n*'], 'water.inp', {
            type: 'text/plain'
        });
        await fireEvent.change(document.getElementById('orca-input-file') as HTMLInputElement, {
            target: { files: [file] }
        });

        await screen.findByText('water.inp');
        await fireEvent.click(screen.getByRole('button', { name: 'Submit Job' }));

        await waitFor(() => {
            expect(gotoMock).toHaveBeenCalledTimes(1);
        });
        expect(gotoMock.mock.calls[0][0]).toBe('/jobs/7');

        const call = fn.mock.calls[0];
        const init = call[1] as RequestInit;
        expect(init.method).toBe('POST');
        expect(init.body).toBeInstanceOf(FormData);
        const form = init.body as FormData;
        expect(form.get('job_name')).toBe('water_optimization');
    });

    it('shows validation errors for an invalid name and missing file', async () => {
        mockFetch({ 'POST /jobs/': { body: { job_id: 1 } } });
        render(NewJobPage);

        await fireEvent.input(screen.getByLabelText('Job Name'), {
            target: { value: 'bad name' }
        });
        await fireEvent.click(screen.getByRole('button', { name: 'Submit Job' }));

        expect(
            await screen.findByText(
                'Job name must start with a letter or number and may only contain letters, numbers, hyphens and underscores (no spaces or special characters).'
            )
        ).toBeInTheDocument();
        expect(
            await screen.findByText('An ORCA input file (.inp) is required.')
        ).toBeInTheDocument();
        expect(gotoMock).not.toHaveBeenCalled();
    });

    it('rejects an invalid file type', async () => {
        render(NewJobPage);

        const file = new File(['content'], 'job.txt', { type: 'text/plain' });
        await fireEvent.change(document.getElementById('orca-input-file') as HTMLInputElement, {
            target: { files: [file] }
        });

        expect(
            await screen.findByText('File must be an ORCA input file with a .inp extension.')
        ).toBeInTheDocument();
    });

    it('surfaces a submission error from the API', async () => {
        mockFetch({ 'POST /jobs/': { status: 502, body: { detail: 'Job name already exists' } } });
        render(NewJobPage);

        await fireEvent.input(screen.getByLabelText('Job Name'), {
            target: { value: 'dup' }
        });
        const file = new File(['x'], 'dup.inp', { type: 'text/plain' });
        await fireEvent.change(document.getElementById('orca-input-file') as HTMLInputElement, {
            target: { files: [file] }
        });
        await screen.findByText('dup.inp');
        await fireEvent.click(screen.getByRole('button', { name: 'Submit Job' }));

        expect(await screen.findByText('Job name already exists')).toBeInTheDocument();
        expect(gotoMock).not.toHaveBeenCalled();
    });
});
