import { vi } from 'vitest';

export interface MockResponse {
    status?: number;
    body?: unknown;
    text?: string;
    headers?: Record<string, string>;
}

export type MockHandler = (url: URL, init: RequestInit) => MockResponse | Promise<MockResponse>;

/**
 * Install a mock for `globalThis.fetch` that routes requests by method + pathname.
 * Returns the mocked fetch function plus a helper to list captured calls.
 */
export function mockFetch(routes: {
    [key: string]: MockHandler | MockResponse;
}): ReturnType<typeof vi.fn> {
    const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = input instanceof URL ? input : new URL(String(input));
        const method = (init?.method ?? 'GET').toUpperCase();
        const key = `${method} ${url.pathname}`;

        const handler = routes[key];
        if (!handler) {
            return new Response(JSON.stringify({ detail: `No mock for ${key}` }), {
                status: 404,
                headers: { 'content-type': 'application/json' }
            });
        }

        const resolved: MockResponse =
            typeof handler === 'function' ? await handler(url, init ?? {}) : handler;

        const status = resolved.status ?? 200;
        const headers = resolved.headers ?? { 'content-type': 'application/json' };

        let body: BodyInit | null = null;
        if (resolved.text !== undefined) {
            body = resolved.text;
            headers['content-type'] = 'text/plain';
        } else if (resolved.body !== undefined) {
            body = JSON.stringify(resolved.body);
            headers['content-type'] = 'application/json';
        }

        return new Response(body, { status, headers });
    });

    vi.stubGlobal('fetch', fn);
    return fn;
}

export function resetFetch(): void {
    vi.unstubAllGlobals();
}

/**
 * A fake WebSocket for tests: records the URL it was constructed with and lets
 * tests push messages through `emit()` (which invokes the registered `onmessage`).
 */
export interface MockWebSocket {
    url: string;
    emit(message: unknown): void;
    close: ReturnType<typeof vi.fn>;
}

export interface MockWebSocketHandle {
    instances: MockWebSocket[];
    constructorMock: ReturnType<typeof vi.fn>;
}

export function mockWebSocket(): MockWebSocketHandle {
    const instances: MockWebSocket[] = [];

    const FakeWebSocket = vi.fn(function (
        this: {
            url: string;
            onmessage: ((ev: MessageEvent) => void) | null;
            close: ReturnType<typeof vi.fn>;
        },
        url: string
    ) {
        this.url = url;
        this.onmessage = null;
        this.close = vi.fn(() => {});
        instances.push({
            url,
            emit: (message: unknown) => {
                if (this.onmessage) {
                    this.onmessage({ data: JSON.stringify(message) } as MessageEvent);
                }
            },
            close: this.close
        });
    });

    vi.stubGlobal('WebSocket', FakeWebSocket);

    return { instances, constructorMock: FakeWebSocket };
}
