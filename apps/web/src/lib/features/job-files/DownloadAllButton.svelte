<script lang="ts">
    import { zipUrl } from '$lib/services/api';

    let { jobId, disabled = false }: { jobId: number; disabled?: boolean } = $props();

    let error = $state<string | undefined>();

    function handleDownloadAll() {
        error = undefined;
        try {
            window.location.href = zipUrl(jobId);
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to download ZIP.';
        }
    }
</script>

<div>
    <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        onclick={handleDownloadAll}
        {disabled}
    >
        Download All as ZIP
    </button>
    {#if error}
        <p class="mt-2 text-sm text-red-600" role="alert">{error}</p>
    {/if}
</div>
