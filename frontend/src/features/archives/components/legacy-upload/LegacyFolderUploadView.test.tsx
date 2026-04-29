import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyFolderUploadView } from './LegacyFolderUploadView';

const {
    createBatchMutateAsync,
    appendManifestMutateAsync,
    signUploadsMutateAsync,
    completeUploadsMutateAsync,
    finalizeBatchMutateAsync,
    useLegacyBatchMock,
} = vi.hoisted(() => ({
    createBatchMutateAsync: vi.fn(),
    appendManifestMutateAsync: vi.fn(),
    signUploadsMutateAsync: vi.fn(),
    completeUploadsMutateAsync: vi.fn(),
    finalizeBatchMutateAsync: vi.fn(),
    useLegacyBatchMock: vi.fn(),
}));

vi.mock('../../hooks/useLegacyBatch', () => ({
    useLegacyBatch: (...args: unknown[]) => useLegacyBatchMock(...args),
}));

vi.mock('../../hooks/useLegacyBatchMutations', () => ({
    useLegacyBatchMutations: () => ({
        createBatch: { mutateAsync: createBatchMutateAsync },
        appendManifest: { mutateAsync: appendManifestMutateAsync },
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
        yearFrom: '2026',
        yearTo: '2026',
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

const createDeferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
};

describe('LegacyFolderUploadView', () => {
    beforeEach(() => {
        useLegacyBatchMock.mockReturnValue({ data: undefined });
        createBatchMutateAsync.mockReset();
        appendManifestMutateAsync.mockReset();
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
        expect(screen.queryByLabelText('To Year')).not.toBeInTheDocument();
        expect(screen.getByLabelText('This batch spans multiple years')).not.toBeChecked();
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
        expect(screen.getByRole('button', { name: /view full structure/i })).toHaveClass('bg-surface');
        expect(screen.getByRole('button', { name: /view full structure/i })).not.toHaveClass('bg-white');
        expect(screen.getByText('Upload blocked')).toHaveClass('dark:bg-surface-secondary/85');
        expect(screen.getByText(/remove the blocked files first/i)).toHaveClass('dark:bg-red-950/25');
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

    it('accepts xlsm legacy transaction files during preflight', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [
                    buildCustomFolderFile('VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsm', {
                        type: 'application/vnd.ms-excel.sheet.macroEnabled.12',
                    }),
                ],
            },
        });

        expect(screen.queryByText(/file blocked before upload/i)).not.toBeInTheDocument();
        expect(screen.getByText('Preflight')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Batch Name'), {
            target: { value: 'VESSEL 1 XLSM Batch' },
        });
        fireEvent.change(screen.getByLabelText('Year'), {
            target: { value: '2026' },
        });
        fireEvent.change(screen.getByLabelText('Department'), {
            target: { value: 'Brokerage' },
        });

        expect(screen.getByRole('button', { name: /start legacy ingestion/i })).toBeEnabled();
    });

    it('accepts xlsb and msg legacy archive files during preflight', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [
                    buildCustomFolderFile('VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsb', {
                        type: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
                    }),
                    buildCustomFolderFile('VESSEL 1/KOTA HAKIM/EMAILS/CUSTOMER APPROVAL.msg', {
                        type: 'application/vnd.ms-outlook',
                    }),
                ],
            },
        });

        expect(screen.queryByText(/file blocked before upload/i)).not.toBeInTheDocument();
        expect(screen.getByText('Preflight')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Batch Name'), {
            target: { value: 'VESSEL 1 Archive Batch' },
        });
        fireEvent.change(screen.getByLabelText('Year'), {
            target: { value: '2026' },
        });
        fireEvent.change(screen.getByLabelText('Department'), {
            target: { value: 'Brokerage' },
        });

        expect(screen.getByRole('button', { name: /start legacy ingestion/i })).toBeEnabled();
    });

    it('quietly skips known system files from the visible preflight counts', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [
                    buildFolderFile('VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf'),
                    buildCustomFolderFile('VESSEL 1/KOTA HAKIM/desktop.ini', {
                        type: 'application/octet-stream',
                    }),
                ],
            },
        });

        expect(screen.queryByText(/file blocked before upload/i)).not.toBeInTheDocument();
        expect(screen.getByText('1 files · 1 folders · 6 B')).toBeInTheDocument();
        expect(screen.getByText('Preflight')).toBeInTheDocument();
    });

    it('quietly skips temporary office lock files from the visible preflight counts', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [
                    buildCustomFolderFile('IRAN/FOR ED/~$U-DOLE.docx', {
                        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    }),
                    buildCustomFolderFile('IRAN/FOR ED/INVOICE FOR ED.xlsx', {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    }),
                ],
            },
        });

        expect(screen.queryByText(/file blocked before upload/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/~\$U-DOLE\.docx/i)).not.toBeInTheDocument();
        expect(screen.getByText('1 files · 1 folders · 6 B')).toBeInTheDocument();
        expect(screen.getByText('Preflight')).toBeInTheDocument();
    });

    it('reveals range years only when multi-year coverage is enabled', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: {
                files: [buildFolderFile('VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf')],
            },
        });

        expect(screen.getByLabelText('Year')).toBeInTheDocument();
        expect(screen.queryByLabelText('To Year')).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('This batch spans multiple years'));

        expect(screen.getByLabelText('From Year')).toBeInTheDocument();
        expect(screen.getByLabelText('To Year')).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('This batch spans multiple years'));

        expect(screen.getByLabelText('Year')).toBeInTheDocument();
        expect(screen.queryByLabelText('To Year')).not.toBeInTheDocument();
    });

    it('shows a large-batch warning when the selected root folder contains many files', () => {
        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        const files = Array.from({ length: 1000 }, (_, index) =>
            buildCustomFolderFile(`VESSEL 1/KOTA HAKIM/BATCH-${index + 1}.pdf`, { type: 'application/pdf' }),
        );

        fireEvent.change(folderInput!, {
            target: { files },
        });

        expect(screen.getByText(/large legacy batch detected/i)).toBeInTheDocument();
        expect(screen.getByText(/register the manifest in smaller chunks before upload starts/i)).toBeInTheDocument();
    });

    it('creates, uploads, completes, and finalizes a legacy batch', async () => {
        const onOpenBatches = vi.fn();
        const uploadPath = 'VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf';
        const uploadRequest = createDeferred<Response>();

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

        vi.mocked(fetch).mockImplementation(() => uploadRequest.promise);

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

        await waitFor(() => {
            expect(screen.getByText('Uploading batch')).toBeInTheDocument();
        });
        expect(screen.queryByRole('button', { name: /resume upload/i })).not.toBeInTheDocument();

        uploadRequest.resolve({
            ok: true,
            status: 200,
        } as Response);

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
        expect(appendManifestMutateAsync).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /open batch list/i }));

        expect(onOpenBatches).toHaveBeenCalledTimes(1);
    });

    it('shows resuming status only for an interrupted batch that is actually being resumed', async () => {
        const resumeBatch = buildBatch({
            id: 'resume-batch-1',
            batchName: 'VESSEL 1 Interrupted',
            status: 'interrupted',
            statusLabel: 'Interrupted',
            fileCount: 1,
            uploadSummary: {
                expected: 1,
                uploaded: 0,
                failed: 0,
                remaining: 1,
            },
            remainingRelativePaths: ['VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf'],
        });

        useLegacyBatchMock.mockReturnValue({
            data: resumeBatch,
        });

        signUploadsMutateAsync.mockResolvedValue({
            batchId: 'resume-batch-1',
            status: 'uploading',
            uploads: [
                {
                    relativePath: 'VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf',
                    uploadUrl: 'https://upload.test/resume',
                    headers: {},
                    method: 'PUT',
                },
            ],
        });

        completeUploadsMutateAsync.mockResolvedValue(
            buildBatch({
                id: 'resume-batch-1',
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
                id: 'resume-batch-1',
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
                    children: [],
                },
                remainingRelativePaths: [],
            }),
        );

        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
        } as Response);

        const { container } = render(<LegacyFolderUploadView resumeBatchId="resume-batch-1" />);
        const folderInput = container.querySelector('input[type="file"]');

        await waitFor(() => {
            expect(screen.getByText('Interrupted Batch')).toBeInTheDocument();
        });

        fireEvent.change(folderInput!, {
            target: {
                files: [buildFolderFile('VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf')],
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /resume legacy ingestion/i }));

        await waitFor(() => {
            expect(screen.getByText('Resuming batch upload')).toBeInTheDocument();
        });
        expect(screen.queryByRole('button', { name: /resume upload/i })).not.toBeInTheDocument();

        expect(await screen.findByText('Ingestion complete')).toBeInTheDocument();
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
        expect(screen.getByLabelText('Year')).toHaveValue('2026');
        expect(screen.getByLabelText('This batch spans multiple years')).not.toBeChecked();
        expect(screen.getByDisplayValue('Brokerage')).toBeInTheDocument();
        expect(screen.getByText('Remaining Files')).toBeInTheDocument();
    });

    it('registers additional manifest chunks before uploading large legacy batches', async () => {
        const uploadPathPrefix = 'VESSEL 1/KOTA HAKIM';
        const files = Array.from({ length: 251 }, (_, index) =>
            buildCustomFolderFile(`${uploadPathPrefix}/FILE-${index + 1}.pdf`, { type: 'application/pdf' }),
        );

        createBatchMutateAsync.mockResolvedValue(
            buildBatch({
                fileCount: 251,
                totalSizeBytes: 1506,
                totalSize: '1.47 KB',
                uploadSummary: {
                    expected: 251,
                    uploaded: 0,
                    failed: 0,
                    remaining: 251,
                },
                remainingRelativePaths: [files[0].webkitRelativePath],
            }),
        );
        appendManifestMutateAsync.mockResolvedValue({
            batchId: 'legacy-batch-1',
            registeredFileCount: 251,
            expectedFileCount: 251,
            remainingManifestFiles: 0,
        });
        signUploadsMutateAsync.mockResolvedValue({
            batchId: 'legacy-batch-1',
            status: 'uploading',
            uploads: files.map((file) => ({
                relativePath: file.webkitRelativePath,
                uploadUrl: `https://upload.test/${encodeURIComponent(file.webkitRelativePath)}`,
                headers: {},
                method: 'PUT' as const,
            })),
        });
        completeUploadsMutateAsync.mockResolvedValue(
            buildBatch({
                fileCount: 251,
                status: 'uploading',
                statusLabel: 'Uploading',
                uploadedFileCount: 251,
                pendingFileCount: 0,
                uploadSummary: {
                    expected: 251,
                    uploaded: 251,
                    failed: 0,
                    remaining: 0,
                },
            }),
        );
        finalizeBatchMutateAsync.mockResolvedValue(
            buildBatch({
                fileCount: 251,
                status: 'completed',
                statusLabel: 'Completed',
                canResume: false,
                uploadedFileCount: 251,
                pendingFileCount: 0,
                uploadSummary: {
                    expected: 251,
                    uploaded: 251,
                    failed: 0,
                    remaining: 0,
                },
                tree: {
                    name: 'VESSEL 1',
                    type: 'folder',
                    children: [],
                },
                remainingRelativePaths: [],
            }),
        );
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
        } as Response);

        const { container } = render(<LegacyFolderUploadView />);
        const folderInput = container.querySelector('input[type="file"]');

        fireEvent.change(folderInput!, {
            target: { files },
        });
        fireEvent.change(screen.getByLabelText('Batch Name'), {
            target: { value: 'VESSEL 1 Large Batch' },
        });
        fireEvent.change(screen.getByLabelText('Year'), {
            target: { value: '2026' },
        });
        fireEvent.change(screen.getByLabelText('Department'), {
            target: { value: 'Brokerage' },
        });

        fireEvent.click(screen.getByRole('button', { name: /start legacy ingestion/i }));

        expect(await screen.findByText('Ingestion complete')).toBeInTheDocument();
        expect(createBatchMutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                expectedFileCount: 251,
                totalSizeBytes: expect.any(Number),
            }),
        );
        expect(createBatchMutateAsync.mock.calls[0]?.[0].files).toHaveLength(250);
        expect(appendManifestMutateAsync).toHaveBeenCalledTimes(1);
        expect(appendManifestMutateAsync).toHaveBeenCalledWith({
            batchId: 'legacy-batch-1',
            files: [
                expect.objectContaining({
                    relativePath: files[250].webkitRelativePath,
                }),
            ],
        });
        expect(signUploadsMutateAsync).toHaveBeenCalledTimes(26);
        expect(signUploadsMutateAsync).toHaveBeenNthCalledWith(1, {
            batchId: 'legacy-batch-1',
            relativePaths: files.slice(0, 10).map((file) => file.webkitRelativePath),
        });
        expect(signUploadsMutateAsync).toHaveBeenNthCalledWith(26, {
            batchId: 'legacy-batch-1',
            relativePaths: [files[250].webkitRelativePath],
        });
    });

    it('shows the first backend validation message when legacy batch creation fails with 422', async () => {
        createBatchMutateAsync.mockRejectedValue({
            response: {
                data: {
                    message: 'The given data was invalid.',
                    errors: {
                        files: ['Blocked file type detected in selected legacy folder.'],
                    },
                },
            },
        });

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
        fireEvent.change(screen.getByLabelText('Department'), {
            target: { value: 'Brokerage' },
        });

        fireEvent.click(screen.getByRole('button', { name: /start legacy ingestion/i }));

        expect(await screen.findByText('Upload failed')).toBeInTheDocument();
        expect(screen.getByText('Blocked file type detected in selected legacy folder.')).toBeInTheDocument();
        expect(screen.queryByText('Request failed with status code 422')).not.toBeInTheDocument();
    });
});
