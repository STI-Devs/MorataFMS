import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteCancelledTransactionModal } from './DeleteCancelledTransactionModal';

const cancelledTransaction = {
    id: 7,
    type: 'import' as const,
    reference_no: 'IMP-2026-007',
    bl_no: null,
    client: 'Acme Imports',
    client_id: 1,
    vessel: 'SHARED VESSEL',
    date: '2026-04-07',
    status: 'cancelled',
    selective_color: 'green',
    assigned_to: 'Encoder One',
    assigned_user_id: 5,
    open_remarks_count: 0,
    created_at: '2026-04-07T00:00:00Z',
    stages: null,
};

describe('DeleteCancelledTransactionModal', () => {
    it('shows the title and confirmation description with the transaction reference', () => {
        render(
            <DeleteCancelledTransactionModal
                transaction={cancelledTransaction}
                open
                onCancel={vi.fn()}
                onConfirm={vi.fn()}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Delete Cancelled Transaction' })).toBeInTheDocument();
        expect(screen.getByText(/permanently delete the cancelled/i)).toBeInTheDocument();
        expect(screen.getByText('IMP-2026-007')).toBeInTheDocument();
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it('calls onCancel when Cancel is clicked', () => {
        const onCancel = vi.fn();
        const onConfirm = vi.fn();

        render(
            <DeleteCancelledTransactionModal
                transaction={cancelledTransaction}
                open
                onCancel={onCancel}
                onConfirm={onConfirm}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('calls onConfirm when Delete is clicked', () => {
        const onCancel = vi.fn();
        const onConfirm = vi.fn();

        render(
            <DeleteCancelledTransactionModal
                transaction={cancelledTransaction}
                open
                onCancel={onCancel}
                onConfirm={onConfirm}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
