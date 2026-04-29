import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyBatchesPage } from './LegacyBatchesPage';

const {
    useLegacyBatchesMock,
    useLegacyBatchMock,
    deleteBatchMutateAsync,
} = vi.hoisted(() => ({
    useLegacyBatchesMock: vi.fn(),
    useLegacyBatchMock: vi.fn(),
    deleteBatchMutateAsync: vi.fn(),
}));

vi.mock('../../hooks/useLegacyBatches', () => ({
    useLegacyBatches: () => useLegacyBatchesMock(),
}));

vi.mock('../../hooks/useLegacyBatch', () => ({
    useLegacyBatch: (...args: unknown[]) => useLegacyBatchMock(...args),
}));

vi.mock('../../hooks/useLegacyBatchMutations', () => ({
    useLegacyBatchMutations: () => ({
        deleteBatch: { mutateAsync: deleteBatchMutateAsync },
    }),
}));

vi.mock('../legacy-upload/LegacyFolderBrowserPanel', () => ({
    LegacyFolderBrowserPanel: () => <div data-testid="legacy-browser-panel">Browser Panel</div>,
}));

const batchSummary = {
    id: 'legacy-batch-1',
    batchName: 'VESSEL 1 — Historical Archive',
    rootFolder: 'VESSEL 1',
    uploadedBy: 'R. Santos',
    uploadedById: 1,
    uploadDate: 'Apr 17, 2026',
    status: 'interrupted' as const,
    statusLabel: 'Interrupted',
    fileCount: 12,
    uploadedFileCount: 5,
    failedFileCount: 0,
    pendingFileCount: 7,
    totalSize: '420 MB',
    totalSizeBytes: 420 * 1024 * 1024,
    metadata: {
        year: '2025',
        yearFrom: '2025',
        yearTo: '2025',
        department: 'Brokerage',
        notes: 'Preserved vessel archive batch.',
        preserveNames: true,
        legacyReferenceOnly: true,
    },
    uploadSummary: {
        expected: 12,
        uploaded: 5,
        failed: 0,
        remaining: 7,
    },
    canResume: true,
};

describe('LegacyBatchesPage', () => {
    beforeEach(() => {
        deleteBatchMutateAsync.mockReset();
        deleteBatchMutateAsync.mockResolvedValue(undefined);
        useLegacyBatchesMock.mockReturnValue({
            data: {
                items: [batchSummary],
                pagination: {
                    currentPage: 1,
                    perPage: 20,
                    total: 1,
                    lastPage: 1,
                    from: 1,
                    to: 1,
                },
            },
            isLoading: false,
            isError: false,
        });
        useLegacyBatchMock.mockReturnValue({
            data: {
                ...batchSummary,
                tree: null,
                remainingRelativePaths: [],
                startedAt: null,
                completedAt: null,
                lastActivityAt: null,
            },
        });
    });

    it('renders uploaded batches and forwards the resume action', () => {
        const onResumeBatch = vi.fn();

        render(<LegacyBatchesPage onResumeBatch={onResumeBatch} />);

        expect(screen.getByText('VESSEL 1 — Historical Archive')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /resume/i }));

        expect(onResumeBatch).toHaveBeenCalledWith('legacy-batch-1');
        expect(screen.getByText('Showing 1-1 of 1 legacy batches')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('allows deleting an incomplete legacy batch after confirmation', async () => {
        render(<LegacyBatchesPage />);

        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        expect(screen.getByText('Delete Incomplete Legacy Batch')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /delete batch/i }));

        expect(deleteBatchMutateAsync).toHaveBeenCalledWith('legacy-batch-1');
    });
});
