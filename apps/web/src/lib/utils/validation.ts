export interface ValidationError {
    field: 'name' | 'file';
    message: string;
}

export interface NameValidationResult {
    valid: boolean;
    message?: string;
}

export interface FileValidationResult {
    valid: boolean;
    message?: string;
}

const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const MAX_NAME_LENGTH = 20;
const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

/**
 * Validate a job name: required, starts with a letter or number, then letters,
 * numbers, hyphens and underscores only (no spaces or other special characters),
 * max 20 characters — matching the API's accepted pattern.
 */
export function validateJobName(name: string): NameValidationResult {
    if (!name || name.trim() === '') {
        return { valid: false, message: 'Job name is required.' };
    }
    if (name.length > MAX_NAME_LENGTH) {
        return { valid: false, message: 'Job name must be 20 characters or fewer.' };
    }
    if (!NAME_PATTERN.test(name)) {
        return {
            valid: false,
            message:
                'Job name must start with a letter or number and may only contain letters, numbers, hyphens and underscores (no spaces or special characters).'
        };
    }
    return { valid: true };
}

/**
 * Validate an ORCA input file: required, `.inp` extension, max 1 MB.
 */
export function validateInputFile(file: File | null): FileValidationResult {
    if (!file) {
        return { valid: false, message: 'An ORCA input file (.inp) is required.' };
    }
    if (!file.name.toLowerCase().endsWith('.inp')) {
        return { valid: false, message: 'File must be an ORCA input file with a .inp extension.' };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, message: 'File is too large. Maximum size is 1 MB.' };
    }
    return { valid: true };
}

export const MAX_INPUT_FILE_SIZE = MAX_FILE_SIZE;
