<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { GeometryData, Job, OptimizationData } from '$lib/types/domain';
    import {
        getGeometryData,
        getJob,
        getJobInputFileText,
        getOptimizationData
    } from '$lib/services/api';
    import { openJobSocket, type JobWsMessage } from '$lib/services/ws.svelte';
    import JobHeader from '$lib/features/job-detail/JobHeader.svelte';
    import ScfEnergyChart from '$lib/features/job-detail/ScfEnergyChart.svelte';
    import ConvergenceChart from '$lib/features/job-detail/ConvergenceChart.svelte';
    import GeometryPanel from '$lib/features/job-detail/GeometryPanel.svelte';
    import CodeViewer from '$lib/components/CodeViewer.svelte';
    import Spinner from '$lib/components/Spinner.svelte';
    import EmptyState from '$lib/components/EmptyState.svelte';
    import ErrorState from '$lib/components/ErrorState.svelte';

    let { params } = $props();

    const jobId = $derived(Number(params.jobId));

    let job = $state<Job | undefined>();
    let optData = $state<OptimizationData | undefined>();
    let geometry = $state<GeometryData | undefined>();
    let inputText = $state('');
    let loading = $state(true);
    let notFound = $state(false);
    let loadError = $state<string | undefined>();

    const hasOptSteps = $derived((optData?.numOptSteps ?? 0) > 0);

    async function load() {
        if (Number.isNaN(jobId)) {
            loading = false;
            notFound = true;
            return;
        }
        try {
            const found = await getJob(jobId);
            job = found;
            notFound = false;
            loadError = undefined;
            try {
                const [opt, geo, input] = await Promise.all([
                    getOptimizationData(jobId),
                    getGeometryData(jobId),
                    getJobInputFileText(jobId, found.name).catch(() => '')
                ]);
                optData = opt;
                geometry = geo;
                inputText = input;
            } catch {
                // optimization/geometry/files data is best-effort
            }
        } catch (e) {
            job = undefined;
            notFound = e instanceof Error && 'status' in e && e.status === 404;
            loadError = notFound
                ? undefined
                : e instanceof Error
                  ? e.message
                  : 'Failed to load job.';
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loading = true;
        job = undefined;
        optData = undefined;
        geometry = undefined;
        inputText = '';
        notFound = false;
        loadError = undefined;
        void load();
    });

    // Live updates via WebSocket: apply incremental status/metric/geometry changes.
    let socket: WebSocket | undefined;

    $effect(() => {
        if (!job || (job.status !== 'queued' && job.status !== 'running')) return;
        if (socket) return;

        socket = openJobSocket(jobId, (message) => {
            if (message.type === 'job_status_changed') {
                job = {
                    ...job!,
                    status: message.job_status ?? job!.status,
                    queuedAt: message.queued_dt ?? job!.queuedAt,
                    startedAt: message.started_dt ?? job!.startedAt,
                    finishedAt: message.finished_dt ?? job!.finishedAt
                };
            } else if (message.type === 'new_metric') {
                applyMetric(message);
            } else if (message.type === 'new_geometry') {
                applyGeometry(message);
            }
        });
    });

    function applyMetric(message: JobWsMessage) {
        if (!optData || message.metric_type === undefined || message.value === undefined) return;
        const series = metricSeries(message.metric_type);
        if (!series) return;
        series.push({ value: message.value, recordedAt: message.recorded_dt ?? '' });
        // Recompute step count from the longest series (convergence metrics grow in lockstep).
        const longest = Math.max(
            optData.energyChange.length,
            optData.rmsGrad.length,
            optData.maxGrad.length,
            optData.rmsStep.length,
            optData.maxStep.length
        );
        optData = { ...optData, numOptSteps: longest };
    }

    function metricSeries(type: string): { value: number; recordedAt: string }[] | undefined {
        switch (type) {
            case 'energy_change':
                return optData?.energyChange;
            case 'rms_grad':
                return optData?.rmsGrad;
            case 'max_grad':
                return optData?.maxGrad;
            case 'rms_step':
                return optData?.rmsStep;
            case 'max_step':
                return optData?.maxStep;
            case 'total_scf_energy':
                return optData?.scfEnergySteps;
            default:
                return undefined;
        }
    }

    function applyGeometry(message: JobWsMessage) {
        if (!geometry || !message.atoms) return;
        geometry = {
            ...geometry,
            numSteps: geometry.numSteps + 1,
            steps: [
                ...geometry.steps,
                { atoms: message.atoms, recordedAt: message.recorded_dt ?? '' }
            ]
        };
    }

    // Close the socket once the job reaches a terminal state.
    $effect(() => {
        if (job && job.status !== 'queued' && job.status !== 'running' && socket) {
            socket.close();
            socket = undefined;
        }
    });

    // Keep the REST polling as a full-snapshot fallback (re-syncs if the WS drops).
    $effect(() => {
        if (job && (job.status === 'queued' || job.status === 'running')) {
            const id = setInterval(() => {
                void load();
            }, 5000);
            return () => clearInterval(id);
        }
    });

    onDestroy(() => {
        socket?.close();
    });
</script>

<svelte:head><title>{job ? `${job.name} — Pople` : 'Job — Pople'}</title></svelte:head>

{#if loading}
    <Spinner label="Loading job…" />
{:else if loadError}
    <ErrorState title="Failed to load job" message={loadError} />
{:else if notFound || !job}
    <EmptyState
        title="Job not found"
        description="No job exists with that ID. It may have been removed or the link may be incorrect."
    ></EmptyState>
    <div class="mt-4">
        <a href="/jobs" class="text-sm text-sky-700 hover:underline">← Back to all jobs</a>
    </div>
{:else}
    <div class="space-y-6">
        <div>
            <a href="/jobs" class="text-sm text-slate-600 hover:underline">← All jobs</a>
        </div>

        <JobHeader {job} numOptSteps={optData?.numOptSteps} />

        <div class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-lg border border-slate-200 bg-white p-4">
                <h3 class="mb-3 text-sm font-semibold text-slate-800">SCF Energy</h3>
                {#if hasOptSteps}
                    <ScfEnergyChart values={optData?.scfEnergySteps.map((m) => m.value) ?? []} />
                {:else}
                    <EmptyState
                        title="No optimization data available"
                        description="SCF energies will appear once the optimization begins producing steps."
                    />
                {/if}
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-4">
                <h3 class="mb-3 text-sm font-semibold text-slate-800">Convergence</h3>
                {#if hasOptSteps && optData}
                    <ConvergenceChart
                        energyChange={optData.energyChange}
                        rmsGrad={optData.rmsGrad}
                        maxGrad={optData.maxGrad}
                        rmsStep={optData.rmsStep}
                        maxStep={optData.maxStep}
                        thresholds={optData.thresholds}
                    />
                {:else}
                    <EmptyState
                        title="No optimization data available"
                        description="Convergence values will appear once the optimization begins producing steps."
                    />
                {/if}
            </div>
        </div>

        <GeometryPanel {geometry} jobName={job.name} />

        <div class="rounded-lg border border-slate-200 bg-white p-4">
            <h3 class="mb-3 text-sm font-semibold text-slate-800">Input File</h3>
            {#if inputText}
                <CodeViewer content={inputText} label="ORCA input file" />
            {:else}
                <EmptyState
                    title="Input file unavailable"
                    description="The input file could not be loaded for this job."
                />
            {/if}
        </div>
    </div>
{/if}
