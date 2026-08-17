<script lang="ts">
    let {
        page,
        pages,
        onChange
    }: { page: number; pages: number; onChange: (page: number) => void } = $props();

    const pageList = $derived.by(() => {
        if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
        const result: (number | 'ellipsis')[] = [1];
        if (page > 3) result.push('ellipsis');
        const start = Math.max(2, page - 1);
        const end = Math.min(pages - 1, page + 1);
        for (let i = start; i <= end; i++) result.push(i);
        if (page < pages - 2) result.push('ellipsis');
        result.push(pages);
        return result;
    });
</script>

{#if pages > 1}
    <nav class="flex items-center justify-between gap-2" aria-label="Pagination">
        <span class="text-xs text-slate-500">
            Page {page} of {pages}
        </span>
        <div class="flex items-center gap-1">
            <button
                type="button"
                class="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                onclick={() => onChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
            >
                ‹
            </button>
            {#each pageList as p (p === 'ellipsis' ? `ellipsis-${page}` : p)}
                {#if p === 'ellipsis'}
                    <span class="px-1 text-slate-400">…</span>
                {:else}
                    <button
                        type="button"
                        class="rounded-md border px-2.5 py-1 text-sm {p === page
                            ? 'border-slate-800 bg-slate-800 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}"
                        onclick={() => onChange(p)}
                        aria-current={p === page ? 'page' : undefined}
                        aria-label={`Page ${p}`}
                    >
                        {p}
                    </button>
                {/if}
            {/each}
            <button
                type="button"
                class="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                onclick={() => onChange(Math.min(pages, page + 1))}
                disabled={page >= pages}
                aria-label="Next page"
            >
                ›
            </button>
        </div>
    </nav>
{/if}
