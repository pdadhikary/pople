<script lang="ts">
    import type { GeometryStep } from '$lib/types/domain';
    import LineChart from '$lib/components/LineChart.svelte';
    import {
        activeMeasurements,
        measurementKindLabel,
        measurementSeries,
        type MeasurementKind
    } from './measurements';

    let {
        steps,
        selectedIndices,
        currentStep,
        onClear
    }: {
        steps: GeometryStep[];
        selectedIndices: number[];
        currentStep: number;
        onClear: () => void;
    } = $props();

    const currentAtoms = $derived(steps[currentStep - 1]?.atoms);

    const measurements = $derived(activeMeasurements(currentAtoms, selectedIndices));

    const stepLabels = $derived(steps.map((_, i) => String(i + 1)));

    const chartKinds = $derived(
        (['distance', 'angle', 'dihedral'] as MeasurementKind[]).filter((kind) =>
            measurements.some((m) => m.kind === kind)
        )
    );

    const chartColors: Record<MeasurementKind, string> = {
        distance: '#0284c7',
        angle: '#059669',
        dihedral: '#7c3aed'
    };

    function formatValue(unit: 'Å' | '°', value: number): string {
        if (Number.isNaN(value)) return '--';
        return unit === 'Å' ? value.toFixed(4) : value.toFixed(2);
    }
</script>

<div class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 class="text-sm font-semibold text-slate-800">Measurements</h4>
        <button
            type="button"
            class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onclick={onClear}
        >
            Clear Selection
        </button>
    </div>

    <p class="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
        {#each selectedIndices as index, i (index)}
            {#if i > 0}<span class="text-slate-400">→</span>{/if}
            <span class="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-700">
                {currentAtoms?.[index]
                    ? `${currentAtoms[index].element}${index + 1}`
                    : `?${index + 1}`}
            </span>
        {/each}
        <span class="ml-1 text-xs text-slate-400">step {currentStep}</span>
    </p>

    {#if measurements.length > 0}
        <dl class="mb-4 grid gap-2 sm:grid-cols-3">
            {#each measurements as m (m.kind)}
                <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <dt class="text-xs text-slate-500">
                        {measurementKindLabel(m.kind)}
                        <span class="text-slate-400">{m.label}</span>
                    </dt>
                    <dd class="text-sm font-semibold text-slate-800">
                        {formatValue(m.unit, m.value)}
                        <span class="ml-0.5 text-xs font-normal text-slate-500">{m.unit}</span>
                    </dd>
                </div>
            {/each}
        </dl>
    {/if}

    {#if chartKinds.length > 0}
        <div class="space-y-4">
            {#each chartKinds as kind (kind)}
                {@const label = measurements.find((m) => m.kind === kind)?.label}
                <LineChart
                    title={`${measurementKindLabel(kind)} over steps`}
                    yTitle={measurementKindLabel(kind)}
                    unit={kind === 'distance' ? 'Å' : '°'}
                    height="h-40"
                    labels={stepLabels}
                    datasets={[
                        {
                            label: label ?? measurementKindLabel(kind),
                            values: measurementSeries(steps, selectedIndices, kind),
                            color: chartColors[kind]
                        }
                    ]}
                    xMarker={String(currentStep)}
                />
            {/each}
        </div>
    {/if}
</div>
