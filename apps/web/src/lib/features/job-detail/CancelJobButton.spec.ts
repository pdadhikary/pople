import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import CancelJobButton from './CancelJobButton.svelte';
import { cancelJob } from '$lib/services/api';

vi.mock('$lib/services/api', async (importOriginal) => {
    const original = await importOriginal<typeof import('$lib/services/api')>();
    return { ...original, cancelJob: vi.fn() };
});

const cancelMock = vi.mocked(cancelJob);

beforeEach(() => {
    cancelMock.mockReset();
    cancelMock.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('CancelJobButton', () => {
    it('requires confirmation before cancelling a job', async () => {
        const onCanceled = vi.fn();

        render(CancelJobButton, { jobId: 1, jobName: 'cancel-me', onCanceled });

        expect(screen.queryByRole('dialog')).toBeNull();

        await fireEvent.click(screen.getByRole('button', { name: 'Cancel Job' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel Job' })
        );

        await waitFor(() => expect(cancelMock).toHaveBeenCalledWith(1));
        expect(onCanceled).toHaveBeenCalled();
    });

    it('does not cancel when the confirmation is dismissed', async () => {
        render(CancelJobButton, { jobId: 1, jobName: 'keep-me', onCanceled: () => {} });

        await fireEvent.click(screen.getByRole('button', { name: 'Cancel Job' }));
        await fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' })
        );

        expect(screen.queryByRole('dialog')).toBeNull();
        expect(cancelMock).not.toHaveBeenCalled();
    });

    it('shows an error when cancellation fails', async () => {
        cancelMock.mockRejectedValue(new Error('backend down'));
        render(CancelJobButton, { jobId: 1, jobName: 'err-me', onCanceled: () => {} });

        await fireEvent.click(screen.getByRole('button', { name: 'Cancel Job' }));
        await fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel Job' })
        );

        expect(await screen.findByText('backend down')).toBeInTheDocument();
        expect(cancelMock).toHaveBeenCalledWith(1);
    });
});
