<script lang="ts">
    import type { OptimizationStep, Thresholds } from '$lib/types/domain';
    import LineChart from '$lib/components/LineChart.svelte';

    let { optSteps, thresholds }: { optSteps: OptimizationStep[]; thresholds: Thresholds } =
        $props();

    const labels = $derived(optSteps.map((_, i) => String(i + 1)));

    /** log10(|value| / threshold): 0 = exactly at threshold, < 0 = converged. */
    function ratio(
        values: (step: OptimizationStep) => number,
        threshold: number
    ): (number | null)[] {
        if (threshold <= 0) return optSteps.map(() => null);
        return optSteps.map((step) => {
            const value = Math.abs(values(step));
            if (value === 0) return null;
            return Math.log10(value / threshold);
        });
    }

    const datasets = $derived([
        {
            label: 'Energy change',
            values: ratio((s) => s.energyChange, thresholds.energyChange),
            color: '#0284c7'
        },
        {
            label: 'RMS gradient',
            values: ratio((s) => s.rmsGrad, thresholds.rmsGrad),
            color: '#d97706'
        },
        {
            label: 'MAX gradient',
            values: ratio((s) => s.maxGrad, thresholds.maxGrad),
            color: '#dc2626'
        },
        {
            label: 'RMS step',
            values: ratio((s) => s.rmsStep, thresholds.rmsStep),
            color: '#16a34a'
        },
        {
            label: 'MAX step',
            values: ratio((s) => s.maxStep, thresholds.maxStep),
            color: '#7c3aed'
        }
    ]);
</script>

<LineChart
    title="Convergence (log10 |value / threshold|)"
    yTitle="log10 (value / threshold)"
    {labels}
    {datasets}
    legend
    baseline={0}
/>
