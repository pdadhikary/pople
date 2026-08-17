<script lang="ts">
    import type { GeometryData, Job, OptimizationData } from '$lib/types/domain';
    import {
        getGeometryData,
        getJob,
        getJobInputFileText,
        getOptimizationData
    } from '$lib/services/api';
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

    const hasOptSteps = $derived((optData?.optSteps.length ?? 0) > 0);

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

    $effect(() => {
        if (job && (job.status === 'queued' || job.status === 'running')) {
            const id = setInterval(() => {
                void load();
            }, 5000);
            return () => clearInterval(id);
        }
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
                    <ScfEnergyChart values={optData?.scfEnergySteps ?? []} />
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
                    <ConvergenceChart optSteps={optData.optSteps} thresholds={optData.thresholds} />
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
