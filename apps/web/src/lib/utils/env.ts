export function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

export function isTestMode(): boolean {
    return import.meta.env.MODE === 'test';
}
