<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { Atom } from '$lib/types/domain';
    import type { ThreeDmolViewer } from '$lib/types/3dmol';
    import { toXyz } from './xyz';
    import EmptyState from '$lib/components/EmptyState.svelte';

    let { atoms, moleculeName = 'molecule' }: { atoms?: Atom[]; moleculeName?: string } = $props();

    let container = $state<HTMLDivElement>();
    // Intentionally NOT `$state`: 3Dmol mutates the viewer object heavily and
    // Svelte's reactive proxy would interfere with it.
    let viewer: ThreeDmolViewer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let unavailable = $state(false);
    let showLabels = $state(false);

    const hasData = $derived(!!atoms && atoms.length > 0);

    $effect(() => {
        if (!container || unavailable) return;
        if (!viewer) {
            if (!window.$3Dmol) {
                unavailable = true;
                return;
            }
            viewer = window.$3Dmol.createViewer(container, { backgroundColor: '#f1f5f9' });
            resizeObserver = new ResizeObserver(() => {
                viewer?.resize();
                viewer?.render();
            });
            resizeObserver.observe(container);
        }
        if (!atoms || atoms.length === 0) {
            viewer.removeAllModels();
            viewer.render();
            return;
        }
        const xyz = toXyz(moleculeName, atoms);
        viewer.removeAllModels();
        viewer.addModel(xyz, 'xyz');
        viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { radius: 0.35 } });
        viewer.zoomTo();
        viewer.render();
    });

    // Keep per-atom labels in sync with the current geometry and the toggle.
    $effect(() => {
        if (!viewer || !atoms || atoms.length === 0) return;
        const glviewer = viewer;
        glviewer.removeAllLabels();
        if (showLabels) {
            atoms.forEach((atom, i) => {
                glviewer.addLabel(`${atom.element}${i + 1}`, {
                    position: { x: atom.x, y: atom.y, z: atom.z },
                    alignment: 'center',
                    inFront: true,
                    showBackground: false,
                    bold: true,
                    fontSize: 15,
                    fontColor: '#1e293b'
                });
            });
        }
        glviewer.render();
    });

    onDestroy(() => {
        resizeObserver?.disconnect();
        resizeObserver = undefined;
        viewer?.clear();
        viewer = undefined;
    });
</script>

{#if unavailable}
    <p class="flex h-full items-center justify-center py-16 text-center text-sm text-slate-400">
        3D viewer unavailable in this environment.
    </p>
{:else if hasData}
    <div
        bind:this={container}
        class="relative h-80 w-full overflow-hidden rounded-md"
        role="img"
        aria-label="3D molecular structure of the selected optimization step"
    >
        <button
            type="button"
            role="switch"
            aria-checked={showLabels}
            class="absolute top-2 right-2 z-10 rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            onclick={() => (showLabels = !showLabels)}
        >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
        </button>
    </div>
    <p class="mt-2 text-center text-xs text-slate-500">Drag to rotate · scroll to zoom</p>
{:else}
    <EmptyState
        title="No geometry available"
        description="This step has no atomic coordinates to display."
    />
{/if}
