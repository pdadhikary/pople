<script lang="ts">
    import type { Job } from '$lib/types/domain';
    import { computeDuration, formatDate, formatDuration } from '$lib/utils/format';
    import Badge from '$lib/components/Badge.svelte';

    let { jobs }: { jobs: Job[] } = $props();
</script>

<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
            <tr>
                <th scope="col" class="px-4 py-2.5 text-left font-semibold text-slate-700"
                    >Job Name</th
                >
                <th scope="col" class="px-4 py-2.5 text-left font-semibold text-slate-700"
                    >Status</th
                >
                <th scope="col" class="px-4 py-2.5 text-left font-semibold text-slate-700"
                    >Submission Date</th
                >
                <th scope="col" class="px-4 py-2.5 text-left font-semibold text-slate-700"
                    >Duration</th
                >
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
            {#each jobs as job (job.id)}
                <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2.5">
                        <a
                            class="font-medium text-slate-900 hover:text-sky-700 hover:underline"
                            href={`/jobs/${job.id}`}
                        >
                            {job.name}
                        </a>
                    </td>
                    <td class="px-4 py-2.5">
                        <Badge status={job.status} />
                    </td>
                    <td class="px-4 py-2.5 text-slate-600">{formatDate(job.queuedAt)}</td>
                    <td class="px-4 py-2.5 text-slate-600"
                        >{formatDuration(computeDuration(job))}</td
                    >
                </tr>
            {/each}
        </tbody>
    </table>
</div>
