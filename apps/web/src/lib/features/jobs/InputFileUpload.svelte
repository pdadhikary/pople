<script lang="ts">
    let {
        fileName,
        error,
        onFileSelected,
        onClear
    }: {
        fileName: string | null;
        error?: string;
        onFileSelected: (file: File, content: string) => void;
        onClear: () => void;
    } = $props();

    let inputRef: HTMLInputElement | undefined = $state();

    async function handleFile(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const content = await file.text();
        onFileSelected(file, content);
    }

    function clearFile() {
        onClear();
        if (inputRef) inputRef.value = '';
    }
</script>

<div>
    <label for="orca-input-file" class="block text-sm font-medium text-slate-700"
        >ORCA Input File</label
    >
    <input
        id="orca-input-file"
        name="inputFile"
        type="file"
        accept=".inp"
        bind:this={inputRef}
        onchange={handleFile}
        class="mt-1 block w-full max-w-md text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-900"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'orca-file-error' : undefined}
    />
    <p class="mt-1 text-xs text-slate-500">Only .inp files up to 1 MB.</p>
    {#if error}
        <p id="orca-file-error" class="mt-1 text-sm text-red-600" role="alert">{error}</p>
    {/if}
    {#if fileName}
        <div class="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <span class="font-medium">{fileName}</span>
            <button type="button" class="text-xs text-sky-600 hover:underline" onclick={clearFile}>
                Remove
            </button>
        </div>
    {/if}
</div>
