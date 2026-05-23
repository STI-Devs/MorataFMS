import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArchiveZipRequest } from '../../hooks/useArchiveZipRequests';
import { ArchiveZipRequestsPanel } from './ArchiveZipRequestsPanel';

const makeRequest = (overrides: Partial<ArchiveZipRequest> = {}): ArchiveZipRequest => ({
    id: 'zip-1',
    scope: 'folder',
    requestKey: '4|export',
    folderName: 'APR 2026 EXPORTS',
    filename: 'apr-2026-exports.zip',
    year: 2026,
    month: 4,
    type: 'export',
    fileCount: 79,
    blCount: 7,
    fileSizeBytes: 1024,
    status: 'ready',
    requestedAt: '2026-05-22T01:00:00Z',
    completedAt: '2026-05-22T01:05:00Z',
    expiresAt: '2026-05-25T01:00:00Z',
    canDownload: true,
    errorMessage: null,
    ...overrides,
});

describe('ArchiveZipRequestsPanel', () => {
    it('shows a disabled downloading state for the active ZIP download', () => {
        render(
            <ArchiveZipRequestsPanel
                requests={[makeRequest()]}
                isOpen
                onOpen={vi.fn()}
                onClose={vi.fn()}
                onDownload={vi.fn()}
                downloadingRequestId="zip-1"
                onRetry={vi.fn()}
                onDismiss={vi.fn()}
                onClearFinished={vi.fn()}
            />,
        );

        const downloadButton = screen.getByRole('button', { name: /downloading/i });

        expect(downloadButton).toBeDisabled();
        expect(downloadButton).toHaveAttribute('aria-busy', 'true');
    });

    it('shows the three-day retention note and ready ZIP expiry', () => {
        render(
            <ArchiveZipRequestsPanel
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

    it('requires confirmation before clearing finished archive ZIP requests', () => {
        const clearFinished = vi.fn();

        render(
            <ArchiveZipRequestsPanel
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
});
