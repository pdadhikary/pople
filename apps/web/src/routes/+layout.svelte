<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { page } from '$app/state';

    let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /><title>Pople — ORCA Job Monitor</title></svelte:head>

<div class="flex min-h-screen flex-col bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
        <nav
            class="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6"
            aria-label="Main navigation"
        >
            <a href="/jobs" class="flex items-center gap-2 text-slate-900">
                <svg
                    class="h-6 w-6 text-sky-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
                    <ellipse cx="12" cy="12" rx="10" ry="4.5" />
                    <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
                </svg>
                <span class="text-base font-semibold">Pople</span>
                <span
                    class="hidden rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500 sm:inline"
                >
                    ORCA job monitor
                </span>
            </a>
            <div class="ml-auto flex items-center gap-1">
                <a
                    href="/jobs"
                    class="rounded-md px-3 py-1.5 text-sm font-medium {page.url.pathname === '/jobs'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
                    aria-current={page.url.pathname === '/jobs' ? 'page' : undefined}
                >
                    Jobs
                </a>
                <a
                    href="/jobs/new"
                    class="rounded-md px-3 py-1.5 text-sm font-medium {page.url.pathname.startsWith(
                        '/jobs/new'
                    )
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
                    aria-current={page.url.pathname.startsWith('/jobs/new') ? 'page' : undefined}
                >
                    New Job
                </a>
            </div>
        </nav>
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {@render children()}
    </main>

    <footer class="border-t border-slate-200 bg-white py-3">
        <p class="mx-auto max-w-7xl px-4 text-xs text-slate-400 sm:px-6">
            Pople · ORCA geometry optimization job orchestration
        </p>
    </footer>
</div>
