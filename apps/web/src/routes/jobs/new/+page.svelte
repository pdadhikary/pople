<script lang="ts">
    import { goto } from '$app/navigation';
    import { validateInputFile, validateJobName } from '$lib/utils/validation';
    import { submitJob } from '$lib/services/api';
    import JobNameInput from '$lib/features/jobs/JobNameInput.svelte';
    import InputFileUpload from '$lib/features/jobs/InputFileUpload.svelte';
    import CodeViewer from '$lib/components/CodeViewer.svelte';

    let name = $state('');
    let nameError = $state<string | undefined>();
    let fileName = $state<string | null>(null);
    let fileContent = $state('');
    let selectedFile = $state<File | null>(null);
    let fileError = $state<string | undefined>();
    let submitting = $state(false);
    let submitError = $state<string | undefined>();

    function handleFileSelected(file: File, content: string) {
        fileName = file.name;
        fileContent = content;
        selectedFile = file;
        const check = validateInputFile(file);
        fileError = check.valid ? undefined : check.message;
    }

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        const nameCheck = validateJobName(name);
        nameError = nameCheck.valid ? undefined : nameCheck.message;

        if (!fileName || !selectedFile) {
            fileError = 'An ORCA input file (.inp) is required.';
        }

        if (nameError || fileError || submitting || !selectedFile) return;

        submitting = true;
        submitError = undefined;
        try {
            const job = await submitJob(name.trim(), selectedFile);
            await goto(`/jobs/${job.id}`);
        } catch (e) {
            submitError = e instanceof Error ? e.message : 'Submission failed.';
            submitting = false;
        }
    }
</script>

<svelte:head><title>New Job — Pople</title></svelte:head>

<div class="mx-auto max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">Submit an ORCA Job</h1>
    <p class="mt-1 text-sm text-slate-500">
        Upload an ORCA input file to queue a geometry optimization. The job will be placed in the
        queue and executed by the remote machine.
    </p>

    <form class="mt-6 space-y-5" onsubmit={handleSubmit} novalidate>
        <JobNameInput value={name} error={nameError} onChange={(value) => (name = value)} />

        <InputFileUpload
            {fileName}
            error={fileError}
            onFileSelected={handleFileSelected}
            onClear={() => {
                fileName = null;
                fileContent = '';
                selectedFile = null;
                fileError = undefined;
            }}
        />

        {#if fileContent}
            <div>
                <h2 class="mb-2 text-sm font-medium text-slate-700">File Preview</h2>
                <CodeViewer content={fileContent} label="ORCA input file preview" />
            </div>
        {/if}

        {#if submitError}
            <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {submitError}
            </p>
        {/if}

        <div class="flex items-center gap-3">
            <button
                type="submit"
                class="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                disabled={submitting}
            >
                {submitting ? 'Submitting…' : 'Submit Job'}
            </button>
            <a href="/jobs" class="text-sm text-slate-600 hover:underline">Cancel</a>
        </div>
    </form>
</div>
