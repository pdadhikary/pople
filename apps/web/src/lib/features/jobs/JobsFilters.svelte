<script lang="ts">
    import type { JobStatus } from '$lib/types/domain';

    export type StatusFilter = 'all' | JobStatus;

    const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'queued', label: 'Queued' },
        { value: 'running', label: 'Running' },
        { value: 'finished', label: 'Finished' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'error', label: 'Error' }
    ];

    let {
        filter,
        counts,
        onChange
    }: {
        filter: StatusFilter;
        counts: Record<StatusFilter, number>;
        onChange: (filter: StatusFilter) => void;
    } = $props();
</script>

<div class="flex flex-wrap items-center gap-2">
    <span class="text-sm font-medium text-slate-700">Status:</span>
    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {#each STATUS_OPTIONS as option (option.value)}
            <button
                type="button"
                class="rounded-full border px-3 py-1 text-sm {filter === option.value
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}"
                aria-pressed={filter === option.value}
                onclick={() => onChange(option.value)}
            >
                {option.label}
                <span class="ml-1 text-xs opacity-70">({counts[option.value]})</span>
            </button>
        {/each}
    </div>
</div>
