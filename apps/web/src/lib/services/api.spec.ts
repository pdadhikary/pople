import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    ApiError,
    cancelJob,
    fileUrl,
    getJob,
    getJobFiles,
    getJobs,
    getOptimizationData,
    submitJob,
    zipUrl
} from './api';
import { mockFetch, resetFetch } from '../../test/mock-fetch';

const apiJob = (id: number, status = 'queued') => ({
    job_id: id,
    job_name: `job-${id}`,
    job_status: status,
    queued_dt: '2024-01-01T00:00:00Z',
    started_dt: null,
    finished_dt: null
});

describe('api client', () => {
    beforeEach(() => {
        resetFetch();
    });

    afterEach(() => {
        resetFetch();
    });

    describe('getJobs', () => {
        it('maps a paginated response to Job[]', async () => {
            mockFetch({
                'GET /jobs/': {
                    body: {
                        jobs: [apiJob(1, 'running'), apiJob(2, 'finished')],
                        total_jobs: 2,
                        page: 1,
                        page_size: 100,
                        total_pages: 1
                    }
                }
            });

            const jobs = await getJobs();
            expect(jobs).toEqual([
                {
                    id: 1,
                    name: 'job-1',
                    status: 'running',
                    queuedAt: '2024-01-01T00:00:00Z',
                    startedAt: null,
                    finishedAt: null
                },
                {
                    id: 2,
                    name: 'job-2',
                    status: 'finished',
                    queuedAt: '2024-01-01T00:00:00Z',
                    startedAt: null,
                    finishedAt: null
                }
            ]);
        });

        it('normalizes cancelled status from the API', async () => {
            mockFetch({
                'GET /jobs/': {
                    body: {
                        jobs: [apiJob(3, 'cancelled')],
                        total_jobs: 1,
                        page: 1,
                        page_size: 100,
                        total_pages: 1
                    }
                }
            });
            const [job] = await getJobs();
            expect(job.status).toBe('cancelled');
        });
    });

    describe('getJob', () => {
        it('returns a mapped job', async () => {
            mockFetch({ 'GET /jobs/42': { body: apiJob(42, 'error') } });
            const job = await getJob(42);
            expect(job.id).toBe(42);
            expect(job.status).toBe('error');
        });

        it('throws ApiError with detail on 404', async () => {
            mockFetch({ 'GET /jobs/42': { status: 404, body: { detail: 'Job not found' } } });
            await expect(getJob(42)).rejects.toMatchObject({
                status: 404,
                message: 'Job not found'
            });
        });
    });

    describe('submitJob', () => {
        it('posts multipart form data and returns the created job', async () => {
            const fn = mockFetch({ 'POST /jobs/': { body: apiJob(7) } });
            const file = new File(['! B3LYP\n'], 'mol.inp', { type: 'text/plain' });
            const job = await submitJob('mol-opt', file);
            expect(job.id).toBe(7);

            const call = fn.mock.calls[0];
            const init = call[1] as RequestInit;
            expect(init.method).toBe('POST');
            expect(init.body).toBeInstanceOf(FormData);
            const form = init.body as FormData;
            expect(form.get('job_name')).toBe('mol-opt');
            expect(form.get('input_file')).toBeInstanceOf(File);
        });

        it('throws ApiError on server rejection', async () => {
            mockFetch({
                'POST /jobs/': { status: 502, body: { detail: 'Job name already exists' } }
            });
            const file = new File(['x'], 'x.inp', { type: 'text/plain' });
            await expect(submitJob('dup', file)).rejects.toBeInstanceOf(ApiError);
        });
    });

    describe('cancelJob', () => {
        it('posts to the cancel endpoint', async () => {
            const fn = mockFetch({ 'POST /jobs/5/cancel': { status: 200 } });
            await cancelJob(5);
            expect(fn).toHaveBeenCalledTimes(1);
            expect((fn.mock.calls[0][1] as RequestInit).method).toBe('POST');
        });
    });

    describe('getJobFiles', () => {
        it('maps files to camelCase', async () => {
            mockFetch({
                'GET /jobs/5/files': {
                    body: {
                        num_files: 1,
                        files: [
                            {
                                filename: 'mol.inp',
                                size: 12,
                                download_path: '/jobs/5/files/mol.inp',
                                created_dt: '2024-01-01T00:00:00Z',
                                last_updated_dt: '2024-01-02T00:00:00Z'
                            }
                        ]
                    }
                }
            });
            const files = await getJobFiles(5);
            expect(files).toEqual([
                {
                    filename: 'mol.inp',
                    size: 12,
                    downloadPath: '/jobs/5/files/mol.inp',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-02T00:00:00Z'
                }
            ]);
        });
    });

    describe('getOptimizationData', () => {
        it('maps optimization response to camelCase', async () => {
            mockFetch({
                'GET /jobs/5/optimization': {
                    body: {
                        job_id: 5,
                        job_status: 'finished',
                        job_name: 'mol-opt',
                        queued_dt: '2024-01-01T00:00:00Z',
                        started_dt: null,
                        finished_dt: null,
                        num_opt_steps: 2,
                        thresholds: {
                            energy_change: 1e-6,
                            rms_grad: 1e-5,
                            max_grad: 1e-4,
                            rms_step: 1e-3,
                            max_step: 1e-2
                        },
                        energy_change: [
                            { value: -0.001, recorded_dt: '2024-01-01T00:00:00Z' },
                            { value: -0.00001, recorded_dt: '2024-01-01T00:00:01Z' }
                        ],
                        rms_grad: [
                            { value: 0.0002, recorded_dt: '2024-01-01T00:00:00Z' },
                            { value: 0.000005, recorded_dt: '2024-01-01T00:00:01Z' }
                        ],
                        max_grad: [
                            { value: 0.0005, recorded_dt: '2024-01-01T00:00:00Z' },
                            { value: 0.00002, recorded_dt: '2024-01-01T00:00:01Z' }
                        ],
                        rms_step: [
                            { value: 0.01, recorded_dt: '2024-01-01T00:00:00Z' },
                            { value: 0.0005, recorded_dt: '2024-01-01T00:00:01Z' }
                        ],
                        max_step: [
                            { value: 0.02, recorded_dt: '2024-01-01T00:00:00Z' },
                            { value: 0.001, recorded_dt: '2024-01-01T00:00:01Z' }
                        ],
                        scf_energy_steps: [
                            { value: -100.1, recorded_dt: '2024-01-01T00:00:00Z' },
                            { value: -100.2, recorded_dt: '2024-01-01T00:00:01Z' }
                        ]
                    }
                }
            });
            const data = await getOptimizationData(5);
            expect(data.numOptSteps).toBe(2);
            expect(data.scfEnergySteps).toEqual([
                { value: -100.1, recordedAt: '2024-01-01T00:00:00Z' },
                { value: -100.2, recordedAt: '2024-01-01T00:00:01Z' }
            ]);
            expect(data.thresholds.rmsGrad).toBe(1e-5);
            expect(data.energyChange[0]).toEqual({
                value: -0.001,
                recordedAt: '2024-01-01T00:00:00Z'
            });
            expect(data.maxGrad[0].value).toBe(0.0005);
            expect(data.rmsStep).toHaveLength(2);
            expect(data.maxStep[1].value).toBe(0.001);
        });
    });

    describe('url helpers', () => {
        it('builds absolute file and zip URLs', () => {
            expect(fileUrl('/jobs/5/files/a.inp')).toContain('/jobs/5/files/a.inp');
            expect(zipUrl(5)).toContain('/jobs/5/files/zip');
        });
    });
});
