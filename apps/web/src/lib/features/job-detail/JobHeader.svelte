<script lang="ts">
    import type { Job } from '$lib/types/domain';
    import Badge from '$lib/components/Badge.svelte';
    import CancelJobButton from './CancelJobButton.svelte';
    import { computeDuration, formatDate, formatDuration } from '$lib/utils/format';

    let { job, numOptSteps }: { job: Job; numOptSteps?: number } = $props();

    const duration = $derived(computeDuration(job));
    const canCancel = $derived(job.status === 'queued' || job.status === 'running');
</script>

<div class="rounded-lg border border-slate-200 bg-white p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-3">
                <h1 class="truncate text-xl font-semibold text-slate-900">{job.name}</h1>
                <Badge status={job.status} />
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                    <dt class="text-slate-500">Submitted</dt>
                    <dd class="font-medium text-slate-800">{formatDate(job.queuedAt)}</dd>
                </div>
                <div>
                    <dt class="text-slate-500">Duration</dt>
                    <dd class="font-mono font-medium text-slate-800">{formatDuration(duration)}</dd>
                </div>
                <div>
                    <dt class="text-slate-500">Optimization Steps</dt>
                    <dd class="font-medium text-slate-800">{numOptSteps ?? '--'}</dd>
                </div>
                <div>
                    <dt class="text-slate-500">Job ID</dt>
                    <dd class="truncate font-mono text-xs text-slate-500">{job.id}</dd>
                </div>
            </dl>
            {#if job.status === 'error'}
                <p class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    This job failed to complete.
                </p>
            {/if}
            {#if job.status === 'cancelled'}
                <p
                    class="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700"
                    role="status"
                >
                    This job was cancelled.
                </p>
            {/if}
        </div>

        <div class="flex shrink-0 items-center gap-2">
            <a
                href={`/jobs/${job.id}/log`}
                class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
                View Log
            </a>
            <a
                href={`/jobs/${job.id}/files`}
                class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
                View Files
            </a>
            {#if canCancel}
                <CancelJobButton jobId={job.id} jobName={job.name} onCanceled={() => {}} />
            {/if}
        </div>
    </div>
</div>
