<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { GeometryData } from '$lib/types/domain';
    import MolecularViewer from './MolecularViewer.svelte';
    import CoordinateTable from './CoordinateTable.svelte';
    import OptimizationSlider from './OptimizationSlider.svelte';
    import MeasurementPanel from './MeasurementPanel.svelte';
    import EmptyState from '$lib/components/EmptyState.svelte';
    import { toXyz } from './xyz';

    let { geometry, jobName }: { geometry: GeometryData | undefined; jobName: string } = $props();

    let selectedStep = $state(1);
    let copied = $state(false);
    let selectedIndices = $state<number[]>([]);

    function toggleAtom(index: number) {
        if (selectedIndices.includes(index)) {
            selectedIndices = selectedIndices.filter((i) => i !== index);
        } else if (selectedIndices.length < 4) {
            selectedIndices = [...selectedIndices, index];
        }
    }

    function clearSelection() {
        selectedIndices = [];
    }

    const numSteps = $derived(geometry?.steps.length ?? 0);
    const hasSteps = $derived(numSteps > 0);
    const selectedIndex = $derived(
        hasSteps ? Math.min(Math.max(selectedStep - 1, 0), numSteps - 1) : -1
    );
    const selectedAtoms = $derived(
        geometry && selectedIndex >= 0 ? geometry.steps[selectedIndex].atoms : undefined
    );

    // Stick-to-end: default to the latest step on first load, and keep following
    // the latest step while running if the user hasn't stepped back.
    let lastKnownCount = $state(0);
    $effect(() => {
        if (numSteps === 0) {
            lastKnownCount = 0;
            return;
        }
        if (lastKnownCount === 0) {
            selectedStep = numSteps;
        } else if (selectedStep === lastKnownCount) {
            selectedStep = numSteps;
        }
        lastKnownCount = numSteps;
    });

    let copiedTimer: ReturnType<typeof setTimeout> | undefined;

    function handleCopy() {
        if (!selectedAtoms) return;
        navigator.clipboard
            ?.writeText(toXyz(jobName, selectedAtoms))
            .then(() => {
                copied = true;
                if (copiedTimer) clearTimeout(copiedTimer);
                copiedTimer = setTimeout(() => (copied = false), 1500);
            })
            .catch(() => {
                copied = false;
            });
    }

    onDestroy(() => {
        if (copiedTimer) clearTimeout(copiedTimer);
    });
</script>

<div class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-slate-800">Molecular Geometry</h3>
        <button
            type="button"
            class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onclick={handleCopy}
            disabled={!hasSteps}
        >
            {copied ? 'Copied!' : 'Copy XYZ'}
        </button>
    </div>

    {#if !hasSteps}
        <EmptyState
            title="No geometry available"
            description="Atomic coordinates will appear once the optimization begins producing steps."
        />
    {:else}
        <div class="mb-4">
            <OptimizationSlider
                stepCount={numSteps}
                {selectedStep}
                onChange={(step) => (selectedStep = step)}
            />
        </div>
        <div class="grid gap-6 lg:grid-cols-5">
            <div class="lg:col-span-3">
                <MolecularViewer
                    moleculeName={jobName}
                    atoms={selectedAtoms}
                    {selectedIndices}
                    onAtomToggle={toggleAtom}
                />
            </div>
            <div class="lg:col-span-2">
                <h4 class="mb-3 text-sm font-semibold text-slate-800">Molecular Coordinates</h4>
                <CoordinateTable
                    coordinates={selectedAtoms}
                    {selectedIndices}
                    onAtomToggle={toggleAtom}
                />
            </div>
        </div>

        {#if selectedIndices.length >= 2 && geometry}
            <div class="mt-6">
                <MeasurementPanel
                    steps={geometry.steps}
                    {selectedIndices}
                    currentStep={selectedStep}
                    onClear={clearSelection}
                />
            </div>
        {/if}
    {/if}
</div>
