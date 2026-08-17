import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
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
});
