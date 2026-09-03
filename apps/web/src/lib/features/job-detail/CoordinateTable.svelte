<script lang="ts">
    import type { Atom } from '$lib/types/domain';
    import { formatCoordinate } from '$lib/utils/format';

    let {
        coordinates,
        selectedIndices = [],
        onAtomToggle
    }: {
        coordinates?: Atom[];
        selectedIndices?: number[];
        onAtomToggle?: (index: number) => void;
    } = $props();

    const selectable = $derived(!!onAtomToggle);

    function handleToggle(index: number, event: MouseEvent) {
        event.stopPropagation();
        onAtomToggle?.(index);
    }
</script>

<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
            <tr>
                <th scope="col" class="px-4 py-2 text-left font-semibold text-slate-700">#</th>
                <th scope="col" class="px-4 py-2 text-left font-semibold text-slate-700">Atom</th>
                <th scope="col" class="px-4 py-2 text-right font-semibold text-slate-700">X</th>
                <th scope="col" class="px-4 py-2 text-right font-semibold text-slate-700">Y</th>
                <th scope="col" class="px-4 py-2 text-right font-semibold text-slate-700">Z</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
            {#each coordinates ?? [] as atom, i (i)}
                {@const selected = selectedIndices.includes(i)}
                <tr
                    class={selected
                        ? 'cursor-pointer bg-orange-50'
                        : selectable
                          ? 'cursor-pointer hover:bg-slate-50'
                          : ''}
                    onclick={selectable ? (e) => handleToggle(i, e) : undefined}
                >
                    <td class="px-4 py-1.5">
                        {#if selectable}
                            <button
                                type="button"
                                aria-pressed={selected}
                                aria-label={`Toggle atom ${i + 1} (${atom.element}) selection`}
                                class="rounded px-1 font-medium text-slate-500 hover:bg-orange-100 hover:text-slate-700"
                                onclick={(e) => handleToggle(i, e)}
                            >
                                {i + 1}
                            </button>
                        {:else}
                            <span class="text-slate-400">{i + 1}</span>
                        {/if}
                    </td>
                    <td class="px-4 py-1.5 font-medium text-slate-800">{atom.element}</td>
                    <td class="px-4 py-1.5 text-right font-mono text-slate-600"
                        >{formatCoordinate(atom.x)}</td
                    >
                    <td class="px-4 py-1.5 text-right font-mono text-slate-600"
                        >{formatCoordinate(atom.y)}</td
                    >
                    <td class="px-4 py-1.5 text-right font-mono text-slate-600"
                        >{formatCoordinate(atom.z)}</td
                    >
                </tr>
            {/each}
        </tbody>
    </table>
</div>
