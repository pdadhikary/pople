<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';

    Chart.register(...registerables);

    export interface ChartDataset {
        label: string;
        values: (number | null)[];
        color: string;
        fill?: boolean;
    }

    let {
        labels,
        datasets,
        title,
        yTitle,
        unit,
        legend = false,
        baseline
    }: {
        labels: string[];
        datasets: ChartDataset[];
        title: string;
        yTitle: string;
        unit?: string;
        legend?: boolean;
        baseline?: number;
    } = $props();

    let canvas: HTMLCanvasElement | undefined = $state();
    let chart: Chart | undefined = $state();
    let unavailable = $state(false);

    const baselinePlugin = {
        id: 'baselineLine',
        afterDraw(chartEl: Chart) {
            if (baseline === undefined) return;
            const ctx = chartEl.ctx;
            const scale = chartEl.scales.y;
            if (!scale) return;
            const y = scale.getPixelForValue(baseline);
            ctx.save();
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(chartEl.chartArea.left, y);
            ctx.lineTo(chartEl.chartArea.right, y);
            ctx.stroke();
            ctx.restore();
        }
    };

    onMount(() => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            unavailable = true;
            return;
        }
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: datasets.map((d) => ({
                    label: d.label,
                    data: [...d.values],
                    borderColor: d.color,
                    backgroundColor: d.fill === false ? d.color : d.color + '22',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.25,
                    spanGaps: false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 200 },
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { title: { display: true, text: 'Optimization Step' } },
                    y: { title: { display: true, text: unit ? `${yTitle} (${unit})` : yTitle } }
                },
                plugins: {
                    legend: { display: legend },
                    tooltip: {
                        callbacks: {
                            title: (items) => `Optimization Step ${items[0]?.label}`,
                            label: (item) =>
                                `${item.dataset.label}: ${
                                    item.parsed.y === null
                                        ? 'n/a'
                                        : Number(item.parsed.y).toPrecision(6)
                                }`
                        }
                    }
                }
            },
            plugins: [baselinePlugin]
        });
    });

    $effect(() => {
        if (!chart) return;
        chart.data.labels = [...labels];
        chart.data.datasets.forEach((dataset, i) => {
            dataset.data = [...(datasets[i]?.values ?? [])];
        });
        chart.update();
    });

    onDestroy(() => {
        chart?.destroy();
        chart = undefined;
    });
</script>

<div class="relative h-64 w-full">
    {#if unavailable}
        <p class="flex h-full items-center justify-center text-sm text-slate-400">
            Chart unavailable
        </p>
    {:else}
        <canvas bind:this={canvas} aria-label={title}></canvas>
    {/if}
</div>
