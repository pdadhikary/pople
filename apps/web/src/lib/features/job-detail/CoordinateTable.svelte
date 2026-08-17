<script lang="ts">
    import type { Atom } from '$lib/types/domain';
    import { formatCoordinate } from '$lib/utils/format';

    let { coordinates }: { coordinates?: Atom[] } = $props();
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
                <tr>
                    <td class="px-4 py-1.5 text-slate-400">{i + 1}</td>
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
