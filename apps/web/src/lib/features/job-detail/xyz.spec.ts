import { describe, expect, it } from 'vitest';
import { toXyz } from './xyz';
import type { Atom } from '$lib/types/domain';

describe('toXyz', () => {
    it('writes the atom count as the first line', () => {
        const atoms: Atom[] = [
            { element: 'O', x: 0, y: 0, z: 0.117 },
            { element: 'H', x: 0, y: 0.757, z: -0.469 },
            { element: 'H', x: 0, y: -0.757, z: -0.469 }
        ];
        const xyz = toXyz('water', atoms);
        const lines = xyz.split('\n');
        expect(lines[0]).toBe('3');
        expect(lines[1]).toBe('water');
        expect(lines).toHaveLength(5);
    });

    it('formats coordinates with 6 decimal places', () => {
        const xyz = toXyz('test', [{ element: 'C', x: 1.123456789, y: -2.5, z: 0 }]);
        const line = xyz.split('\n')[2];
        expect(line).toContain('C');
        expect(line).toContain('1.123457');
        expect(line).toContain('-2.500000');
        expect(line).toContain('0.000000');
    });

    it('handles an empty atom list', () => {
        const xyz = toXyz('empty', []);
        expect(xyz.split('\n')).toEqual(['0', 'empty']);
    });
});
