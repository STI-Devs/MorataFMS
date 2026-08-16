import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { TransactionOversight } from './TransactionOversight';

const {
    mockDeleteExport,
    mockDeleteImport,
    mockUseAllTransactions,
} = vi.hoisted(() => ({
    mockDeleteExport: vi.fn(),
    mockDeleteImport: vi.fn(),
    mockUseAllTransactions: vi.fn(),
}));

vi.mock('../../../../hooks/useDebounce', () => ({
    useDebounce: (value: string) => value,
}));

vi.mock('../../hooks/useTransactions', () => ({
    useAllTransactions: mockUseAllTransactions,
}));

vi.mock('../../api/transactionApi', () => ({
    transactionApi: {
        deleteImport: mockDeleteImport,
        deleteExport: mockDeleteExport,
    },
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => null,
}));

vi.mock('./OversightPagination', () => ({
    OversightPagination: ({ perPage }: { perPage: number }) => (
        <div data-testid="pagination">
            {perPage}:{[50, 75, 100].join(',')}
        </div>
    ),
}));

vi.mock('./OversightRowActions', () => ({
    OversightRowActions: ({
        transaction,
        onOverride,
        onRestore,
        onDelete,
    }: {
        transaction: { status: string };
        onOverride: () => void;
        onRestore: () => void;
        onDelete: () => void;
    }) => {
        const normalized = transaction.status.trim().toLowerCase().replace(/\s+/g, '_');
        const isCancelled = normalized === 'cancelled';
        const isActive = normalized !== 'cancelled' && normalized !== 'completed';

        return (
            <>
                {isActive && (
                    <button title="Override Status" onClick={onOverride}>
                        Override Status
                    </button>
                )}
                {isCancelled && (
                    <>
                        <button title="Restore Transaction" onClick={onRestore}>
                            Restore Transaction
                        </button>
                        <button title="Delete Cancelled Transaction" onClick={onDelete}>
                            Delete Cancelled Transaction
                        </button>
                    </>
                )}
            </>
        );
    },
}));

vi.mock('../modals/RemarkModal', () => ({
    RemarkModal: () => null,
}));

vi.mock('../modals/StatusOverrideModal', () => ({
    StatusOverrideModal: ({
        isOpen,
        transaction,
    }: {
        isOpen: boolean;
        transaction: { id: number } | null;
    }) => (isOpen ? <div>Restore modal for {transaction?.id}</div> : null),
}));

vi.mock('../details/TransactionDetailDrawer', () => ({
    TransactionDetailDrawer: () => null,
}));

describe('TransactionOversight', () => {
    beforeEach(() => {
        mockDeleteImport.mockReset();
        mockDeleteExport.mockReset();
        mockUseAllTransactions.mockReset();

        mockDeleteImport.mockResolvedValue(undefined);
        mockDeleteExport.mockResolvedValue(undefined);
        const allTransactions = [
            {
                id: 11,
                type: 'import',
                reference_no: 'IMP-2026-011',
                bl_no: 'BL-IMP-011',
                client: 'Acme Imports',
                client_id: 1,
                vessel: 'SHARED VESSEL',
                date: '2026-04-01',
                status: 'cancelled',
                selective_color: 'green',
                assigned_to: 'Encoder One',
                assigned_user_id: 5,
                open_remarks_count: 0,
                created_at: '2026-04-01T00:00:00Z',
                stages: null,
            },
            {
                id: 22,
                type: 'export',
                reference_no: null,
                bl_no: 'BL-EXP-022',
                client: 'Bravo Exports',
                client_id: 2,
                vessel: 'SHARED VESSEL',
                date: '2026-04-02',
                status: 'pending',
                assigned_to: 'Encoder Two',
                assigned_user_id: 6,
                open_remarks_count: 2,
                created_at: '2026-04-02T00:00:00Z',
                stages: null,
            },
        ];

        mockUseAllTransactions.mockImplementation((params?: { per_page?: number; type?: 'import' | 'export' }) => {
            const visibleTransactions = params?.type
                ? allTransactions.filter((transaction) => transaction.type === params.type)
                : allTransactions;

            return {
                data: {
                    data: visibleTransactions,
                    total: visibleTransactions.length,
                    imports_count: allTransactions.filter((transaction) => transaction.type === 'import').length,
                    exports_count: allTransactions.filter((transaction) => transaction.type === 'export').length,
                    needs_attention_count: allTransactions.filter((transaction) => transaction.open_remarks_count > 0).length,
                    meta: {
                        current_page: 1,
                        last_page: 2,
                        per_page: params?.per_page ?? 50,
                        total_records: visibleTransactions.length,
                    },
                },
                isLoading: false,
                isError: false,
                refetch: vi.fn(),
            };
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('shows restore and delete actions for cancelled transactions and deletes through the admin flow', async () => {
        renderWithProviders(<TransactionOversight />);

        expect(screen.getByTitle('Restore Transaction')).toBeInTheDocument();
        expect(screen.getByTitle('Delete Cancelled Transaction')).toBeInTheDocument();
        expect(screen.getByTitle('Override Status')).toBeInTheDocument();
        expect(screen.getByTestId('pagination')).toHaveTextContent('50:50,75,100');

        fireEvent.click(screen.getByTitle('Restore Transaction'));
        expect(screen.getByText('Restore modal for 11')).toBeInTheDocument();

        fireEvent.click(screen.getByTitle('Delete Cancelled Transaction'));
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(mockDeleteImport).toHaveBeenCalledWith(11);
        });
    });

    it('keeps vessel headers aligned with the selected transaction type filter', async () => {
        renderWithProviders(<TransactionOversight />);

        fireEvent.mouseDown(screen.getByRole('tab', { name: 'Exports' }));

        await waitFor(() => {
            expect(mockUseAllTransactions).toHaveBeenLastCalledWith({
                page: 1,
                per_page: 50,
                search: '',
                status: 'all',
                type: 'export',
            });
        });

        const sharedVesselHeader = screen.getByRole('button', { name: /shared vessel/i });

        expect(sharedVesselHeader).not.toBeNull();
        expect(sharedVesselHeader).toHaveTextContent('export');
        expect(sharedVesselHeader).not.toHaveTextContent('import');
        expect(screen.getByText('BL-EXP-022')).toBeInTheDocument();
    });

    it('shows scope-wide attention totals and row remark badges for flagged transactions', () => {
        renderWithProviders(<TransactionOversight />);

        expect(screen.getByText('Needs Attention').parentElement).toHaveTextContent('1');
        expect(screen.getByText('Transactions with open remarks')).toBeInTheDocument();
        expect(screen.getByTitle('2 open remark(s)')).toBeInTheDocument();
    });
});
