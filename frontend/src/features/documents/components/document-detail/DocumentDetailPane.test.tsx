import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { appRoutes } from '../../../../lib/appRoutes';
import {
    makeApiDocument,
    makeImportDetailResult,
} from '../../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { DocumentDetailPane } from './DocumentDetailPane';

const {
    mockUseAuth,
    mockUseDocumentPreview,
    mockUseDocuments,
    mockUseTransactionDetail,
    mockUseUploadDocument,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseDocumentPreview: vi.fn(),
    mockUseDocuments: vi.fn(),
    mockUseTransactionDetail: vi.fn(),
    mockUseUploadDocument: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../../tracking/hooks/useTransactionDetail', () => ({
    useTransactionDetail: mockUseTransactionDetail,
}));

vi.mock('../../../auth', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/useDocuments', () => ({
    useDocuments: mockUseDocuments,
}));

vi.mock('../../hooks/useUploadDocument', () => ({
    useUploadDocument: mockUseUploadDocument,
}));

vi.mock('../../../tracking/hooks/useDocumentPreview', () => ({
    useDocumentPreview: mockUseDocumentPreview,
}));

vi.mock('../../../../components/modals/UploadModal', () => ({
    UploadModal: () => null,
}));

vi.mock('../../../../components/modals/FilePreviewModal', () => ({
    FilePreviewModal: () => null,
}));

vi.mock('../../../../hooks/useTransactionSyncSubscription', () => ({
    useTransactionSyncSubscription: () => null,
}));

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: {
        downloadDocument: vi.fn(),
    },
}));

const REF = 'REF82713871';

function renderPane(ref: string | null) {
    return renderWithProviders(<DocumentDetailPane ref={ref} />, {
        route: ref ? `${appRoutes.documents}?ref=${ref}` : appRoutes.documents,
        path: appRoutes.documents,
    });
}

describe('DocumentDetailPane', () => {
    beforeEach(() => {
        mockUseAuth.mockReset();
        mockUseDocumentPreview.mockReset();
        mockUseDocuments.mockReset();
        mockUseTransactionDetail.mockReset();
        mockUseUploadDocument.mockReset();

        mockUseAuth.mockReturnValue({
            user: {
                role: 'encoder',
            },
        });
        mockUseDocumentPreview.mockReturnValue({
            previewFile: null,
            setPreviewFile: vi.fn(),
            handlePreviewDoc: vi.fn(),
        });
        mockUseTransactionDetail.mockReturnValue({
            data: makeImportDetailResult({
                customs_ref_no: REF,
                status: 'Completed',
            }),
            isLoading: false,
        });
        mockUseDocuments.mockReturnValue({
            data: [makeApiDocument({ id: 901, filename: 'review.pdf' })],
            isLoading: false,
        });
        mockUseUploadDocument.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        });
    });

    it('shows a placeholder when no transaction is selected', () => {
        renderPane(null);

        expect(screen.getByText('Select a document to view details')).toBeInTheDocument();
    });

    it('shows a loading state while the transaction is being fetched', () => {
        mockUseTransactionDetail.mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        renderPane(REF);

        expect(screen.getByText('Loading transaction…')).toBeInTheDocument();
    });

    it('shows a not-found state when the reference does not exist', () => {
        mockUseTransactionDetail.mockReturnValue({
            data: undefined,
            isLoading: false,
        });

        renderPane(REF);

        expect(screen.getByText(`Transaction "${REF}" not found`)).toBeInTheDocument();
    });

    it('shows the in-progress state with a link to tracking for non-finalized transactions', () => {
        mockUseTransactionDetail.mockReturnValue({
            data: makeImportDetailResult({
                customs_ref_no: REF,
                status: 'In Progress',
            }),
            isLoading: false,
        });

        renderPane(REF);

        expect(screen.getByText('Transaction Still In Progress')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go to Tracking' })).toBeInTheDocument();
    });

    it('hides the upload action for admins reviewing finalized records', () => {
        mockUseAuth.mockReturnValue({
            user: {
                role: 'admin',
            },
        });

        renderPane(REF);

        expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
    });

    it('keeps the upload action for encoders on the documents page', () => {
        renderPane(REF);

        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    });

    it('shows the document stage badge beside the file name', () => {
        mockUseDocuments.mockReturnValue({
            data: [makeApiDocument({ id: 901, filename: 'review.pdf', type: 'port_charges' })],
            isLoading: false,
        });

        renderPane(REF);

        expect(screen.getByText('Payment for Port Charges')).toBeInTheDocument();
    });
});
