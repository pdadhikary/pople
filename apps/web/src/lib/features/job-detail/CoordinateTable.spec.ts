import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CoordinateTable from './CoordinateTable.svelte';
import type { Atom } from '$lib/types/domain';

const atoms: Atom[] = [
    { element: 'O', x: 0, y: 0, z: 0.117 },
    { element: 'H', x: 0, y: 0.757, z: -0.469 },
    { element: 'H', x: 0, y: -0.757, z: -0.469 }
];

describe('CoordinateTable', () => {
    it('renders one row per atom with formatted coordinates', () => {
        const { container } = render(CoordinateTable, { coordinates: atoms });
        const rows = container.querySelectorAll('tbody tr');
        expect(rows).toHaveLength(3);

        const firstRow = rows[0];
        expect(firstRow.textContent).toContain('1');
        expect(firstRow.textContent).toContain('O');
        expect(firstRow.textContent).toContain('0.1170');
    });

    it('renders no rows when coordinates are empty', () => {
        const { container } = render(CoordinateTable, { coordinates: [] });
        expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
    });

    it('renders no rows when coordinates are undefined', () => {
        const { container } = render(CoordinateTable, {});
        expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
    });

    it('shows all atom elements', () => {
        render(CoordinateTable, { coordinates: atoms });
        expect(screen.getByText('O')).toBeInTheDocument();
        expect(screen.getAllByText('H')).toHaveLength(2);
    });

    it('renders non-interactive index cells without a toggle handler', () => {
        render(CoordinateTable, { coordinates: atoms });
        expect(
            screen.queryByRole('button', { name: 'Toggle atom 1 (O) selection' })
        ).not.toBeInTheDocument();
    });

    it('renders toggle buttons with aria-pressed reflecting the selection', () => {
        render(CoordinateTable, {
            coordinates: atoms,
            selectedIndices: [0],
            onAtomToggle: () => undefined
        });
        expect(screen.getByRole('button', { name: 'Toggle atom 1 (O) selection' })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        expect(screen.getByRole('button', { name: 'Toggle atom 2 (H) selection' })).toHaveAttribute(
            'aria-pressed',
            'false'
        );
    });

    it('marks selected rows with a highlight class', () => {
        const { container } = render(CoordinateTable, {
            coordinates: atoms,
            selectedIndices: [1],
            onAtomToggle: () => undefined
        });
        const rows = container.querySelectorAll('tbody tr');
        expect(rows[1].className).toContain('bg-orange-50');
        expect(rows[0].className).not.toContain('bg-orange-50');
    });

    it('calls onAtomToggle with the atom index when a row button is clicked', async () => {
        const onAtomToggle = vi.fn();
        render(CoordinateTable, { coordinates: atoms, onAtomToggle });
        await fireEvent.click(screen.getByRole('button', { name: 'Toggle atom 3 (H) selection' }));
        expect(onAtomToggle).toHaveBeenCalledExactlyOnceWith(2);
    });

    it('toggles via row click without double-firing through the button', async () => {
        const onAtomToggle = vi.fn();
        const { container } = render(CoordinateTable, { coordinates: atoms, onAtomToggle });
        const firstRow = container.querySelectorAll('tbody tr')[0];
        await fireEvent.click(firstRow);
        expect(onAtomToggle).toHaveBeenCalledExactlyOnceWith(0);
    });
});
