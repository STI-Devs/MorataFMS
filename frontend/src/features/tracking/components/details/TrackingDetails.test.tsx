import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import {
    makeApiDocument,
    makeExportDetailResult,
    makeImportDetailResult,
} from '../../../../test/fixtures/tracking';
import { createTestQueryClient, renderWithProviders } from '../../../../test/renderWithProviders';
import { trackingKeys } from '../../utils/queryKeys';
import { TrackingDetails } from './TrackingDetails';

const {
    mockDeleteDocument,
    mockDownloadDocument,
    mockUploadDocuments,
    mockUpdateExportStageApplicability,
    mockUpdateImportStageApplicability,
    mockUseAddDocumentToCache,
    mockUseDocumentPreview,
    mockUseTransactionDetail,
    mockUseTransactionDocuments,
    uploadCacheSpy,
} = vi.hoisted(() => ({
    mockDeleteDocument: vi.fn(),
    mockDownloadDocument: vi.fn(),
    mockUploadDocuments: vi.fn(),
    mockUpdateExportStageApplicability: vi.fn(),
    mockUpdateImportStageApplicability: vi.fn(),
    mockUseAddDocumentToCache: vi.fn(),
    mockUseDocumentPreview: vi.fn(),
    mockUseTransactionDetail: vi.fn(),
    mockUseTransactionDocuments: vi.fn(),
    uploadCacheSpy: vi.fn(),
}));

vi.mock('../../hooks/useTransactionDetail', () => ({
    useTransactionDetail: mockUseTransactionDetail,
}));

vi.mock('../../hooks/useTransactionDocuments', () => ({
    useTransactionDocuments: mockUseTransactionDocuments,
    useAddDocumentToCache: mockUseAddDocumentToCache,
}));

vi.mock('../../hooks/useDocumentPreview', () => ({
    useDocumentPreview: mockUseDocumentPreview,
}));

vi.mock('../../api/trackingApi', () => ({
    trackingApi: {
        deleteDocument: mockDeleteDocument,
        downloadDocument: mockDownloadDocument,
        uploadDocuments: mockUploadDocuments,
        updateExportStageApplicability: mockUpdateExportStageApplicability,
        updateImportStageApplicability: mockUpdateImportStageApplicability,
    },
}));

vi.mock('../../../../hooks/useTransactionSyncSubscription', () => ({
    useTransactionSyncSubscription: vi.fn(),
}));

vi.mock('./TrackingDetailsSkeleton', () => ({
    TrackingDetailsSkeleton: () => <div>Tracking details skeleton</div>,
}));

vi.mock('./TrackingHeader', () => ({
    TrackingHeader: ({
        transaction,
        onRemarksClick,
        onEditClick,
    }: {
        transaction: { status: string; ref: string };
        onRemarksClick: () => void;
        onEditClick: () => void;
    }) => (
        <div>
            <h1>{transaction.ref}</h1>
            <span data-testid="tracking-status">{transaction.status}</span>
            <button onClick={onRemarksClick}>Open remarks</button>
            <button onClick={onEditClick}>Open edit</button>
        </div>
    ),
}));

vi.mock('./TransactionInfoCard', () => ({
    TransactionInfoCard: () => <div>Transaction info card</div>,
}));

vi.mock('../lists/StageRow', () => ({
    StageRow: ({
        index,
        stage,
        stageStatus,
        docs,
        uploadDisabledReason,
        onUploadClick,
        onPreviewDoc,
        onDeleteDoc,
        onReplaceDoc,
    }: {
        index: number;
        stage: { title: string };
        stageStatus: string;
        docs: Array<{ filename: string }>;
        uploadDisabledReason?: string | null;
        onUploadClick: (index: number) => void;
        onPreviewDoc: (doc: { filename: string }) => void;
        onDeleteDoc: (doc: { filename: string }) => void;
        onReplaceDoc: (index: number, doc: { filename: string }) => void;
    }) => (
        <div data-testid={`stage-row-${index}`}>
            <span>{stage.title}</span>
            <span data-testid={`stage-status-${index}`}>{stageStatus}</span>
            {docs.length > 0 ? (
                <>
                    <span>{docs[0].filename}</span>
                    <button onClick={() => onPreviewDoc(docs[0])}>Preview {index}</button>
                    <button onClick={() => onDeleteDoc(docs[0])}>Delete {index}</button>
                    <button onClick={() => onReplaceDoc(index, docs[0])}>Replace {index}</button>
                </>
            ) : (
                <button disabled={!!uploadDisabledReason} onClick={() => onUploadClick(index)}>
                    Upload {index}
                </button>
            )}
        </div>
    ),
}));

