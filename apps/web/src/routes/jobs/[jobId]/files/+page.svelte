<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { Job, JobFile } from '$lib/types/domain';
    import { getJob, getJobFiles } from '$lib/services/api';
    import { openJobSocket } from '$lib/services/ws.svelte';
    import FileList from '$lib/features/job-files/FileList.svelte';
    import DownloadAllButton from '$lib/features/job-files/DownloadAllButton.svelte';
    import Spinner from '$lib/components/Spinner.svelte';
    import EmptyState from '$lib/components/EmptyState.svelte';
    import ErrorState from '$lib/components/ErrorState.svelte';

    let { params } = $props();

    const jobId = $derived(Number(params.jobId));

    let job = $state<Job | undefined>();
    let files = $state<JobFile[]>([]);
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
            try {
                files = await getJobFiles(jobId);
            } catch {
                files = [];
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
        files = [];
        notFound = false;
        loadError = undefined;
        void load();
    });

    // Live status updates via WebSocket (files listing itself is REST-polled).
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
            }
        });
    });

    // Close the socket once the job reaches a terminal state.
    $effect(() => {
        if (job && job.status !== 'queued' && job.status !== 'running' && socket) {
            socket.close();
            socket = undefined;
        }
    });

    // Keep REST polling as a full-snapshot fallback for the file listing.
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

<svelte:head><title>{job ? `Files — ${job.name}` : 'Files — Pople'}</title></svelte:head>

{#if loading}
    <Spinner label="Loading files…" />
{:else if loadError}
    <ErrorState title="Failed to load files" message={loadError} />
{:else if notFound || !job}
    <EmptyState title="Job not found" description="No job exists with that ID." />
    <div class="mt-4">
        <a href="/jobs" class="text-sm text-sky-700 hover:underline">← Back to all jobs</a>
    </div>
{:else}
    <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-900">Job Files</h1>
                <p class="text-sm text-slate-500">
                    <a href={`/jobs/${job.id}`} class="hover:underline">{job.name}</a>
                    <span class="text-slate-400"> · read-only directory</span>
                </p>
            </div>
            <div class="flex items-center gap-2">
                <DownloadAllButton jobId={job.id} disabled={files.length === 0} />
                <a
                    href={`/jobs/${job.id}/output`}
                    class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    View Output
                </a>
            </div>
        </div>
        <FileList {files} />
    </div>
{/if}
