import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OversightTransaction } from '../../types/transaction.types';
import { OversightRowActions } from './OversightRowActions';

const baseTransaction: OversightTransaction = {
    id: 1,
    type: 'import',
    reference_no: 'IMP-2026-001',
    bl_no: 'BL-IMP-001',
    client: 'Acme Imports',
    client_id: 1,
    vessel: 'MV Example',
    destination: null,
    date: '2026-04-01',
    status: 'in_progress',
    selective_color: null,
    assigned_to: 'Encoder One',
    assigned_user_id: 5,
    open_remarks_count: 0,
    created_at: '2026-04-01T00:00:00Z',
    stages: null,
};

async function openRowActions() {
    const trigger = screen.getByRole('button', { name: 'Row actions' });
    fireEvent.pointerDown(trigger);
    await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });
}

describe('OversightRowActions', () => {
    it('shows Override Status and View Remarks for an active transaction, with no Delete', async () => {
        const onOverride = vi.fn();
        const onRestore = vi.fn();
        const onRemarks = vi.fn();
        const onDelete = vi.fn();

        render(
            <OversightRowActions
                transaction={{ ...baseTransaction, status: 'pending' }}
                onOverride={onOverride}
                onRestore={onRestore}
                onRemarks={onRemarks}
                onDelete={onDelete}
                deleting={false}
            />,
        );

        await openRowActions();

        expect(screen.getByRole('menuitem', { name: /Override Status/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /View Remarks/ })).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('menuitem', { name: /Override Status/ }));
        expect(onOverride).toHaveBeenCalledTimes(1);
        expect(onRestore).not.toHaveBeenCalled();
        expect(onDelete).not.toHaveBeenCalled();

        await openRowActions();
        fireEvent.click(screen.getByRole('menuitem', { name: /View Remarks/ }));
        expect(onRemarks).toHaveBeenCalledTimes(1);
    });

    it('shows Restore, View Remarks and a destructive Delete for a cancelled transaction', async () => {
        const onOverride = vi.fn();
        const onRestore = vi.fn();
        const onRemarks = vi.fn();
        const onDelete = vi.fn();

        render(
            <OversightRowActions
                transaction={{ ...baseTransaction, status: 'cancelled' }}
                onOverride={onOverride}
                onRestore={onRestore}
                onRemarks={onRemarks}
                onDelete={onDelete}
                deleting={false}
            />,
        );

        await openRowActions();

        expect(screen.getByRole('menuitem', { name: /Restore/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /View Remarks/ })).toBeInTheDocument();
        const deleteItem = screen.getByRole('menuitem', { name: /Delete/ });
        expect(deleteItem).toBeInTheDocument();
        expect(deleteItem).toHaveAttribute('data-variant', 'destructive');
        expect(screen.queryByRole('menuitem', { name: /Override Status/ })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('menuitem', { name: /Restore/ }));
        expect(onRestore).toHaveBeenCalledTimes(1);
        expect(onOverride).not.toHaveBeenCalled();

        await openRowActions();
        fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onRemarks).not.toHaveBeenCalled();
    });

    it('disables the Delete item while a delete is in progress', async () => {
        const onDelete = vi.fn();

        render(
            <OversightRowActions
                transaction={{ ...baseTransaction, status: 'cancelled' }}
                onOverride={vi.fn()}
                onRestore={vi.fn()}
                onRemarks={vi.fn()}
                onDelete={onDelete}
                deleting
            />,
        );

        await openRowActions();

        const deleteItem = screen.getByRole('menuitem', { name: /Delete/ });
        expect(deleteItem).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(deleteItem);
        expect(onDelete).not.toHaveBeenCalled();
    });

    it('shows only View Remarks for a completed transaction', async () => {
        const onRemarks = vi.fn();

        render(
            <OversightRowActions
                transaction={{ ...baseTransaction, status: 'completed' }}
                onOverride={vi.fn()}
                onRestore={vi.fn()}
                onRemarks={onRemarks}
                onDelete={vi.fn()}
                deleting={false}
            />,
        );

        await openRowActions();

        expect(screen.getByRole('menuitem', { name: /View Remarks/ })).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: /Override Status/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: /Restore/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
    });
});
