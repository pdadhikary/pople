<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { Atom } from '$lib/types/domain';
    import type { ThreeDmolViewer } from '$lib/types/3dmol';
    import { toXyz } from './xyz';
    import EmptyState from '$lib/components/EmptyState.svelte';

    let {
        atoms,
        moleculeName = 'molecule',
        selectedIndices = [],
        onAtomToggle
    }: {
        atoms?: Atom[];
        moleculeName?: string;
        selectedIndices?: number[];
        onAtomToggle?: (index: number) => void;
    } = $props();

    let container = $state<HTMLDivElement>();
    // Intentionally NOT `$state`: 3Dmol mutates the viewer object heavily and
    // Svelte's reactive proxy would interfere with it.
    let viewer: ThreeDmolViewer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let unavailable = $state(false);
    let showLabels = $state(false);

    const hasData = $derived(!!atoms && atoms.length > 0);

    const baseStyle = { stick: { radius: 0.15 }, sphere: { radius: 0.35 } };
    const selectionStyle = { stick: { radius: 0.15 }, sphere: { radius: 0.45, color: '#f97316' } };
    const selectionColor = '#f97316';

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
            viewer.removeAllShapes();
            viewer.render();
            return;
        }
        const xyz = toXyz(moleculeName, atoms);
        viewer.removeAllModels();
        viewer.removeAllShapes();
        viewer.addModel(xyz, 'xyz');
        viewer.setStyle({}, baseStyle);
        viewer.zoomTo();
        viewer.render();
    });

    // Re-apply click handling after every model rebuild. Must be followed by
    // render() for 3Dmol to refresh its clickable atom list.
    $effect(() => {
        if (!viewer || !atoms || atoms.length === 0) return;
        const glviewer = viewer;
        glviewer.setClickable({}, true, (atom) => {
            if (typeof atom.serial === 'number') onAtomToggle?.(atom.serial);
        });
        glviewer.render();
    });

    // Highlight selected atoms and draw dashed connector lines between them.
    $effect(() => {
        if (!viewer || !atoms || atoms.length === 0) return;
        const glviewer = viewer;
        glviewer.removeAllShapes();
        glviewer.setStyle({}, baseStyle);
        for (const index of selectedIndices) {
            if (index < 0 || index >= atoms.length) continue;
            glviewer.setStyle({ serial: index }, selectionStyle);
        }
        for (let i = 0; i + 1 < selectedIndices.length; i++) {
            const a = atoms[selectedIndices[i]];
            const b = atoms[selectedIndices[i + 1]];
            if (!a || !b) continue;
            glviewer.addLine({
                start: { x: a.x, y: a.y, z: a.z },
                end: { x: b.x, y: b.y, z: b.z },
                color: selectionColor,
                dashed: true
            });
        }
        glviewer.render();
    });

    // Keep labels in sync with the geometry, the element-label toggle, and the
    // selection: element labels (optional) plus selection-order badges.
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
        selectedIndices.forEach((index, order) => {
            const atom = atoms[index];
            if (!atom) return;
            glviewer.addLabel(String(order + 1), {
                position: { x: atom.x, y: atom.y, z: atom.z },
                alignment: 'bottomCenter',
                screenOffset: { x: 0, y: -8 },
                inFront: true,
                showBackground: true,
                backgroundColor: '#f97316',
                fontColor: 'white',
                bold: true,
                fontSize: 11
            });
        });
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
    <p class="mt-2 text-center text-xs text-slate-500">
        Drag to rotate · scroll to zoom · click atoms to measure
    </p>
{:else}
    <EmptyState
        title="No geometry available"
        description="This step has no atomic coordinates to display."
    />
{/if}
