import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import DetailPage from '../../routes/jobs/[jobId]/+page.svelte';
import { mockFetch, resetFetch } from '../mock-fetch';

const apiJob = (id: number, status = 'queued') => ({
    job_id: id,
    job_name: `water_opt`,
    job_status: status,
    queued_dt: '2024-01-01T00:00:00Z',
    started_dt: status === 'running' || status === 'finished' ? '2024-01-01T00:00:05Z' : null,
    finished_dt: status === 'finished' ? '2024-01-01T00:00:10Z' : null
});

const emptyOpt = {
    job_id: 1,
    job_status: 'queued',
    job_name: 'water_opt',
    queued_dt: '2024-01-01T00:00:00Z',
    started_dt: null,
    finished_dt: null,
    num_opt_steps: 0,
    thresholds: { energy_change: 0, rms_grad: 0, max_grad: 0, rms_step: 0, max_step: 0 },
    opt_steps: [],
    scf_energy_steps: [],
    trajectory_file_path: ''
};

const emptyGeometry = { num_steps: 0, steps: [] };

const geometryWithSteps = {
    num_steps: 2,
    steps: [
        {
            atoms: [
                { element: 'O', x: 0, y: 0, z: 0.117 },
                { element: 'H', x: 0, y: 0.757, z: -0.469 },
                { element: 'H', x: 0, y: -0.757, z: -0.469 }
            ],
            recorded_dt: '2024-01-01T00:00:01Z'
        },
        {
            atoms: [
                { element: 'O', x: 0.01, y: 0, z: 0.1 },
                { element: 'H', x: 0.01, y: 0.75, z: -0.46 },
                { element: 'H', x: 0.01, y: -0.75, z: -0.46 }
            ],
            recorded_dt: '2024-01-01T00:00:02Z'
        }
    ]
};

beforeEach(() => {
    resetFetch();
});

afterEach(() => {
    resetFetch();
});

function mockJobDetail(status = 'queued') {
    mockFetch({
        'GET /jobs/1': { body: apiJob(1, status) },
        'GET /jobs/1/optimization': { body: emptyOpt },
        'GET /jobs/1/geometry': { body: emptyGeometry },
        'GET /jobs/1/files/water_opt.inp': { text: '! B3LYP OPT\n* xyz 0 1\nO 0 0 0\n*' }
    });
}

describe('JobDetailPage', () => {
    it('renders the job header with detail actions', async () => {
        mockJobDetail();
        render(DetailPage, { params: { jobId: '1' } });

        expect(await screen.findByRole('heading', { name: 'water_opt' })).toBeInTheDocument();
        expect(screen.getByText('Queued')).toBeInTheDocument();
        expect(screen.getByText('--')).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'View Log' })).toHaveAttribute(
            'href',
            '/jobs/1/log'
        );
        expect(screen.getByRole('link', { name: 'View Files' })).toHaveAttribute(
            'href',
            '/jobs/1/files'
        );
    });

    it('shows a not found state for an unknown job id', async () => {
        mockFetch({ 'GET /jobs/999': { status: 404, body: { detail: 'Job not found' } } });
        render(DetailPage, { params: { jobId: '999' } });
        expect(await screen.findByText('Job not found')).toBeInTheDocument();
    });

    it('shows the input file contents fetched from the API', async () => {
        mockJobDetail();
        render(DetailPage, { params: { jobId: '1' } });

        await screen.findByRole('heading', { name: 'water_opt' });
        expect(screen.getByText((content) => content.includes('B3LYP OPT'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('O 0 0 0'))).toBeInTheDocument();
    });

    it('shows empty state when no optimization data exists', async () => {
        mockJobDetail();
        render(DetailPage, { params: { jobId: '1' } });

        expect(
            (await screen.findAllByText('No optimization data available')).length
        ).toBeGreaterThan(0);
    });

    it('shows empty state when no geometry steps exist', async () => {
        mockJobDetail();
        render(DetailPage, { params: { jobId: '1' } });

        expect(await screen.findByText('No geometry available')).toBeInTheDocument();
    });

    it('renders the geometry slider and coordinate table when steps exist', async () => {
        mockFetch({
            'GET /jobs/1': { body: apiJob(1, 'finished') },
            'GET /jobs/1/optimization': { body: emptyOpt },
            'GET /jobs/1/geometry': { body: geometryWithSteps },
            'GET /jobs/1/files/water_opt.inp': { text: '! B3LYP OPT\n* xyz 0 1\nO 0 0 0\n*' }
        });
        render(DetailPage, { params: { jobId: '1' } });

        // Defaults to the latest step (2 of 2)
        expect(await screen.findByText('Step 2 of 2')).toBeInTheDocument();
        expect(
            screen.getByRole('slider', { name: 'Select optimization step' })
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy XYZ' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Molecular Coordinates' })).toBeInTheDocument();
        // table shows atoms for the latest step
        expect(screen.getAllByText('O').length).toBeGreaterThan(0);
        expect(screen.getAllByText('H')).toHaveLength(2);
    });
});
