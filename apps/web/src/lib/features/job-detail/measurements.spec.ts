import { describe, expect, it } from 'vitest';
import type { Atom, GeometryStep } from '$lib/types/domain';
import {
    activeMeasurements,
    atomAngle,
    atomDihedral,
    atomDistance,
    measurementSeries
} from './measurements';

const water: Atom[] = [
    { element: 'O', x: 0, y: 0, z: 0.117 },
    { element: 'H', x: 0, y: 0.757, z: -0.469 },
    { element: 'H', x: 0, y: -0.757, z: -0.469 }
];

describe('atomDistance', () => {
    it('computes the Euclidean distance between two atoms', () => {
        expect(atomDistance(water[0], water[1])).toBeCloseTo(0.9573, 4);
    });

    it('returns 0 for coincident atoms', () => {
        expect(atomDistance(water[0], water[0])).toBe(0);
    });
});

describe('atomAngle', () => {
    it('measures a right angle at the vertex atom', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 1, z: 0 };
        expect(atomAngle(a, b, c)).toBeCloseTo(90, 8);
    });

    it('measures 180 degrees for collinear opposite atoms', () => {
        const a: Atom = { element: 'C', x: 2, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        expect(atomAngle(a, b, c)).toBeCloseTo(180, 8);
    });

    it('measures 0 degrees for collinear same-direction atoms', () => {
        const a: Atom = { element: 'C', x: 2, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 2, y: 0, z: 0 };
        expect(atomAngle(a, b, c)).toBeCloseTo(0, 8);
    });

    it('recovers the water H-O-H angle when O is the vertex', () => {
        expect(atomAngle(water[1], water[0], water[2])).toBeCloseTo(104.5, 1);
    });

    it('returns NaN when the vertex coincides with an endpoint', () => {
        expect(atomAngle(water[0], water[0], water[1])).toBeNaN();
    });
});

describe('atomDihedral', () => {
    it('measures 180 degrees for an anti conformation', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 1, z: 0 };
        const d: Atom = { element: 'C', x: -1, y: 1, z: 0 };
        expect(atomDihedral(a, b, c, d)).toBeCloseTo(180, 6);
    });

    it('measures 0 degrees for an eclipsed conformation', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 1, z: 0 };
        const d: Atom = { element: 'C', x: 1, y: 1, z: 0 };
        expect(atomDihedral(a, b, c, d)).toBeCloseTo(0, 6);
    });

    it('measures +60 degrees for a right-handed gauche conformation', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 1, z: 0 };
        const d: Atom = { element: 'C', x: 0.5, y: 1, z: -0.8660254037844386 };
        expect(atomDihedral(a, b, c, d)).toBeCloseTo(60, 4);
    });

    it('flips the sign for the mirrored gauche conformation', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 1, z: 0 };
        const d: Atom = { element: 'C', x: 0.5, y: 1, z: 0.8660254037844386 };
        expect(atomDihedral(a, b, c, d)).toBeCloseTo(-60, 4);
    });

    it('measures 90 degrees when the second plane is perpendicular', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 1, z: 0 };
        const d: Atom = { element: 'C', x: 0, y: 1, z: -1 };
        expect(atomDihedral(a, b, c, d)).toBeCloseTo(90, 6);
    });

    it('returns NaN for collinear b-c-d atoms', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const c: Atom = { element: 'C', x: 0, y: 1, z: 0 };
        const d: Atom = { element: 'C', x: 0, y: 2, z: 0 };
        expect(atomDihedral(a, b, c, d)).toBeNaN();
    });

    it('returns NaN when the central bond is zero length', () => {
        const a: Atom = { element: 'C', x: 1, y: 0, z: 0 };
        const b: Atom = { element: 'C', x: 0, y: 0, z: 0 };
        const d: Atom = { element: 'C', x: 1, y: 1, z: 1 };
        expect(atomDihedral(a, b, b, d)).toBeNaN();
    });
});

