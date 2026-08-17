<script lang="ts">
    import type { JobFile } from '$lib/types/domain';
    import EmptyState from '$lib/components/EmptyState.svelte';
    import FileRow from './FileRow.svelte';

    let { files }: { files: JobFile[] } = $props();
</script>

{#if files.length === 0}
    <EmptyState
        title="No files available"
        description="The job directory is empty. Files will appear as the job progresses."
    />
{:else}
    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50">
                <tr>
                    <th scope="col" class="px-4 py-2.5 text-left font-semibold text-slate-700"
                        >Filename</th
                    >
                    <th scope="col" class="px-4 py-2.5 text-right font-semibold text-slate-700"
                        >Size</th
                    >
                    <th scope="col" class="px-4 py-2.5 text-left font-semibold text-slate-700"
                        >Type</th
                    >
                    <th scope="col" class="px-4 py-2.5 text-right font-semibold text-slate-700"
                        ><span class="sr-only">Download</span></th
                    >
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                {#each files as file (file.filename)}
                    <FileRow {file} />
                {/each}
            </tbody>
        </table>
    </div>
{/if}
