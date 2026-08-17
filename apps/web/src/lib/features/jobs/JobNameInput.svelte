<script lang="ts">
    let {
        value,
        error,
        onChange
    }: { value: string; error?: string; onChange: (value: string) => void } = $props();
</script>

<div>
    <label for="job-name" class="block text-sm font-medium text-slate-700">Job Name</label>
    <input
        id="job-name"
        name="jobName"
        type="text"
        {value}
        oninput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
        class="mt-1 block w-full max-w-md rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 {error
            ? 'border-red-400'
            : ''}"
        placeholder="e.g. benzene-opt"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'job-name-error' : undefined}
    />
    <p class="mt-1 text-xs text-slate-500">
        Letters, numbers, hyphens and underscores only. No spaces.
    </p>
    {#if error}
        <p id="job-name-error" class="mt-1 text-sm text-red-600" role="alert">{error}</p>
    {/if}
</div>
