import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { makeApiExportTransaction } from '../../../../test/fixtures/tracking';
import { ExportTransactionRow } from './ExportTransactionRow';

describe('ExportTransactionRow', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-28T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps the updated column visible in the grouped export grid', () => {
        const transaction = makeApiExportTransaction({
            status: 'Processing',
            waiting_since: '2026-04-20T00:00:00Z',
            created_at: '2026-04-18T00:00:00Z',
            open_remarks_count: 0,
        });

        renderWithProviders(
            <ExportTransactionRow
                transaction={transaction}
                onNavigate={vi.fn()}
                onCancel={vi.fn()}
                onRemarks={vi.fn()}
            />,
        );

        expect(screen.getByRole('row')).toHaveClass('lg:grid-cols-[1.25fr_1.25fr_1.45fr_100px_80px_92px_104px]');
        expect(screen.getByText('8d ago')).toBeInTheDocument();
        expect(screen.queryByText('On file')).not.toBeInTheDocument();
        expect(screen.getByTitle(/Apr 20, 2026/)).toBeInTheDocument();
    });

    it('shows open admin remarks as a visible count on rows needing review', () => {
        const onRemarks = vi.fn();
        const transaction = makeApiExportTransaction({
            open_remarks_count: 3,
        });

        renderWithProviders(
            <ExportTransactionRow
                transaction={transaction}
                onNavigate={vi.fn()}
                onCancel={vi.fn()}
                onRemarks={onRemarks}
            />,
        );

        expect(screen.getByText('3 remarks')).toBeInTheDocument();
        expect(screen.getByTitle('3 open remark(s)')).toHaveTextContent('3');

        fireEvent.click(screen.getByText('3 remarks'));

        expect(onRemarks).toHaveBeenCalledWith(transaction);
    });
});
