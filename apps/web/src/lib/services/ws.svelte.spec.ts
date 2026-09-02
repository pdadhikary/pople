import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockWebSocket, resetFetch } from '../../test/mock-fetch';
import { openJobSocket, wsUrl } from './ws.svelte';
import type { JobWsMessage } from './ws.svelte';

afterEach(() => {
    resetFetch();
});

describe('wsUrl', () => {
    it('rewrites the HTTP base URL to a WebSocket URL for the job endpoint', () => {
        const url = wsUrl(7);
        expect(url.startsWith('ws://')).toBe(true);
        expect(url).toMatch(/\/jobs\/7\/ws$/);
    });
});

describe('openJobSocket', () => {
    it('opens a WebSocket to the job url and passes parsed messages to the handler', () => {
        const handle = mockWebSocket();
        const onMessage = vi.fn();

        openJobSocket(7, onMessage);

        expect(handle.instances).toHaveLength(1);
        expect(handle.instances[0].url).toContain('/jobs/7/ws');

        const message: JobWsMessage = {
            type: 'job_status_changed',
            job_id: 7,
            job_status: 'finished'
        };
        handle.instances[0].emit(message);

        expect(onMessage).toHaveBeenCalledWith(message);
    });
});
