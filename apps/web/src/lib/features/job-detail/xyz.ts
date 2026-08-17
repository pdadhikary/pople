import type { Atom } from '$lib/types/domain';

/**
 * Format a set of atoms as an XYZ file string:
 * first line = atom count, second line = molecule name,
 * then one line per atom: `element  x  y  z`.
 */
export function toXyz(moleculeName: string, atoms: Atom[]): string {
    const lines = [String(atoms.length), moleculeName];
    for (const atom of atoms) {
        lines.push(
            `${atom.element}\t${atom.x.toFixed(6)}\t${atom.y.toFixed(6)}\t${atom.z.toFixed(6)}`
        );
    }
    return lines.join('\n');
}
