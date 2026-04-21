import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyFolderUploadView } from './LegacyFolderUploadView';

const {
    createBatchMutateAsync,
    signUploadsMutateAsync,
    completeUploadsMutateAsync,
    finalizeBatchMutateAsync,
    useLegacyBatchMock,
} = vi.hoisted(() => ({
    createBatchMutateAsync: vi.fn(),
    signUploadsMutateAsync: vi.fn(),
    completeUploadsMutateAsync: vi.fn(),
    finalizeBatchMutateAsync: vi.fn(),
    useLegacyBatchMock: vi.fn(),
}));

vi.mock('../hooks/useLegacyBatch', () => ({
    useLegacyBatch: (...args: unknown[]) => useLegacyBatchMock(...args),
}));

vi.mock('../hooks/useLegacyBatchMutations', () => ({
    useLegacyBatchMutations: () => ({
        createBatch: { mutateAsync: createBatchMutateAsync },
        signUploads: { mutateAsync: signUploadsMutateAsync },
        completeUploads: { mutateAsync: completeUploadsMutateAsync },
        finalizeBatch: { mutateAsync: finalizeBatchMutateAsync },
    }),
}));

vi.mock('./LegacyFolderBrowserPanel', () => ({
    LegacyFolderBrowserPanel: () => <div data-testid="legacy-folder-browser-panel">Browser Panel</div>,
}));

const buildBatch = (overrides: Record<string, unknown> = {}) => ({
    id: 'legacy-batch-1',
    batchName: 'VESSEL 1',
    rootFolder: 'VESSEL 1',
    uploadedBy: 'Encoder User',
    uploadDate: 'Apr 20, 2026',
    status: 'draft' as const,
    statusLabel: 'Draft',
    fileCount: 1,
    uploadedFileCount: 0,
    failedFileCount: 0,
    pendingFileCount: 1,
    totalSize: '6 B',
    totalSizeBytes: 6,
    metadata: {
        year: '2026',
        department: 'Brokerage',
        notes: '',
        preserveNames: true,
        legacyReferenceOnly: true,
    },
    uploadSummary: {
        expected: 1,
        uploaded: 0,
        failed: 0,
        remaining: 1,
    },
    canResume: true,
    tree: null,
    remainingRelativePaths: ['VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf'],
    startedAt: null,
    completedAt: null,
    lastActivityAt: null,
    ...overrides,
});

const buildFolderFile = (relativePath: string): File => {
    const file = new File(['legacy'], 'IMPORT ENTRY.pdf', { type: 'application/pdf' });

    Object.defineProperty(file, 'webkitRelativePath', {
        configurable: true,
        value: relativePath,
    });

    return file;
};

const buildCustomFolderFile = (relativePath: string, options?: { type?: string; size?: number }): File => {
    const file = new File(['legacy'], relativePath.split('/').pop() || 'legacy-file', { type: options?.type ?? 'application/pdf' });

    Object.defineProperty(file, 'webkitRelativePath', {
        configurable: true,
        value: relativePath,
    });

    if (options?.size) {
        Object.defineProperty(file, 'size', {
            configurable: true,
            value: options.size,
        });
    }

    return file;
};

