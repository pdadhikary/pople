<script lang="ts">
    let {
        open,
        title = 'Are you sure?',
        description = 'This action cannot be undone.',
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        danger = false,
        busy = false,
        onConfirm,
        onCancel
    }: {
        open: boolean;
        title?: string;
        description?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        danger?: boolean;
        busy?: boolean;
        onConfirm: () => void;
        onCancel: () => void;
    } = $props();

    function handleKeydown(event: KeyboardEvent) {
        if (!open) return;
        if (event.key === 'Escape') onCancel();
    }
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        aria-labelledby="confirm-dialog-title"
        onkeydown={handleKeydown}
    >
        <div class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="confirm-dialog-title" class="text-base font-semibold text-slate-900">
                {title}
            </h3>
            <p class="mt-2 text-sm text-slate-600">{description}</p>
            <div class="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onclick={onCancel}
                    disabled={busy}
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    class="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 {danger
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-slate-800 hover:bg-slate-900'}"
                    onclick={onConfirm}
                    disabled={busy}
                >
                    {busy ? 'Working…' : confirmLabel}
                </button>
            </div>
        </div>
    </div>
{/if}