describe('activeMeasurements', () => {
    it('returns [] for fewer than two selected atoms', () => {
        expect(activeMeasurements(water, [])).toEqual([]);
        expect(activeMeasurements(water, [0])).toEqual([]);
        expect(activeMeasurements(undefined, [0, 1])).toEqual([]);
    });

    it('returns [] when the current step has no atoms', () => {
        expect(activeMeasurements([], [0, 1])).toEqual([]);
    });

    it('returns [] when the first two indices are out of range', () => {
        expect(activeMeasurements(water, [0, 9])).toEqual([]);
    });

    it('reports distance for two selected atoms in click order', () => {
        const [m] = activeMeasurements(water, [0, 1]);
        expect(m).toMatchObject({ kind: 'distance', label: 'O1–H2', unit: 'Å' });
        expect(m.value).toBeCloseTo(0.9573, 4);
    });

    it('adds angle for three selected atoms using the first three in order', () => {
        const ms = activeMeasurements(water, [2, 0, 1]);
        expect(ms.map((m) => m.kind)).toEqual(['distance', 'angle']);
        expect(ms[1]).toMatchObject({ kind: 'angle', label: 'H3–O1–H2', unit: '°' });
        expect(ms[1].value).toBeCloseTo(104.5, 1);
    });

    it('adds dihedral for four selected atoms', () => {
        const atoms: Atom[] = [
            { element: 'C', x: 1, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 0, y: 1, z: 0 },
            { element: 'C', x: -1, y: 1, z: 0 }
        ];
        const ms = activeMeasurements(atoms, [0, 1, 2, 3]);
        expect(ms.map((m) => m.kind)).toEqual(['distance', 'angle', 'dihedral']);
        expect(ms[2]).toMatchObject({ kind: 'dihedral', label: 'C1–C2–C3–C4', unit: '°' });
        expect(ms[2].value).toBeCloseTo(180, 6);
    });

    it('omits angle/dihedral when their atoms are out of range', () => {
        const ms = activeMeasurements(water, [0, 1, 9, 8]);
        expect(ms.map((m) => m.kind)).toEqual(['distance']);
    });
});

describe('measurementSeries', () => {
    const steps: GeometryStep[] = [
        { recordedAt: '2024-01-01T00:00:01Z', atoms: water },
        {
            recordedAt: '2024-01-01T00:00:02Z',
            atoms: [
                { element: 'O', x: 0.01, y: 0, z: 0.1 },
                { element: 'H', x: 0.01, y: 0.75, z: -0.46 },
                { element: 'H', x: 0.01, y: -0.75, z: -0.46 }
            ]
        }
    ];

    it('computes the distance series across steps', () => {
        const series = measurementSeries(steps, [0, 1], 'distance');
        expect(series).toHaveLength(2);
        expect(series[0]).toBeCloseTo(0.9573, 4);
        expect(series[1]).toBeCloseTo(0.936, 2);
    });

    it('returns null for steps missing the selected atoms', () => {
        const truncated: GeometryStep[] = [
            ...steps,
            { recordedAt: '2024-01-01T00:00:03Z', atoms: water.slice(0, 1) }
        ];
        const series = measurementSeries(truncated, [0, 1], 'distance');
        expect(series[2]).toBeNull();
    });

    it('returns null when fewer indices are selected than the measurement needs', () => {
        expect(measurementSeries(steps, [0, 1], 'dihedral')).toEqual([null, null]);
        expect(measurementSeries(steps, [0, 1], 'angle')).toEqual([null, null]);
    });

    it('returns null for degenerate dihedral geometries', () => {
        const degenerate: GeometryStep[] = [
            {
                recordedAt: '2024-01-01T00:00:01Z',
                atoms: [
                    { element: 'C', x: 1, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 1, z: 0 },
                    { element: 'C', x: 0, y: 2, z: 0 }
                ]
            }
        ];
        const series = measurementSeries(degenerate, [0, 1, 2, 3], 'dihedral');
        expect(series).toEqual([null]);
    });
});
