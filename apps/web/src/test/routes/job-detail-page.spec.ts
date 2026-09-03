import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import DetailPage from '../../routes/jobs/[jobId]/+page.svelte';
import { mockFetch, mockWebSocket, resetFetch } from '../mock-fetch';

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
    energy_change: [],
    rms_grad: [],
    max_grad: [],
    rms_step: [],
    max_step: [],
    scf_energy_steps: []
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

        expect(screen.getByRole('link', { name: 'View Output' })).toHaveAttribute(
            'href',
            '/jobs/1/output'
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

    it('opens a WebSocket and updates status on job_status_changed', async () => {
        mockFetch({
            'GET /jobs/1': { body: apiJob(1, 'running') },
            'GET /jobs/1/optimization': { body: emptyOpt },
            'GET /jobs/1/geometry': { body: emptyGeometry },
            'GET /jobs/1/files/water_opt.inp': { text: '' }
        });
        const ws = mockWebSocket();
        render(DetailPage, { params: { jobId: '1' } });

        await screen.findByRole('heading', { name: 'water_opt' });
        expect(screen.getByText('Running')).toBeInTheDocument();

        expect(ws.instances).toHaveLength(1);
        expect(ws.instances[0].url).toContain('/jobs/1/ws');

        ws.instances[0].emit({
            type: 'job_status_changed',
            job_id: 1,
            job_status: 'finished',
            queued_dt: '2024-01-01T00:00:00Z',
            started_dt: '2024-01-01T00:00:05Z',
            finished_dt: '2024-01-01T00:00:10Z'
        });

        await screen.findByText('Finished');
    });

    it('appends a metric point on new_metric and shows the chart', async () => {
        mockFetch({
            'GET /jobs/1': { body: apiJob(1, 'running') },
            'GET /jobs/1/optimization': { body: emptyOpt },
            'GET /jobs/1/geometry': { body: emptyGeometry },
            'GET /jobs/1/files/water_opt.inp': { text: '' }
        });
        const ws = mockWebSocket();
        render(DetailPage, { params: { jobId: '1' } });

        await screen.findByRole('heading', { name: 'water_opt' });
        expect(
            (await screen.findAllByText('No optimization data available')).length
        ).toBeGreaterThan(0);

        ws.instances[0].emit({
            type: 'new_metric',
            job_id: 1,
            metric_type: 'energy_change',
            value: -0.001,
            recorded_dt: '2024-01-01T00:00:01Z'
        });

        // After a metric arrives, numOptSteps > 0 so the empty state disappears.
        await waitFor(() => {
            expect(screen.queryByText('No optimization data available')).not.toBeInTheDocument();
        });
    });

    it('shows the distance measurement when two atoms are selected via the table', async () => {
        mockFetch({
            'GET /jobs/1': { body: apiJob(1, 'finished') },
            'GET /jobs/1/optimization': { body: emptyOpt },
            'GET /jobs/1/geometry': { body: geometryWithSteps },
            'GET /jobs/1/files/water_opt.inp': { text: '' }
        });
        render(DetailPage, { params: { jobId: '1' } });

        await screen.findByText('Step 2 of 2');
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 1 (O) selection' }));
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 2 (H) selection' }));

        expect(screen.getByRole('heading', { name: 'Measurements' })).toBeInTheDocument();
        // Distance between O and H of the latest step (step 2).
        expect(screen.getByText(/0\.9360/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Clear Selection' })).toBeInTheDocument();
    });

    it('adds the angle measurement when a third atom is selected', async () => {
        mockFetch({
            'GET /jobs/1': { body: apiJob(1, 'finished') },
            'GET /jobs/1/optimization': { body: emptyOpt },
            'GET /jobs/1/geometry': { body: geometryWithSteps },
            'GET /jobs/1/files/water_opt.inp': { text: '' }
        });
        render(DetailPage, { params: { jobId: '1' } });

        await screen.findByText('Step 2 of 2');
        // Select H1, O, H2 so the angle is measured at the oxygen vertex.
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 2 (H) selection' }));
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 1 (O) selection' }));
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 3 (H) selection' }));

        expect(screen.getByText(/106\.5/)).toBeInTheDocument();
    });

    it('clears the measurements when Clear Selection is clicked', async () => {
        mockFetch({
            'GET /jobs/1': { body: apiJob(1, 'finished') },
            'GET /jobs/1/optimization': { body: emptyOpt },
            'GET /jobs/1/geometry': { body: geometryWithSteps },
            'GET /jobs/1/files/water_opt.inp': { text: '' }
        });
        render(DetailPage, { params: { jobId: '1' } });

        await screen.findByText('Step 2 of 2');
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 1 (O) selection' }));
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 2 (H) selection' }));

        expect(screen.getByRole('heading', { name: 'Measurements' })).toBeInTheDocument();

        await fireEvent.click(screen.getByRole('button', { name: 'Clear Selection' }));

        expect(screen.queryByRole('heading', { name: 'Measurements' })).not.toBeInTheDocument();
    });
});
