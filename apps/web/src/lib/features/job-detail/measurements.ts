import type { Atom, GeometryStep } from '$lib/types/domain';

export type MeasurementKind = 'distance' | 'angle' | 'dihedral';

export interface Measurement {
    kind: MeasurementKind;
    /** Label of the measured atom group, e.g. "O1–H2". */
    label: string;
    unit: 'Å' | '°';
    value: number;
}

const DISTANCE_LABEL = 'Distance';
const ANGLE_LABEL = 'Angle';
const DIHEDRAL_LABEL = 'Dihedral';

export function measurementKindLabel(kind: MeasurementKind): string {
    switch (kind) {
        case 'distance':
            return DISTANCE_LABEL;
        case 'angle':
            return ANGLE_LABEL;
        case 'dihedral':
            return DIHEDRAL_LABEL;
    }
}

/** Euclidean distance between two atoms in Å. */
export function atomDistance(a: Atom, b: Atom): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Angle at vertex `b` between the rays `b-a` and `b-c`, in degrees [0, 180]. */
export function atomAngle(a: Atom, b: Atom, c: Atom): number {
    const ux = a.x - b.x;
    const uy = a.y - b.y;
    const uz = a.z - b.z;
    const vx = c.x - b.x;
    const vy = c.y - b.y;
    const vz = c.z - b.z;
    const denom = Math.hypot(ux, uy, uz) * Math.hypot(vx, vy, vz);
    if (denom === 0) return NaN;
    const cos = (ux * vx + uy * vy + uz * vz) / denom;
    return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

/**
 * Signed torsion angle around the b–c bond defined by atoms a–b–c–d,
 * in degrees within (−180, 180]. Uses the IUPAC convention: looking down
 * the b→c bond, a clockwise rotation from a to d is positive.
 * Returns NaN for degenerate geometries (collinear or coincident atoms).
 */
export function atomDihedral(a: Atom, b: Atom, c: Atom, d: Atom): number {
    const b0x = a.x - b.x;
    const b0y = a.y - b.y;
    const b0z = a.z - b.z;
    const b1x = c.x - b.x;
    const b1y = c.y - b.y;
    const b1z = c.z - b.z;
    const b2x = d.x - c.x;
    const b2y = d.y - c.y;
    const b2z = d.z - c.z;

    const b1Len = Math.hypot(b1x, b1y, b1z);
    if (b1Len === 0) return NaN;
    const b1nx = b1x / b1Len;
    const b1ny = b1y / b1Len;
    const b1nz = b1z / b1Len;

    // Projections of b0 and b2 onto the plane perpendicular to b1.
    const b0Dot = b0x * b1nx + b0y * b1ny + b0z * b1nz;
    const vx = b0x - b0Dot * b1nx;
    const vy = b0y - b0Dot * b1ny;
    const vz = b0z - b0Dot * b1nz;
    const b2Dot = b2x * b1nx + b2y * b1ny + b2z * b1nz;
    const wx = b2x - b2Dot * b1nx;
    const wy = b2y - b2Dot * b1ny;
    const wz = b2z - b2Dot * b1nz;

    if (Math.hypot(vx, vy, vz) === 0 || Math.hypot(wx, wy, wz) === 0) return NaN;

    const x = vx * wx + vy * wy + vz * wz;
    const y = b1nx * (vy * wz - vz * wy) + b1ny * (vz * wx - vx * wz) + b1nz * (vx * wy - vy * wx);
    return (Math.atan2(y, x) * 180) / Math.PI;
}

function atomLabel(atoms: Atom[], index: number): string {
    const atom = atoms[index];
    return atom ? `${atom.element}${index + 1}` : '';
}

/**
 * Compute the cumulative set of measurements for the selected atoms, in
 * click order: distance over the first two, angle over the first three,
 * dihedral over the first four. Returns [] when fewer than two atoms are
 * selected or the current step's atom list is missing.
 */
export function activeMeasurements(atoms: Atom[] | undefined, indices: number[]): Measurement[] {
    if (!atoms || atoms.length === 0 || indices.length < 2) return [];
    if (indices[0] < 0 || indices[0] >= atoms.length) return [];
    if (indices[1] < 0 || indices[1] >= atoms.length) return [];

    const results: Measurement[] = [
        {
            kind: 'distance',
            label: `${atomLabel(atoms, indices[0])}–${atomLabel(atoms, indices[1])}`,
            unit: 'Å',
            value: atomDistance(atoms[indices[0]], atoms[indices[1]])
        }
    ];

    if (indices.length >= 3 && inRange(atoms, indices[2])) {
        results.push({
            kind: 'angle',
            label: `${atomLabel(atoms, indices[0])}–${atomLabel(atoms, indices[1])}–${atomLabel(atoms, indices[2])}`,
            unit: '°',
            value: atomAngle(atoms[indices[0]], atoms[indices[1]], atoms[indices[2]])
        });
    }

    if (indices.length >= 4 && inRange(atoms, indices[3])) {
        results.push({
            kind: 'dihedral',
            label: `${atomLabel(atoms, indices[0])}–${atomLabel(atoms, indices[1])}–${atomLabel(atoms, indices[2])}–${atomLabel(atoms, indices[3])}`,
            unit: '°',
            value: atomDihedral(
                atoms[indices[0]],
                atoms[indices[1]],
                atoms[indices[2]],
                atoms[indices[3]]
            )
        });
    }

    return results;
}

function inRange(atoms: Atom[], index: number): boolean {
    return index >= 0 && index < atoms.length;
}

function stepValue(step: GeometryStep, indices: number[], kind: MeasurementKind): number | null {
    const needed = kind === 'distance' ? 2 : kind === 'angle' ? 3 : 4;
    if (indices.length < needed) return null;
    const atoms = step.atoms;
    for (let i = 0; i < needed; i++) {
        if (!inRange(atoms, indices[i])) return null;
    }
    const [a, b, c, d] = indices;
    let value: number;
    switch (kind) {
        case 'distance':
            value = atomDistance(atoms[a], atoms[b]);
            break;
        case 'angle':
            value = atomAngle(atoms[a], atoms[b], atoms[c]);
            break;
        case 'dihedral':
            value = atomDihedral(atoms[a], atoms[b], atoms[c], atoms[d]);
            break;
    }
    return Number.isNaN(value) ? null : value;
}

/**
 * Value of the given measurement for each optimization step, in step order.
 * Entries are null when the step is missing the selected atoms or the
 * measurement is degenerate.
 */
export function measurementSeries(
    steps: GeometryStep[],
    indices: number[],
    kind: MeasurementKind
): (number | null)[] {
    return steps.map((step) => stepValue(step, indices, kind));
}