vi.mock('../../../../components/modals/UploadModal', () => ({
    UploadModal: ({
        isOpen,
        title,
        onClose,
        onUpload,
    }: {
        isOpen: boolean;
        title: string;
        onClose: () => void;
        onUpload: (files: File[]) => Promise<void> | void;
    }) => (
        isOpen ? (
            <div>
                <span>Upload modal: {title}</span>
                <button onClick={() => onUpload([new File(['document'], 'replacement.pdf', { type: 'application/pdf' })])}>
                    Confirm upload
                </button>
                <button onClick={onClose}>Close upload</button>
            </div>
        ) : null
    ),
}));

vi.mock('../../../../components/modals/FilePreviewModal', () => ({
    FilePreviewModal: ({
        isOpen,
        fileName,
        onClose,
        onDownload,
    }: {
        isOpen: boolean;
        fileName?: string;
        onClose: () => void;
        onDownload?: () => void;
    }) => (
        isOpen ? (
            <div>
                <span>Preview modal: {fileName}</span>
                <button onClick={onDownload}>Download preview</button>
                <button onClick={onClose}>Close preview</button>
            </div>
        ) : null
    ),
}));

vi.mock('../modals/EditTransactionModal', () => ({
    default: ({
        isOpen,
        onClose,
    }: {
        isOpen: boolean;
        onClose: () => void;
    }) => (
        isOpen ? (
            <div>
                <span>Edit modal open</span>
                <button onClick={onClose}>Close edit</button>
            </div>
        ) : null
    ),
}));

vi.mock('../modals/RemarkViewerModal', () => ({
    RemarkViewerModal: ({
        isOpen,
        onClose,
    }: {
        isOpen: boolean;
        onClose: () => void;
    }) => (
        isOpen ? (
            <div>
                <span>Remark modal open</span>
                <button onClick={onClose}>Close remarks</button>
            </div>
        ) : null
    ),
}));

