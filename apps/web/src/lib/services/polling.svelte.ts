import { onDestroy } from 'svelte';

/**
 * Repeatedly run `fn` on an interval, automatically cleared when the
 * component that called this is destroyed.
 */
export function usePolling(fn: () => Promise<void> | void, intervalMs = 5000): void {
    const id = setInterval(() => {
        void fn();
    }, intervalMs);
    onDestroy(() => clearInterval(id));
}
