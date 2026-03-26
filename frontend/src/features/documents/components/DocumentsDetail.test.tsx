import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { appRoutes } from '../../../lib/appRoutes';
import {
    makeApiDocument,
    makeImportDetailResult,
} from '../../../test/fixtures/tracking';
import { createTestQueryClient } from '../../../test/renderWithProviders';
import { DocumentsDetail } from './DocumentsDetail';

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

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../tracking/hooks/useTransactionDetail', () => ({
    useTransactionDetail: mockUseTransactionDetail,
}));

vi.mock('../../auth', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useDocuments', () => ({
    useDocuments: mockUseDocuments,
}));

vi.mock('../hooks/useUploadDocument', () => ({
    useUploadDocument: mockUseUploadDocument,
}));

vi.mock('../../tracking/hooks/useDocumentPreview', () => ({
    useDocumentPreview: mockUseDocumentPreview,
}));

vi.mock('../../../components/modals/UploadModal', () => ({
    UploadModal: () => null,
}));

vi.mock('../../../components/modals/FilePreviewModal', () => ({
    FilePreviewModal: () => null,
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: {
        downloadDocument: vi.fn(),
    },
}));

type TestEntry = string | { pathname: string; state?: unknown };

function renderDocumentsDetail(entry: TestEntry, extraRoutes: Array<{ path: string; element: ReactElement }>) {
    const queryClient = createTestQueryClient();

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[entry]}>
                <Routes>
                    <Route path={appRoutes.documentDetail} element={<DocumentsDetail />} />
                    {extraRoutes.map((route) => (
                        <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('DocumentsDetail', () => {
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
                customs_ref_no: 'REF82713871',
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

    it('returns to admin document review when opened from the admin review flow', () => {
        renderDocumentsDetail(
            {
                pathname: '/documents/REF82713871',
                state: {
                    backTo: appRoutes.adminDocumentReview,
                    backLabel: 'Back to Admin Review',
                },
            },
            [
                {
                    path: appRoutes.adminDocumentReview,
                    element: <div>Admin review route</div>,
                },
            ],
        );

        fireEvent.click(screen.getByRole('button', { name: 'Back to Admin Review' }));

        expect(screen.getByText('Admin review route')).toBeInTheDocument();
    });

    it('falls back to the encoder documents list when no origin route was provided', () => {
        renderDocumentsDetail(
            '/documents/REF82713871',
            [
                {
                    path: appRoutes.documents,
                    element: <div>Documents list route</div>,
                },
            ],
        );

        fireEvent.click(screen.getByRole('button', { name: 'Back to Documents' }));

        expect(screen.getByText('Documents list route')).toBeInTheDocument();
    });

    it('hides the upload action for admins reviewing finalized records', () => {
        mockUseAuth.mockReturnValue({
            user: {
                role: 'admin',
            },
        });

        renderDocumentsDetail(
            {
                pathname: '/documents/REF82713871',
                state: {
                    backTo: appRoutes.adminDocumentReview,
                    backLabel: 'Back to Admin Review',
                },
            },
            [],
        );

        expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
    });

    it('keeps the upload action for encoders on the documents page', () => {
        renderDocumentsDetail(
            '/documents/REF82713871',
            [],
        );

        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    });
});
