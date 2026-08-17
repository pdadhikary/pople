<script lang="ts">
    import type { JobStatus, LogEntry } from '$lib/types/domain';
    import EmptyState from '$lib/components/EmptyState.svelte';
    import { formatTime } from '$lib/utils/format';

    let { entries, status }: { entries: LogEntry[]; status: JobStatus } = $props();

    let scrollEl: HTMLDivElement | undefined = $state();
    let stickToBottom = $state(true);

    function handleScroll() {
        if (!scrollEl) return;
        const el = scrollEl;
        stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    }

    $effect(() => {
        if (!scrollEl || !stickToBottom) return;
        scrollEl.scrollTop = scrollEl.scrollHeight;
    });

    const running = $derived(status === 'running');
</script>

<div class="rounded-lg border border-slate-200 bg-white">
    <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
        <h2 class="text-sm font-semibold text-slate-800">ORCA Output</h2>
        <span class="text-xs text-slate-500" role="status" aria-live="polite">
            {#if running}
                <span class="inline-flex items-center gap-1.5 text-sky-700">
                    <span class="h-2 w-2 animate-pulse rounded-full bg-sky-500"></span>
                    Job running — live output
                </span>
            {:else if status === 'finished'}
                <span class="text-emerald-700">Job finished</span>
            {:else if status === 'error'}
                <span class="text-red-600">Job failed</span>
            {:else if status === 'cancelled'}
                <span class="text-amber-600">Job cancelled</span>
            {:else}
                <span class="text-slate-400">Waiting to be executed</span>
            {/if}
        </span>
    </div>

    {#if entries.length === 0}
        <div class="p-4">
            <EmptyState
                title="Log unavailable"
                description={running
                    ? 'Output will appear here shortly.'
                    : 'No output has been generated for this job yet.'}
            />
        </div>
    {:else}
        <div
            bind:this={scrollEl}
            onscroll={handleScroll}
            class="max-h-[70vh] overflow-auto bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-100"
            role="log"
            aria-live="polite"
            aria-label="ORCA job output"
        >
            {#each entries as entry, i (i)}
                <div class="flex gap-3">
                    <span class="shrink-0 text-slate-500 select-none">{formatTime(entry.time)}</span
                    >
                    <span class="break-words whitespace-pre-wrap">{entry.content}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>
