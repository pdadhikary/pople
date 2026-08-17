import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

afterEach(() => {
    cleanup();
});

// jsdom lacks File.prototype.text and URL.createObjectURL.
if (typeof File !== 'undefined' && !File.prototype.text) {
    File.prototype.text = function () {
        return this.arrayBuffer().then((buf: ArrayBuffer) => new TextDecoder().decode(buf));
    };
}

if (typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = () => 'blob:mock';
    URL.revokeObjectURL = () => {};
}
