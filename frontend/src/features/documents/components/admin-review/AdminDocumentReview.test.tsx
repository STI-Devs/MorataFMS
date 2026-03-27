import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { AdminDocumentReview } from './AdminDocumentReview';

const {
    mockUseDebounce,
    mockUseReviewQueue,
    mockUseReviewDetail,
    mockUseReviewStats,
    mockUseArchiveReviewedTransaction,
    mockUseEncoders,
    mockHandlePreviewDoc,
} = vi.hoisted(() => ({
    mockUseDebounce: vi.fn(),
    mockUseReviewQueue: vi.fn(),
    mockUseReviewDetail: vi.fn(),
    mockUseReviewStats: vi.fn(),
    mockUseArchiveReviewedTransaction: vi.fn(),
    mockUseEncoders: vi.fn(),
    mockHandlePreviewDoc: vi.fn(),
}));

vi.mock('../../../../hooks/useDebounce', () => ({
    useDebounce: mockUseDebounce,
}));

vi.mock('../../hooks/useAdminReview', () => ({
    useReviewQueue: mockUseReviewQueue,
    useReviewDetail: mockUseReviewDetail,
    useReviewStats: mockUseReviewStats,
    useArchiveReviewedTransaction: mockUseArchiveReviewedTransaction,
}));

vi.mock('../../../oversight/hooks/useTransactions', () => ({
    useEncoders: mockUseEncoders,
}));

vi.mock('../../../tracking/hooks/useDocumentPreview', () => ({
    useDocumentPreview: () => ({
        handlePreviewDoc: mockHandlePreviewDoc,
    }),
}));

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: {
        downloadDocument: vi.fn(),
    },
}));

