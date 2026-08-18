<script lang="ts">
    import type { Metric, Thresholds } from '$lib/types/domain';
    import LineChart from '$lib/components/LineChart.svelte';

    let {
        energyChange,
        rmsGrad,
        maxGrad,
        rmsStep,
        maxStep,
        thresholds
    }: {
        energyChange: Metric[];
        rmsGrad: Metric[];
        maxGrad: Metric[];
        rmsStep: Metric[];
        maxStep: Metric[];
        thresholds: Thresholds;
    } = $props();

    const labels = $derived(energyChange.map((_, i) => String(i + 1)));

    /** log10(|value| / threshold): 0 = exactly at threshold, < 0 = converged. */
    function ratio(series: Metric[], threshold: number): (number | null)[] {
        if (threshold <= 0) return series.map(() => null);
        return series.map((metric) => {
            const value = Math.abs(metric.value);
            if (value === 0) return null;
            return Math.log10(value / threshold);
        });
    }

    const datasets = $derived([
        {
            label: 'Energy change',
            values: ratio(energyChange, thresholds.energyChange),
            color: '#0284c7'
        },
        {
            label: 'RMS gradient',
            values: ratio(rmsGrad, thresholds.rmsGrad),
            color: '#d97706'
        },
        {
            label: 'MAX gradient',
            values: ratio(maxGrad, thresholds.maxGrad),
            color: '#dc2626'
        },
        {
            label: 'RMS step',
            values: ratio(rmsStep, thresholds.rmsStep),
            color: '#16a34a'
        },
        {
            label: 'MAX step',
            values: ratio(maxStep, thresholds.maxStep),
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
