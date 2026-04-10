import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
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

vi.mock('../../../hooks/useDebounce', () => ({
    useDebounce: (value: string) => value,
}));

vi.mock('../hooks/useTransactions', () => ({
    useAllTransactions: mockUseAllTransactions,
}));

vi.mock('../api/transactionApi', () => ({
    transactionApi: {
        deleteImport: mockDeleteImport,
        deleteExport: mockDeleteExport,
    },
}));

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => null,
}));

vi.mock('../../../components/Pagination', () => ({
    Pagination: () => null,
}));

vi.mock('./ReassignModal', () => ({
    ReassignModal: () => null,
}));

vi.mock('./RemarkModal', () => ({
    RemarkModal: () => null,
}));

vi.mock('./StatusOverrideModal', () => ({
    StatusOverrideModal: ({
        isOpen,
        transaction,
    }: {
        isOpen: boolean;
        transaction: { id: number } | null;
    }) => (isOpen ? <div>Restore modal for {transaction?.id}</div> : null),
}));

vi.mock('./TransactionDetailDrawer', () => ({
    TransactionDetailDrawer: () => null,
}));

describe('TransactionOversight', () => {
    beforeEach(() => {
        mockDeleteImport.mockReset();
        mockDeleteExport.mockReset();
        mockUseAllTransactions.mockReset();

        mockDeleteImport.mockResolvedValue(undefined);
        mockDeleteExport.mockResolvedValue(undefined);
        mockUseAllTransactions.mockReturnValue({
            data: {
                data: [
                    {
                        id: 11,
                        type: 'import',
                        reference_no: 'IMP-2026-011',
                        bl_no: 'BL-IMP-011',
                        client: 'Acme Imports',
                        client_id: 1,
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
                        date: '2026-04-02',
                        status: 'pending',
                        assigned_to: 'Encoder Two',
                        assigned_user_id: 6,
                        open_remarks_count: 0,
                        created_at: '2026-04-02T00:00:00Z',
                        stages: null,
                    },
                ],
                total: 2,
                imports_count: 1,
                exports_count: 1,
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total_records: 2,
                },
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('shows restore and delete actions for cancelled transactions and deletes through the admin flow', async () => {
        renderWithProviders(<TransactionOversight />);

        expect(screen.getByTitle('Restore Transaction')).toBeInTheDocument();
        expect(screen.getByTitle('Delete Cancelled Transaction')).toBeInTheDocument();
        expect(screen.getByTitle('Override Status')).toBeInTheDocument();

        fireEvent.click(screen.getByTitle('Restore Transaction'));
        expect(screen.getByText('Restore modal for 11')).toBeInTheDocument();

        fireEvent.click(screen.getByTitle('Delete Cancelled Transaction'));
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(mockDeleteImport).toHaveBeenCalledWith(11);
        });
    });
});
