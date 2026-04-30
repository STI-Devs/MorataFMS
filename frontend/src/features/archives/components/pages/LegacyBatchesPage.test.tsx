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
    useLegacyBatches: (...args: unknown[]) => useLegacyBatchesMock(...args),
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

const secondBatchSummary = {
    ...batchSummary,
    id: 'legacy-batch-2',
    batchName: 'KOTA NANHAI',
    rootFolder: 'KOTA NANHAI',
    uploadedBy: 'Claire Ivy Florino',
    uploadDate: 'Apr 21, 2026',
    metadata: {
        ...batchSummary.metadata,
        year: '2023 - 2025',
    },
    uploadSummary: {
        expected: 9,
        uploaded: 9,
        failed: 0,
        remaining: 0,
    },
    status: 'completed' as const,
    statusLabel: 'Completed',
    fileCount: 9,
    uploadedFileCount: 9,
    pendingFileCount: 0,
    canResume: false,
};

describe('LegacyBatchesPage', () => {
    beforeEach(() => {
        deleteBatchMutateAsync.mockReset();
        deleteBatchMutateAsync.mockResolvedValue(undefined);
        useLegacyBatchesMock.mockImplementation((params?: { search?: string }) => ({
            data: {
                items: params?.search?.toLowerCase() === 'claire'
                    ? [secondBatchSummary]
                    : [batchSummary, secondBatchSummary],
                pagination: {
                    currentPage: 1,
                    perPage: 20,
                    total: params?.search?.toLowerCase() === 'claire' ? 1 : 2,
                    lastPage: 1,
                    from: params?.search?.toLowerCase() === 'claire' ? 1 : 1,
                    to: params?.search?.toLowerCase() === 'claire' ? 1 : 2,
                },
            },
            isLoading: false,
            isError: false,
        }));
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
        expect(screen.getByText('Showing 1-2 of 2 legacy batches')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('sends the search term through the legacy batches hook', () => {
        render(<LegacyBatchesPage />);

        fireEvent.change(screen.getByRole('textbox', { name: /search legacy batches/i }), {
            target: { value: 'claire' },
        });

        expect(useLegacyBatchesMock).toHaveBeenLastCalledWith({
            page: 1,
            perPage: 20,
            search: 'claire',
        });
        expect(screen.getAllByText('KOTA NANHAI').length).toBeGreaterThan(0);
        expect(screen.queryByText('VESSEL 1 — Historical Archive')).not.toBeInTheDocument();
        expect(screen.getAllByText('1 matching batch').length).toBeGreaterThan(0);
    });

    it('allows deleting an incomplete legacy batch after confirmation', async () => {
        render(<LegacyBatchesPage />);

        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        expect(screen.getByText('Delete Incomplete Legacy Batch')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /delete batch/i }));

        expect(deleteBatchMutateAsync).toHaveBeenCalledWith('legacy-batch-1');
    });
});
