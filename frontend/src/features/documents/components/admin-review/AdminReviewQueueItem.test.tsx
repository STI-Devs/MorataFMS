import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminReviewQueueItem } from '../../types/document.types';
import { QueueItem } from './AdminReviewQueueItem';

const baseTransaction: AdminReviewQueueItem = {
    id: 1,
    type: 'import',
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
    has_exceptions: false,
    archive_ready: false,
    readiness: 'missing_docs',
};

describe('QueueItem', () => {
    it('shows the import reference in the subtitle', () => {
        render(
            <QueueItem
                transaction={baseTransaction}
                isSelected={false}
                onSelect={vi.fn()}
            />,
        );

        expect(screen.getByText('Global Tech Corp').closest('p')).toHaveTextContent('Global Tech Corp · IMP-0921 · Sarah Velasco');
    });

    it('does not show generated export references when a bill of lading is present', () => {
        render(
            <QueueItem
                transaction={{
                    ...baseTransaction,
                    id: 63,
                    type: 'export',
                    ref: 'EXP-0063',
                    bl_number: 'ONEYDVOG00498700',
                    client: 'Dole Philippines Inc.',
                    assigned_user: 'Claire Ivy Florino',
                }}
                isSelected={false}
                onSelect={vi.fn()}
            />,
        );

        expect(screen.getByText('ONEYDVOG00498700')).toBeInTheDocument();
        expect(screen.getByText('Dole Philippines Inc.').closest('p')).toHaveTextContent('Dole Philippines Inc. · Claire Ivy Florino');
        expect(screen.queryByText(/EXP-0063/)).not.toBeInTheDocument();
    });
});
