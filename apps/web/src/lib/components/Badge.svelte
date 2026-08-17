<script lang="ts">
    import type { JobStatus } from '$lib/types/domain';

    interface StatusConfig {
        label: string;
        badgeClass: string;
        iconClass: string;
    }

    const STATUS_CONFIG: Record<JobStatus, StatusConfig> = {
        queued: {
            label: 'Queued',
            badgeClass: 'bg-slate-100 text-slate-700 ring-slate-300',
            iconClass: 'text-slate-500'
        },
        running: {
            label: 'Running',
            badgeClass: 'bg-sky-50 text-sky-700 ring-sky-300',
            iconClass: 'text-sky-500'
        },
        finished: {
            label: 'Finished',
            badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
            iconClass: 'text-emerald-500'
        },
        cancelled: {
            label: 'Cancelled',
            badgeClass: 'bg-amber-50 text-amber-700 ring-amber-300',
            iconClass: 'text-amber-500'
        },
        error: {
            label: 'Error',
            badgeClass: 'bg-red-50 text-red-700 ring-red-300',
            iconClass: 'text-red-500'
        }
    };

    let { status }: { status: JobStatus } = $props();

    const config = $derived(STATUS_CONFIG[status]);
</script>

<span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset {config.badgeClass}"
    role="status"
>
    {#if status === 'running'}
        <svg
            class="h-3 w-3 animate-spin {config.iconClass}"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            />
            <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
        </svg>
    {:else if status === 'finished'}
        <svg
            class="h-3 w-3 {config.iconClass}"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clip-rule="evenodd"
            />
        </svg>
    {:else if status === 'queued'}
        <svg
            class="h-3 w-3 {config.iconClass}"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clip-rule="evenodd"
            />
        </svg>
    {:else if status === 'cancelled'}
        <svg
            class="h-3 w-3 {config.iconClass}"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
            />
        </svg>
    {:else}
        <svg
            class="h-3 w-3 {config.iconClass}"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                fill-rule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clip-rule="evenodd"
            />
        </svg>
    {/if}
    {config.label}
</span>
