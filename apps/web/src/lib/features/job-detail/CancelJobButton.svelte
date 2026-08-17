<script lang="ts">
    import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
    import { cancelJob } from '$lib/services/api';

    let { jobId, jobName, onCanceled }: { jobId: number; jobName: string; onCanceled: () => void } =
        $props();

    let open = $state(false);
    let busy = $state(false);
    let error = $state<string | undefined>();

    async function confirm() {
        busy = true;
        error = undefined;
        try {
            await cancelJob(jobId);
            open = false;
            onCanceled();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to cancel job.';
        } finally {
            busy = false;
        }
    }
</script>

<button
    type="button"
    class="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
    onclick={() => (open = true)}
>
    Cancel Job
</button>

{#if error}
    <p class="mt-2 text-sm text-red-600" role="alert">{error}</p>
{/if}

<ConfirmDialog
    {open}
    title="Cancel this job?"
    description={`Job "${jobName}" is still executing. Cancelling will stop the job and preserve all data generated so far. This cannot be undone.`}
    confirmLabel="Cancel Job"
    danger
    {busy}
    onConfirm={confirm}
    onCancel={() => (open = false)}
/>
