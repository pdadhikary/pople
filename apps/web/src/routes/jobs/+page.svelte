<script lang="ts">
    import { onMount } from 'svelte';
    import type { Job } from '$lib/types/domain';
    import { getJobs } from '$lib/services/api';
    import { usePolling } from '$lib/services/polling.svelte';
    import JobsTable from '$lib/features/jobs/JobsTable.svelte';
    import JobsFilters, { type StatusFilter } from '$lib/features/jobs/JobsFilters.svelte';
    import Pagination from '$lib/components/Pagination.svelte';
    import Spinner from '$lib/components/Spinner.svelte';
    import EmptyState from '$lib/components/EmptyState.svelte';
    import ErrorState from '$lib/components/ErrorState.svelte';
    import {
        filterJobs,
        JOBS_PAGE_SIZE,
        jobStatusCounts,
        paginateJobs,
        sortJobsNewestFirst
    } from '$lib/features/jobs/jobs-list';

    let loading = $state(true);
    let loadError = $state<string | undefined>();
    let jobs = $state<Job[]>([]);
    let filter = $state<StatusFilter>('all');
    let page = $state(1);

    const counts = $derived(jobStatusCounts(jobs));
    const filtered = $derived(filterJobs(jobs, filter));
    const sorted = $derived(sortJobsNewestFirst(filtered));
    const pages = $derived(Math.max(1, Math.ceil(sorted.length / JOBS_PAGE_SIZE)));
    const pageJobs = $derived(paginateJobs(sorted, page, JOBS_PAGE_SIZE));

    function changeFilter(value: StatusFilter) {
        filter = value;
        page = 1;
    }

    async function load() {
        try {
            const result = await getJobs();
            jobs = result;
            loadError = undefined;
        } catch (e) {
            loadError = e instanceof Error ? e.message : 'Failed to load jobs.';
        } finally {
            loading = false;
        }
    }

    onMount(load);
    usePolling(load);
</script>

<svelte:head><title>Jobs — Pople</title></svelte:head>

<div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
            <h1 class="text-xl font-semibold text-slate-900">Jobs</h1>
            <p class="text-sm text-slate-500">Monitor submitted ORCA geometry optimization jobs.</p>
        </div>
        <a
            href="/jobs/new"
            class="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
        >
            New Job
        </a>
    </div>

    {#if loading}
        <Spinner label="Loading jobs…" />
    {:else if loadError}
        <ErrorState title="Failed to load jobs" message={loadError}>
            {#snippet actions()}
                <button
                    type="button"
                    class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    onclick={load}
                >
                    Retry
                </button>
            {/snippet}
        </ErrorState>
    {:else if jobs.length === 0}
        <EmptyState
            title="No jobs submitted yet"
            description="Submit your first ORCA geometry optimization to get started."
        />
    {:else}
        <JobsFilters {filter} {counts} onChange={changeFilter} />

        {#if sorted.length === 0}
            <EmptyState
                title="No jobs match this filter"
                description={`No jobs with status "${filter}" were found. Try a different filter.`}
            />
        {:else}
            <JobsTable jobs={pageJobs} />
            <Pagination {page} {pages} onChange={(value) => (page = value)} />
        {/if}
    {/if}
</div>
