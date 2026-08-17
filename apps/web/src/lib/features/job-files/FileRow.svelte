<script lang="ts">
    import type { JobFile } from '$lib/types/domain';
    import { fileUrl } from '$lib/services/api';
    import { formatFileSize } from '$lib/utils/format';

    let { file }: { file: JobFile } = $props();

    const kind = $derived(file.filename.toLowerCase().endsWith('.inp') ? 'input' : 'output');
</script>

<tr class="hover:bg-slate-50">
    <td class="px-4 py-2.5">
        <span class="inline-flex items-center gap-2 font-mono text-sm text-slate-800">
            <svg
                class="h-4 w-4 shrink-0 text-slate-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
            >
                <path
                    fill-rule="evenodd"
                    d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                    clip-rule="evenodd"
                />
            </svg>
            {file.filename}
        </span>
    </td>
    <td class="px-4 py-2.5 text-right text-slate-500">{formatFileSize(file.size)}</td>
    <td class="px-4 py-2.5">
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{kind}</span>
    </td>
    <td class="px-4 py-2.5 text-right">
        <a
            href={fileUrl(file.downloadPath)}
            download={file.filename}
            class="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
            Download
        </a>
    </td>
</tr>
