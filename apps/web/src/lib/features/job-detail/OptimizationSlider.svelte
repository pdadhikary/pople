<script lang="ts">
    let {
        stepCount,
        selectedStep,
        onChange
    }: { stepCount: number; selectedStep: number; onChange: (step: number) => void } = $props();

    const disabled = $derived(stepCount < 1);
    const atStart = $derived(selectedStep <= 1);
    const atEnd = $derived(selectedStep >= stepCount);

    function stepBy(delta: number) {
        const next = Math.min(Math.max(selectedStep + delta, 1), Math.max(stepCount, 1));
        onChange(next);
    }
</script>

<div>
    <div class="mb-1 flex items-center justify-between">
        <label for="optimization-slider" class="text-sm font-medium text-slate-700">
            Optimization Step
        </label>
        <span class="text-sm text-slate-600">
            {#if disabled}
                No steps yet
            {:else}
                Step {selectedStep} of {stepCount}
            {/if}
        </span>
    </div>
    <div class="flex items-center gap-2">
        <button
            type="button"
            class="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onclick={() => stepBy(-1)}
            disabled={disabled || atStart}
            aria-label="Previous optimization step"
        >
            ‹
        </button>
        <input
            id="optimization-slider"
            type="range"
            min="1"
            max={Math.max(stepCount, 1)}
            value={selectedStep}
            oninput={(e) => onChange(Number((e.currentTarget as HTMLInputElement).value))}
            {disabled}
            class="w-full accent-slate-800 disabled:opacity-40"
            aria-label="Select optimization step"
        />
        <button
            type="button"
            class="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onclick={() => stepBy(1)}
            disabled={disabled || atEnd}
            aria-label="Next optimization step"
        >
            ›
        </button>
    </div>
</div>
