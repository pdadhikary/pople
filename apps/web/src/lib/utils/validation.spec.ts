import { describe, expect, it } from 'vitest';
import { validateInputFile, validateJobName } from './validation';

describe('validateJobName', () => {
    it('accepts alphanumeric names', () => {
        expect(validateJobName('benzene-opt').valid).toBe(true);
        expect(validateJobName('water_optimization').valid).toBe(true);
        expect(validateJobName('job123').valid).toBe(true);
        expect(validateJobName('my-orca-job_01').valid).toBe(true);
    });

    it('rejects names with spaces', () => {
        expect(validateJobName('my job').valid).toBe(false);
    });

    it('rejects names with special characters', () => {
        expect(validateJobName('job.name').valid).toBe(false);
        expect(validateJobName('job/name').valid).toBe(false);
        expect(validateJobName('job@123').valid).toBe(false);
        expect(validateJobName('job#1').valid).toBe(false);
    });

    it('rejects an empty or whitespace-only name', () => {
        expect(validateJobName('').valid).toBe(false);
        expect(validateJobName('   ').valid).toBe(false);
    });
});

describe('validateInputFile', () => {
    it('rejects a missing file', () => {
        expect(validateInputFile(null).valid).toBe(false);
    });

    it('rejects non-.inp files', () => {
        const file = new File(['content'], 'job.txt', { type: 'text/plain' });
        expect(validateInputFile(file).valid).toBe(false);
    });

    it('accepts a valid .inp file', () => {
        const file = new File(['! B3LYP OPT'], 'job.inp', { type: 'text/plain' });
        expect(validateInputFile(file).valid).toBe(true);
    });

    it('rejects files larger than 1 MB', () => {
        const big = new Blob(['x'.repeat(1024 * 1024 + 1)]);
        const file = new File([big], 'big.inp', { type: 'text/plain' });
        expect(validateInputFile(file).valid).toBe(false);
    });
});
