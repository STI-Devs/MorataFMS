import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LegacyBatchZipRequest } from '../../hooks/useLegacyBatchZipRequests';
import { LegacyBatchZipRequestsPanel } from './LegacyBatchZipRequestsPanel';

const makeRequest = (overrides: Partial<LegacyBatchZipRequest> = {}): LegacyBatchZipRequest => ({
    id: 'legacy-zip-1',
    batchId: 'legacy-batch-1',
    batchName: 'MAERSK',
    rootFolder: '2024 SEALAND',
    moduleLabel: 'Brokerage',
    filename: 'maersk.zip',
    fileCount: 6902,
    fileSizeBytes: 5_350_000_000,
    status: 'ready',
    requestedAt: '2026-05-22T01:00:00Z',
    completedAt: '2026-05-22T01:05:00Z',
    expiresAt: '2026-05-25T01:00:00Z',
    canDownload: true,
    errorMessage: null,
    requestedBy: 'Support Admin',
    ...overrides,
});

describe('LegacyBatchZipRequestsPanel', () => {
    it('shows the three-day retention note and ready ZIP expiry', () => {
        render(
            <LegacyBatchZipRequestsPanel
                requests={[makeRequest()]}
                isOpen
                onOpen={vi.fn()}
                onClose={vi.fn()}
                onDownload={vi.fn()}
                onRetry={vi.fn()}
                onDismiss={vi.fn()}
                onClearFinished={vi.fn()}
            />,
        );

        expect(screen.getByText(/ready zip files are kept for 3 days/i)).toBeInTheDocument();
        expect(screen.getByText(/available until/i)).toBeInTheDocument();
    });

    it('requires confirmation before clearing finished legacy batch ZIP requests', () => {
        const clearFinished = vi.fn();

        render(
            <LegacyBatchZipRequestsPanel
                requests={[makeRequest()]}
                isOpen
                onOpen={vi.fn()}
                onClose={vi.fn()}
                onDownload={vi.fn()}
                onRetry={vi.fn()}
                onDismiss={vi.fn()}
                onClearFinished={clearFinished}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /clear finished/i }));

        expect(clearFinished).not.toHaveBeenCalled();
        expect(screen.getByText(/deletes any prepared zip file from storage/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /clear zip files/i }));

        expect(clearFinished).toHaveBeenCalledTimes(1);
    });

    it('requires confirmation before removing a single prepared legacy batch ZIP request', () => {
        const dismiss = vi.fn();

        render(
            <LegacyBatchZipRequestsPanel
                requests={[makeRequest()]}
                isOpen
                onOpen={vi.fn()}
                onClose={vi.fn()}
                onDownload={vi.fn()}
                onRetry={vi.fn()}
                onDismiss={dismiss}
                onClearFinished={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByTitle(/remove request/i));

        expect(dismiss).not.toHaveBeenCalled();
        expect(screen.getByText(/remove this zip request/i)).toBeInTheDocument();
        expect(screen.getByText(/preparing it again may take time/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /remove zip/i }));

        expect(dismiss).toHaveBeenCalledWith('legacy-zip-1');
    });
});
