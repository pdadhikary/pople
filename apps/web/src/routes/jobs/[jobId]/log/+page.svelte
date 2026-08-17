<script lang="ts">
    import type { Job } from '$lib/types/domain';
    import { getJob } from '$lib/services/api';
    import LogStream from '$lib/features/job-log/LogStream.svelte';
    import Spinner from '$lib/components/Spinner.svelte';
    import EmptyState from '$lib/components/EmptyState.svelte';
    import ErrorState from '$lib/components/ErrorState.svelte';

    let { params } = $props();

    const jobId = $derived(Number(params.jobId));

    let job = $state<Job | undefined>();
    let loading = $state(true);
    let notFound = $state(false);
    let loadError = $state<string | undefined>();

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

<svelte:head><title>{job ? `Log — ${job.name}` : 'Log — Pople'}</title></svelte:head>

{#if loading}
    <Spinner label="Loading log…" />
{:else if loadError}
    <ErrorState title="Failed to load log" message={loadError} />
{:else if notFound || !job}
    <EmptyState title="Job not found" description="No job exists with that ID." />
    <div class="mt-4">
        <a href="/jobs" class="text-sm text-sky-700 hover:underline">← Back to all jobs</a>
    </div>
{:else}
    <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-900">Job Log</h1>
                <p class="text-sm text-slate-500">
                    <a href={`/jobs/${job.id}`} class="hover:underline">{job.name}</a>
                </p>
            </div>
            <div class="flex items-center gap-2">
                <a
                    href={`/jobs/${job.id}`}
                    class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Dashboard
                </a>
                <a
                    href={`/jobs/${job.id}/files`}
                    class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Files
                </a>
            </div>
        </div>
        <LogStream entries={[]} status={job.status} />
    </div>
{/if}