vi.mock('../../../../hooks/useTransactionSyncSubscription', () => ({
    useTransactionSyncSubscription: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

const queueResponse = {
    data: [
        {
            id: 1,
            type: 'import' as const,
            ref: 'IMP-0921',
            bl_number: 'BL-98210344',
            client: 'Global Tech Corp',
            assigned_user: 'Sarah Velasco',
            assigned_user_id: 7,
            status: 'Completed',
            finalized_date: '2026-03-20T14:30:00Z',
            docs_count: 4,
            docs_total: 6,
            has_exceptions: true,
            archive_ready: false,
            readiness: 'flagged' as const,
        },
    ],
    meta: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
    },
};

const detailResponse = {
    transaction: {
        id: 1,
        type: 'import' as const,
        ref: 'IMP-0921',
        bl_number: 'BL-98210344',
        client: 'Global Tech Corp',
        assigned_user: 'Sarah Velasco',
        assigned_user_id: 7,
        status: 'Completed',
        finalized_date: '2026-03-20T14:30:00Z',
    },
    required_documents: [
        {
            type_key: 'boc',
            label: 'BOC Document Processing',
            uploaded: true,
            file: {
                id: 101,
                filename: 'boc_declaration.pdf',
                size: '2.4 MB',
                uploaded_by: 'Sarah Velasco',
                uploaded_at: '2026-03-18T10:00:00Z',
            },
        },
        {
            type_key: 'ppa',
            label: 'Payment for PPA Charges',
            uploaded: false,
            file: null,
        },
    ],
    uploaded_documents: [
        {
            id: 101,
            type_key: 'boc',
            label: 'BOC Document Processing',
            filename: 'boc_declaration.pdf',
            size: '2.4 MB',
            uploaded_by: 'Sarah Velasco',
            uploaded_at: '2026-03-18T10:00:00Z',
        },
        {
            id: 102,
            type_key: 'others',
            label: 'Other Documents',
            filename: 'supporting_note.pdf',
            size: '820 KB',
            uploaded_by: 'Sarah Velasco',
            uploaded_at: '2026-03-19T11:30:00Z',
        },
    ],
    remarks: [
        {
            id: 1,
            body: 'Missing final BL from carrier',
            author: 'Admin User',
            resolved: false,
            created_at: '2026-03-19T08:00:00Z',
        },
    ],
    summary: {
        total_uploaded: 5,
        required_completed: 4,
        required_total: 6,
        missing_count: 2,
        flagged_count: 1,
        archive_ready: false,
        readiness: 'flagged' as const,
    },
};

const readyDetailResponse = {
    ...detailResponse,
    summary: {
        total_uploaded: 6,
        required_completed: 6,
        required_total: 6,
        missing_count: 0,
        flagged_count: 0,
        archive_ready: true,
        readiness: 'ready' as const,
    },
};

describe('AdminDocumentReview', () => {
    beforeEach(() => {
        mockUseDebounce.mockReset();
        mockUseReviewQueue.mockReset();
        mockUseReviewDetail.mockReset();
        mockUseReviewStats.mockReset();
        mockUseArchiveReviewedTransaction.mockReset();
        mockUseEncoders.mockReset();
        mockHandlePreviewDoc.mockReset();

        mockUseDebounce.mockImplementation((value: string) => value);
        mockUseReviewStats.mockReturnValue({
            data: {
                completed_count: 24,
                cancelled_count: 3,
                missing_docs_count: 8,
                archive_ready_count: 16,
            },
            isLoading: false,
        });
        mockUseReviewQueue.mockReturnValue({
            data: queueResponse,
            isLoading: false,
            isError: false,
            isFetching: false,
            refetch: vi.fn(),
        });
        mockUseReviewDetail.mockImplementation((type: string | null, id: number | null) => ({
            data: type === 'import' && id === 1 ? detailResponse : undefined,
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        }));
        mockUseArchiveReviewedTransaction.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        });
        mockUseEncoders.mockReturnValue({
            data: [
                { id: 7, name: 'Sarah Velasco', email: 'sarah@example.com', role: 'encoder' },
                { id: 8, name: 'Mike Tan', email: 'mike@example.com', role: 'encoder' },
                { id: 9, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
            ],
        });
    });

    it('renders queue data and loads detail when a transaction is selected', async () => {
        renderWithProviders(<AdminDocumentReview />);

        expect(screen.getByText('Admin Document Review')).toBeInTheDocument();
        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByTestId('admin-review-kpi-strip')).toBeInTheDocument();
        expect(screen.getByTestId('admin-review-workspace')).toBeInTheDocument();
        expect(screen.getByText('BL-98210344')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /BL-98210344/i }));

        await waitFor(() => {
            expect(screen.getAllByText('BOC Document Processing').length).toBeGreaterThan(0);
        });

        expect(screen.getByText('Document Checklist')).toBeInTheDocument();
        expect(screen.getByText('Remarks & Exceptions')).toBeInTheDocument();
        expect(screen.getByText('Payment for PPA Charges')).toBeInTheDocument();
        expect(screen.getByText('Additional Uploads')).toBeInTheDocument();
        expect(screen.getByText('supporting_note.pdf')).toBeInTheDocument();
        expect(screen.getByText('Missing final BL from carrier')).toBeInTheDocument();
        expect(screen.getAllByText('Flagged').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /move to archive/i })).toBeDisabled();
    });

    it('keeps the queue pane roomier while tightening the detail header side panel', async () => {
        renderWithProviders(<AdminDocumentReview />);

        expect(screen.getByTestId('admin-review-queue-pane')).toHaveClass(
            'lg:w-[38%]',
            'lg:min-w-[22rem]',
            'lg:max-w-[30rem]',
        );

        fireEvent.click(screen.getByRole('button', { name: /BL-98210344/i }));

        await waitFor(() => {
            expect(screen.getByTestId('admin-review-detail-header')).toBeInTheDocument();
        });
    });

    it('wires search and filter controls into the queue query params', async () => {
        renderWithProviders(<AdminDocumentReview />);

        expect(screen.queryByRole('option', { name: 'Admin User' })).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Search BL, ref, or client...'), {
            target: { value: 'Acme' },
        });

        await waitFor(() => {
            expect(mockUseReviewQueue).toHaveBeenLastCalledWith({
                page: 1,
                per_page: 10,
                search: 'Acme',
                type: 'all',
                status: 'all',
                readiness: 'all',
                assigned_user_id: undefined,
            });
        });

        fireEvent.change(screen.getByDisplayValue('All Types'), {
            target: { value: 'export' },
        });
        fireEvent.change(screen.getByDisplayValue('All Statuses'), {
            target: { value: 'cancelled' },
        });

        fireEvent.change(screen.getByDisplayValue('All Readiness'), {
            target: { value: 'flagged' },
        });
        fireEvent.change(screen.getByDisplayValue('All Encoders'), {
            target: { value: '7' },
        });

        await waitFor(() => {
            expect(mockUseReviewQueue).toHaveBeenLastCalledWith({
                page: 1,
                per_page: 10,
                search: 'Acme',
                type: 'export',
                status: 'cancelled',
                readiness: 'flagged',
                assigned_user_id: 7,
            });
        });
    });

    it('shows the empty state when no reviewable transactions are returned', () => {
        mockUseReviewQueue.mockReturnValue({
            data: {
                data: [],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    total: 0,
                },
            },
            isLoading: false,
            isError: false,
            isFetching: false,
            refetch: vi.fn(),
        });

        renderWithProviders(<AdminDocumentReview />);

        expect(screen.getByText('No files in review')).toBeInTheDocument();
        expect(
            screen.getByText('Finalized transactions will appear here once they need archive review.'),
        ).toBeInTheDocument();
    });

    it('shows an active archive button for ready transactions and triggers the archive mutation', async () => {
        const mutate = vi.fn();

        mockUseReviewDetail.mockImplementation((type: string | null, id: number | null) => ({
            data: type === 'import' && id === 1 ? readyDetailResponse : undefined,
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        }));
        mockUseArchiveReviewedTransaction.mockReturnValue({
            mutate,
            isPending: false,
        });

        renderWithProviders(<AdminDocumentReview />);

        fireEvent.click(screen.getByRole('button', { name: /BL-98210344/i }));

        await waitFor(() => {
            expect(screen.getAllByText('Archive Ready').length).toBeGreaterThan(0);
        });

        const archiveButton = screen.getByRole('button', { name: /move to archive/i });
        expect(archiveButton).toBeEnabled();

        fireEvent.click(archiveButton);

        expect(mutate).toHaveBeenCalledWith(
            { type: 'import', id: 1 },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        );
    });
});
