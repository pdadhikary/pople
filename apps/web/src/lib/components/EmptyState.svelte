<script lang="ts">
    let {
        title = 'Nothing here',
        description = 'There is no data to display for this view.'
    }: { title?: string; description?: string } = $props();
</script>

<div
    class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"
>
    <svg
        class="mb-3 h-10 w-10 text-slate-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
    >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
    <h3 class="text-sm font-semibold text-slate-700">{title}</h3>
    <p class="mt-1 max-w-md text-sm text-slate-500">{description}</p>
</div>