describe('LegacyFolderUploadView', () => {
    beforeEach(() => {
        useLegacyBatchMock.mockReturnValue({ data: undefined });
        createBatchMutateAsync.mockReset();
        signUploadsMutateAsync.mockReset();
        completeUploadsMutateAsync.mockReset();
        finalizeBatchMutateAsync.mockReset();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('loads the selected folder into preflight review', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        expect(folderInput).not.toBeNull();

        fireEvent.change(folderInput!, {
            target: {
                files: [buildFolderFile('VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf')],
            },
        });

        expect(screen.getByText('Preflight')).toBeInTheDocument();
        expect(screen.getByText('Vessel-based legacy archive detected')).toBeInTheDocument();
        expect(screen.getByLabelText('Batch Name')).toHaveValue('');
        expect(screen.getByLabelText('Year')).toHaveValue('');
        expect(screen.getByLabelText('Department')).toHaveValue('');
        expect(screen.getByRole('button', { name: /start legacy ingestion/i })).toBeDisabled();
    });

    it('requires the metadata fields before upload can start', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [buildFolderFile('VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf')],
            },
        });

        fireEvent.change(screen.getByLabelText('Batch Name'), {
            target: { value: 'VESSEL 1' },
        });
        fireEvent.change(screen.getByLabelText('Year'), {
            target: { value: '2026' },
        });

        expect(screen.getByRole('button', { name: /start legacy ingestion/i })).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Department'), {
            target: { value: 'Brokerage' },
        });

        expect(screen.getByRole('button', { name: /start legacy ingestion/i })).toBeEnabled();
    });

    it('blocks disallowed legacy file types before upload starts', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [
                    buildFolderFile('VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf'),
                    buildCustomFolderFile('VESSEL 1/KOTA HAKIM/VOICE MEMO.mp3', { type: 'audio/mpeg' }),
                ],
            },
        });

        expect(screen.getByText(/1 file blocked before upload/i)).toBeInTheDocument();
        expect(screen.getByText(/voice memo\.mp3/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start legacy ingestion/i })).toBeDisabled();
    });

    it('blocks oversized legacy files before upload starts', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [
                    buildCustomFolderFile('VESSEL 1/KOTA HAKIM/LARGE SCAN.pdf', {
                        type: 'application/pdf',
                        size: 52_428_801,
                    }),
                ],
            },
        });

        expect(screen.getByText(/large scan\.pdf/i)).toBeInTheDocument();
        expect(screen.getByText(/50 mb limit/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start legacy ingestion/i })).toBeDisabled();
    });

    it('creates, uploads, completes, and finalizes a legacy batch', async () => {
        const onOpenBatches = vi.fn();
        const uploadPath = 'VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf';

        createBatchMutateAsync.mockResolvedValue(
            buildBatch({
                batchName: 'VESSEL 1',
                remainingRelativePaths: [uploadPath],
            }),
        );

        signUploadsMutateAsync.mockResolvedValue({
            batchId: 'legacy-batch-1',
            status: 'uploading',
            uploads: [
                {
                    relativePath: uploadPath,
                    uploadUrl: 'https://upload.test/legacy',
                    headers: {},
                    method: 'PUT',
                },
            ],
        });

        completeUploadsMutateAsync.mockResolvedValue(
            buildBatch({
                status: 'uploading',
                statusLabel: 'Uploading',
                uploadedFileCount: 1,
                pendingFileCount: 0,
                uploadSummary: {
                    expected: 1,
                    uploaded: 1,
                    failed: 0,
                    remaining: 0,
                },
            }),
        );

        finalizeBatchMutateAsync.mockResolvedValue(
            buildBatch({
                status: 'completed',
                statusLabel: 'Completed',
                canResume: false,
                uploadedFileCount: 1,
                pendingFileCount: 0,
                uploadSummary: {
                    expected: 1,
                    uploaded: 1,
                    failed: 0,
                    remaining: 0,
                },
                tree: {
                    name: 'VESSEL 1',
                    type: 'folder',
                    children: [
                        {
                            id: 'file-1',
                            name: 'KOTA HAKIM',
                            type: 'folder',
                            children: [
                                {
                                    id: 'file-2',
                                    name: 'IMPORT ENTRY.pdf',
                                    type: 'file',
                                    size: '6 B',
                                    modified: 'Apr 20, 2026',
                                    status: 'uploaded',
                                },
                            ],
                        },
                    ],
                },
                completedAt: new Date('2026-04-20T10:00:00Z').toISOString(),
                remainingRelativePaths: [],
            }),
        );

        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
        } as Response);

        const { container } = render(<LegacyFolderUploadView onOpenBatches={onOpenBatches} />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [buildFolderFile(uploadPath)],
            },
        });

        fireEvent.change(screen.getByLabelText('Batch Name'), {
            target: { value: 'VESSEL 1' },
        });
        fireEvent.change(screen.getByLabelText('Year'), {
            target: { value: '2026' },
        });
        fireEvent.change(screen.getByLabelText('Department'), {
            target: { value: 'Brokerage' },
        });

        fireEvent.click(screen.getByRole('button', { name: /start legacy ingestion/i }));

        expect(await screen.findByText('Ingestion complete')).toBeInTheDocument();

        expect(createBatchMutateAsync).toHaveBeenCalledTimes(1);
        expect(signUploadsMutateAsync).toHaveBeenCalledWith({
            batchId: 'legacy-batch-1',
            relativePaths: [uploadPath],
        });
        expect(fetch).toHaveBeenCalledWith(
            'https://upload.test/legacy',
            expect.objectContaining({
                method: 'PUT',
            }),
        );
        expect(completeUploadsMutateAsync).toHaveBeenCalledWith({
            batchId: 'legacy-batch-1',
            relativePaths: [uploadPath],
        });
        expect(finalizeBatchMutateAsync).toHaveBeenCalledWith('legacy-batch-1');

        fireEvent.click(screen.getByRole('button', { name: /open batch list/i }));

        expect(onOpenBatches).toHaveBeenCalledTimes(1);
    });

    it('shows resume guidance when an interrupted batch is opened from the batch list', async () => {
        useLegacyBatchMock.mockReturnValue({
            data: buildBatch({
                id: 'resume-batch-1',
                batchName: 'VESSEL 1 Interrupted',
                status: 'interrupted',
                statusLabel: 'Interrupted',
                uploadSummary: {
                    expected: 3,
                    uploaded: 1,
                    failed: 0,
                    remaining: 2,
                },
                lastActivityAt: new Date('2026-04-20T09:00:00Z').toISOString(),
            }),
        });

        render(<LegacyFolderUploadView resumeBatchId="resume-batch-1" />);

        await waitFor(() => {
            expect(screen.getByText('Interrupted Batch')).toBeInTheDocument();
        });

        expect(screen.getByText(/select the same root folder again so the interrupted batch can continue/i)).toBeInTheDocument();
        expect(screen.getByText('VESSEL 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('VESSEL 1 Interrupted')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2026')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Brokerage')).toBeInTheDocument();
        expect(screen.getByText('Remaining Files')).toBeInTheDocument();
    });
});