describe('TrackingDetails', () => {
    beforeEach(() => {
        mockDeleteDocument.mockReset();
        mockDownloadDocument.mockReset();
        mockUploadDocuments.mockReset();
        mockUpdateExportStageApplicability.mockReset();
        mockUpdateImportStageApplicability.mockReset();
        mockUseAddDocumentToCache.mockReset();
        mockUseDocumentPreview.mockReset();
        mockUseTransactionDetail.mockReset();
        mockUseTransactionDocuments.mockReset();
        uploadCacheSpy.mockReset();

        mockUseAddDocumentToCache.mockReturnValue(uploadCacheSpy);
        mockUseDocumentPreview.mockReturnValue({
            previewFile: null,
            setPreviewFile: vi.fn(),
            handlePreviewDoc: vi.fn(),
        });
    });

    it('renders the loading skeleton while transaction or document data is pending', () => {
        mockUseTransactionDetail.mockReturnValue({ data: undefined, isLoading: true });
        mockUseTransactionDocuments.mockReturnValue({ byStageIndex: {}, isLoading: false });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
        });

        expect(screen.getByText('Tracking details skeleton')).toBeInTheDocument();
    });

    it('renders the not found state when the transaction does not exist', () => {
        mockUseTransactionDetail.mockReturnValue({ data: null, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({ byStageIndex: {}, isLoading: false });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
        });

        expect(screen.getByText('Transaction Not Found')).toBeInTheDocument();
        expect(screen.getByText('IMP-2026-001')).toBeInTheDocument();
    });

    it('shows a finalized notice and lets the user open the documents detail route', async () => {
        mockUseTransactionDetail.mockImplementation((referenceId: string | undefined, options?: { scope?: 'tracking' | 'record' }) => {
            if (options?.scope === 'record') {
                return {
                    data: makeImportDetailResult({
                        customs_ref_no: referenceId ?? 'IMP-2026-001',
                        status: 'Completed',
                    }),
                    isLoading: false,
                };
            }

            return { data: null, isLoading: false };
        });
        mockUseTransactionDocuments.mockReturnValue({ byStageIndex: {}, isLoading: false });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
            routes: [
                {
                    path: appRoutes.documentDetail,
                    element: <div>Documents detail route</div>,
                },
            ],
        });

        expect(screen.getByText('Tracking Has Ended')).toBeInTheDocument();
        expect(screen.getByText(/IMP-2026-001/)).toBeInTheDocument();
        expect(screen.getByText(/is already/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Open Documents' }));

        await waitFor(() => {
            expect(screen.getByText('Documents detail route')).toBeInTheDocument();
        });
    });

    it('derives the display status and stage progression from the available documents', () => {
        const detail = makeImportDetailResult({
            customs_ref_no: 'IMP-2026-002',
            status: 'Pending',
        });

        mockUseTransactionDetail.mockReturnValue({ data: detail, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {
                0: [makeApiDocument({ id: 701, type: 'boc', filename: 'boc.pdf' })],
                1: [makeApiDocument({ id: 702, type: 'bonds', filename: 'bond.pdf' })],
            },
            isLoading: false,
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-002',
            path: appRoutes.trackingDetail,
        });

        expect(screen.getByTestId('tracking-status')).toHaveTextContent('Processing');
        expect(screen.getByTestId('stage-status-0')).toHaveTextContent('completed');
        expect(screen.getByTestId('stage-status-1')).toHaveTextContent('completed');
        expect(screen.getByTestId('stage-status-2')).toHaveTextContent('active');
    });

    it('does not advance the display status when only an optional stage is marked as N/A', () => {
        const detail = makeImportDetailResult({
            customs_ref_no: 'IMP-2026-003',
            status: 'Pending',
            not_applicable_stages: ['bonds'],
        });

        mockUseTransactionDetail.mockReturnValue({ data: detail, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {
                0: [makeApiDocument({ id: 720, type: 'boc', filename: 'boc.pdf' })],
            },
            isLoading: false,
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-003',
            path: appRoutes.trackingDetail,
        });

        expect(screen.getByTestId('tracking-status')).toHaveTextContent('Vessel Arrived');
    });

    it('surfaces open admin remarks as a prominent action banner', () => {
        const detail = makeImportDetailResult({
            customs_ref_no: 'IMP-2026-004',
            open_remarks_count: 3,
        });

        mockUseTransactionDetail.mockReturnValue({ data: detail, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {},
            isLoading: false,
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-004',
            path: appRoutes.trackingDetail,
        });

        expect(screen.getByText('Action required: 3 open admin remarks')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /review remarks/i }));

        expect(screen.getByText('Remark modal open')).toBeInTheDocument();
    });

    it('shows the export bill of lading as the visible reference and keeps future stages locked', () => {
        const detail = makeExportDetailResult({
            bl_no: 'BL-EXPORT-900',
            status: 'Pending',
            export_date: '2026-04-20',
        });

        mockUseTransactionDetail.mockReturnValue({ data: detail, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {},
            isLoading: false,
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/BL-EXPORT-900',
            path: appRoutes.trackingDetail,
        });

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BL-EXPORT-900');
        expect(screen.getByRole('button', { name: 'Upload 0' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Upload 1' })).toBeDisabled();
    });

    it('opens and closes the remarks, edit, upload, and preview flows through the screen wiring', async () => {
        const previewHandler = vi.fn();
        const clearPreview = vi.fn();
        const doc = makeApiDocument({ id: 703, filename: 'invoice.pdf', type: 'boc' });

        mockUseTransactionDetail.mockReturnValue({ data: makeImportDetailResult(), isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {
                0: [doc],
                1: [makeApiDocument({ id: 801, type: 'bonds', filename: 'bonds.pdf' })],
                2: [makeApiDocument({ id: 803, type: 'ppa', filename: 'ppa.pdf' })],
            },
            isLoading: false,
        });
        mockUseDocumentPreview.mockReturnValue({
            previewFile: { file: 'https://example.com/invoice.pdf', name: 'invoice.pdf' },
            setPreviewFile: clearPreview,
            handlePreviewDoc: previewHandler,
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
        });

        fireEvent.click(screen.getByText('Open remarks'));
        expect(screen.getByText('Remark modal open')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Close remarks'));
        await waitFor(() => {
            expect(screen.queryByText('Remark modal open')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Open edit'));
        expect(screen.getByText('Edit modal open')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Close edit'));
        await waitFor(() => {
            expect(screen.queryByText('Edit modal open')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Upload 3'));
        expect(screen.getByText('Upload modal: Delivery Order Request')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Close upload'));
        await waitFor(() => {
            expect(screen.queryByText('Upload modal: Delivery Order Request')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Preview 0'));
        expect(previewHandler).toHaveBeenCalledWith(doc);
        expect(screen.getByText('Preview modal: invoice.pdf')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Close preview'));
        expect(clearPreview).toHaveBeenCalledWith(null);
    });

    it('deletes a document and invalidates the transaction detail query', async () => {
        const doc = makeApiDocument({ id: 704, type: 'boc', filename: 'boc.pdf' });
        const detail = makeImportDetailResult();
        const queryClient = createTestQueryClient();
        const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
        const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

        mockDeleteDocument.mockResolvedValue(undefined);
        mockUseTransactionDetail.mockReturnValue({ data: detail, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: { 0: [doc] },
            isLoading: false,
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
            queryClient,
        });

        fireEvent.click(screen.getByText('Delete 0'));

        await waitFor(() => {
            expect(mockDeleteDocument).toHaveBeenCalledWith(704);
        });

        expect(setQueryDataSpy).toHaveBeenCalledWith(
            trackingKeys.documents.list('App\\Models\\ImportTransaction', detail.raw.id),
            expect.any(Function),
        );
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
            queryKey: trackingKeys.detail('IMP-2026-001'),
        });
    });

    it('uploads a new document for an empty stage and updates the cache through the add-to-cache hook', async () => {
        const detail = makeImportDetailResult();
        const uploadedDoc = makeApiDocument({ id: 705, type: 'do', filename: 'replacement.pdf' });
        const queryClient = createTestQueryClient();
        const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

        mockUploadDocuments.mockResolvedValue([uploadedDoc]);
        mockUseTransactionDetail.mockReturnValue({ data: detail, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {
                0: [makeApiDocument({ id: 706, type: 'boc', filename: 'boc.pdf' })],
                1: [makeApiDocument({ id: 717, type: 'bonds', filename: 'bonds.pdf' })],
                2: [makeApiDocument({ id: 719, type: 'ppa', filename: 'ppa.pdf' })],
            },
            isLoading: false,
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
            queryClient,
        });

        fireEvent.click(screen.getByText('Upload 3'));
        fireEvent.click(screen.getByText('Confirm upload'));

        await waitFor(() => {
            expect(mockUploadDocuments).toHaveBeenCalledWith(
                expect.objectContaining({
                    files: expect.arrayContaining([expect.any(File)]),
                    type: 'do',
                    documentable_type: 'App\\Models\\ImportTransaction',
                    documentable_id: detail.raw.id,
                }),
            );
        });

        expect(uploadCacheSpy).toHaveBeenCalledWith(
            'App\\Models\\ImportTransaction',
            detail.raw.id,
            uploadedDoc,
        );
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
            queryKey: trackingKeys.detail('IMP-2026-001'),
        });
    });

    it('keeps the stage page visible during the 15-second countdown and offers a documents shortcut', async () => {
        let trackingDetail = makeImportDetailResult();
        const uploadedDoc = makeApiDocument({ id: 709, type: 'billing', filename: 'billing.pdf' });
        let isRefreshingAfterCompletion = false;

        mockUploadDocuments.mockImplementation(async () => {
            trackingDetail = null as never;
            isRefreshingAfterCompletion = true;
            return [uploadedDoc];
        });
        mockUseTransactionDetail.mockImplementation((_referenceId: string | undefined, options?: { scope?: 'tracking' | 'record' }) => {
            if (options?.scope === 'record') {
                return { data: null, isLoading: isRefreshingAfterCompletion };
            }

            return { data: trackingDetail, isLoading: isRefreshingAfterCompletion };
        });
        mockUseTransactionDocuments.mockImplementation(() => ({
            byStageIndex: isRefreshingAfterCompletion ? {} : {
                0: [makeApiDocument({ id: 710, type: 'boc', filename: 'boc.pdf' })],
                1: [makeApiDocument({ id: 711, type: 'bonds', filename: 'bonds.pdf' })],
                2: [makeApiDocument({ id: 713, type: 'ppa', filename: 'ppa.pdf' })],
                3: [makeApiDocument({ id: 714, type: 'do', filename: 'do.pdf' })],
                4: [makeApiDocument({ id: 715, type: 'port_charges', filename: 'port-charges.pdf' })],
                5: [makeApiDocument({ id: 716, type: 'releasing', filename: 'releasing.pdf' })],
            },
            isLoading: isRefreshingAfterCompletion,
        }));

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
            routes: [
                {
                    path: appRoutes.documentDetail,
                    element: <div>Documents detail route</div>,
                },
            ],
        });

        fireEvent.click(screen.getByText('Upload 6'));
        fireEvent.click(screen.getByText('Confirm upload'));

        await waitFor(() => {
            expect(screen.getByText('All stages complete!')).toBeInTheDocument();
        });

        expect(screen.getByText('IMP-2026-001')).toBeInTheDocument();
        expect(screen.getByText('Transaction info card')).toBeInTheDocument();
        expect(screen.getByText('billing.pdf')).toBeInTheDocument();
        expect(
            screen.getByText((_, element) => element?.textContent === 'Returning to Import List in 15s…'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Open Documents' })).toBeInTheDocument();
        expect(screen.queryByText('Tracking details skeleton')).not.toBeInTheDocument();
        expect(screen.queryByText('Transaction Not Found')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Open Documents' }));

        await waitFor(() => {
            expect(screen.getByText('Documents detail route')).toBeInTheDocument();
        });
    });

    it('replaces an existing document and keeps download actions wired to the current preview file', async () => {
        const doc = makeApiDocument({ id: 707, type: 'boc', filename: 'invoice.pdf' });
        const replacement = makeApiDocument({ id: 708, type: 'boc', filename: 'replacement.pdf' });
        const detail = makeImportDetailResult();
        const queryClient = createTestQueryClient();
        const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

        mockUploadDocuments.mockResolvedValue([replacement]);
        mockDeleteDocument.mockResolvedValue(undefined);
        mockUseTransactionDetail.mockReturnValue({ data: detail, isLoading: false });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: { 0: [doc] },
            isLoading: false,
        });
        mockUseDocumentPreview.mockReturnValue({
            previewFile: { file: 'https://example.com/invoice.pdf', name: 'invoice.pdf' },
            setPreviewFile: vi.fn(),
            handlePreviewDoc: vi.fn(),
        });

        renderWithProviders(<TrackingDetails />, {
            route: '/tracking/IMP-2026-001',
            path: appRoutes.trackingDetail,
            queryClient,
        });

        fireEvent.click(screen.getByText('Download preview'));
        expect(mockDownloadDocument).toHaveBeenCalledWith(707, 'invoice.pdf');

        fireEvent.click(screen.getByText('Replace 0'));
        fireEvent.click(screen.getByText('Confirm upload'));

        await waitFor(() => {
            expect(mockUploadDocuments).toHaveBeenCalledWith(
                expect.objectContaining({
                    files: expect.arrayContaining([expect.any(File)]),
                    type: 'boc',
                    documentable_type: 'App\\Models\\ImportTransaction',
                    documentable_id: detail.raw.id,
                }),
            );
        });

        expect(mockDeleteDocument).toHaveBeenCalledWith(707);
        expect(setQueryDataSpy).toHaveBeenCalledWith(
            trackingKeys.documents.list('App\\Models\\ImportTransaction', detail.raw.id),
            expect.any(Function),
        );
    });
});
