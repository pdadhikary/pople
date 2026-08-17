<script lang="ts">
    import LineChart from '$lib/components/LineChart.svelte';

    let { values }: { values: number[] } = $props();

    const labels = $derived(values.map((_, i) => String(i + 1)));
</script>

<LineChart
    title="SCF Energy"
    yTitle="SCF Energy"
    unit="Eh"
    {labels}
    datasets={[{ label: 'SCF Energy', values, color: '#0284c7' }]}
/>
