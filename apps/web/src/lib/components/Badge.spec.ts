import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Badge from './Badge.svelte';
import type { JobStatus } from '$lib/types/domain';

const statuses: JobStatus[] = ['queued', 'running', 'finished', 'cancelled', 'error'];

describe('Badge', () => {
    for (const status of statuses) {
        it(`renders a ${status} badge with text and an icon`, () => {
            const { container } = render(Badge, { status });
            const badge = screen.getByRole('status');
            expect(badge).toHaveTextContent(status.charAt(0).toUpperCase() + status.slice(1));
            expect(container.querySelector('svg')).toBeInTheDocument();
        });
    }

    it('adds an animated indicator for the running status', () => {
        render(Badge, { status: 'running' });
        expect(screen.getByRole('status').querySelector('.animate-spin')).toBeInTheDocument();
    });
});
