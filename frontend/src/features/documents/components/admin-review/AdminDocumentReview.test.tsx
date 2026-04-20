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
            vessel: 'MV GLOBAL STAR',
            client: 'Global Tech Corp',
            assigned_user: 'Sarah Velasco',
            assigned_user_id: 7,
            status: 'Completed',
            transaction_date: '2026-03-18',
            finalized_date: '2026-03-20T14:30:00Z',
            docs_count: 4,
            docs_total: 8,
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
        vessel: 'MV GLOBAL STAR',
        client: 'Global Tech Corp',
        assigned_user: 'Sarah Velasco',
        assigned_user_id: 7,
        status: 'Completed',
        transaction_date: '2026-03-18',
        finalized_date: '2026-03-20T14:30:00Z',
    },
    required_documents: [
        {
            type_key: 'boc',
            label: 'BOC Document Processing',
            uploaded: true,
            not_applicable: false,
            files: [{
                id: 101,
                filename: 'boc_declaration.pdf',
                size: '2.4 MB',
                uploaded_by: 'Sarah Velasco',
                uploaded_at: '2026-03-18T10:00:00Z',
            }],
        },
        {
            type_key: 'ppa',
            label: 'Payment for PPA Charges',
            uploaded: false,
            not_applicable: false,
            files: [],
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
        total_uploaded: 2,
        required_completed: 1,
        required_total: 8,
        missing_count: 7,
        flagged_count: 1,
        archive_ready: false,
        readiness: 'flagged' as const,
    },
};

const readyDetailResponse = {
    ...detailResponse,
    summary: {
        total_uploaded: 8,
        required_completed: 8,
        required_total: 8,
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

        expect(screen.getByText('Completed Transactions Overview')).toBeInTheDocument();
        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByTestId('admin-review-kpi-strip')).toBeInTheDocument();
        expect(screen.getByText('Show')).toBeInTheDocument();
        expect(screen.getByText('of 1 pages')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
        const vesselHeader = screen.getByRole('button', { name: /mv global star/i });
        expect(vesselHeader).toHaveTextContent('MV GLOBAL STAR');
        expect(vesselHeader).toHaveTextContent('Completed import transactions');
        expect(vesselHeader).toHaveTextContent('import');
        expect(screen.getByTestId('admin-review-group-panel')).toBeInTheDocument();
        expect(screen.getByText('BL-98210344')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /BL-98210344/i }));

        await waitFor(() => {
            expect(screen.getByTestId('admin-review-workspace')).toBeInTheDocument();
            expect(screen.getAllByText('BOC Document Processing').length).toBeGreaterThan(0);
        });

        const detailHeader = screen.getByTestId('admin-review-detail-header');
        expect(detailHeader).toHaveTextContent('MV GLOBAL STAR');
        expect(detailHeader).toHaveTextContent('Arrival');
        expect(detailHeader).toHaveTextContent('Mar 18, 2026');
        expect(detailHeader).toHaveTextContent('IMP-0921');
        expect(detailHeader).toHaveTextContent('BL-98210344');
        expect(detailHeader).not.toHaveTextContent('Completed');
        expect(detailHeader).not.toHaveTextContent('Finalized');
        expect(detailHeader).not.toHaveTextContent('Ready for Records');

        const summaryStrip = screen.getByTestId('admin-review-summary-strip');
        expect(summaryStrip).toHaveTextContent(/1\s*Open Remarks/);
        expect(summaryStrip).toHaveTextContent(/2\s*Uploads/);
        expect(summaryStrip).toHaveTextContent(/0\s*Marked N\/A/);
        expect(summaryStrip).not.toHaveTextContent('Required Docs');
        expect(summaryStrip).not.toHaveTextContent('Missing Docs');

        expect(screen.getByText('Document Checklist')).toBeInTheDocument();
        expect(screen.queryByText(/required stages filled/i)).not.toBeInTheDocument();
        expect(screen.getByText('Remarks & Exceptions')).toBeInTheDocument();
        expect(screen.getByText('Payment for PPA Charges')).toBeInTheDocument();
        expect(screen.getByText('Additional Uploads')).toBeInTheDocument();
        expect(screen.getByText('supporting_note.pdf')).toBeInTheDocument();
        expect(screen.getByText('Missing final BL from carrier')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send to records/i })).toBeDisabled();
    });

    it('keeps the queue pane roomier while tightening the detail header side panel', async () => {
        renderWithProviders(<AdminDocumentReview />);

        // Queue pane is in expanded (full-width) mode before a transaction is selected
        expect(screen.getByTestId('admin-review-queue-pane')).toHaveClass('max-w-none');

        fireEvent.click(screen.getByRole('button', { name: /BL-98210344/i }));

        await waitFor(() => {
            expect(screen.getByTestId('admin-review-detail-header')).toBeInTheDocument();
        });

        // After selection the pane switches to constrained sidebar widths
        expect(screen.getByTestId('admin-review-queue-pane')).toHaveClass(
            'xl:min-w-[26rem]',
            'xl:max-w-[38rem]',
        );
    });

    it('wires search and filter controls into the queue query params', async () => {
        renderWithProviders(<AdminDocumentReview />);

        // Admin User is an 'admin' role — should not appear as an encoder filter option
        expect(screen.queryByRole('button', { name: 'Admin User' })).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Search vessel, BL, ref, or client...'), {
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

        // Open the filter popover then apply filters via pill buttons
        fireEvent.click(screen.getByRole('button', { name: /filters/i }));
        fireEvent.click(screen.getByRole('button', { name: /^Export$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^Cancelled$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^Flagged$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^Sarah Velasco$/i }));

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

        expect(screen.getByText('No transactions in review')).toBeInTheDocument();
        expect(
            screen.getByText('Completed and cancelled transactions will appear here once they are ready for admin review.'),
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

        const archiveButton = screen.getByRole('button', { name: /send to records/i });

        await waitFor(() => {
            expect(archiveButton).toBeEnabled();
        });

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
