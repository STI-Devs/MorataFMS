import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { TrackingHeader } from './TrackingHeader';

describe('TrackingHeader', () => {
    it('shows a red dot beside the remarks label when there are open remarks', () => {
        const onRemarksClick = vi.fn();

        renderWithProviders(
            <TrackingHeader
                transaction={{
                    id: 1,
                    ref: 'IMP-2026-001',
                    bl: 'BL-2026-001',
                    status: 'Vessel Arrived',
                    color: 'green',
                    colorLabel: 'Green',
                    importer: 'Client Name',
                    date: '2026-03-26',
                    open_remarks_count: 2,
                }}
                onBack={vi.fn()}
                onEditClick={vi.fn()}
                onRemarksClick={onRemarksClick}
                statusColor="#0a84ff"
                statusBg="rgba(10,132,255,0.12)"
            />,
            {
                outletContext: {
                    user: { name: 'Encoder User', role: 'encoder' },
                },
            },
        );

        expect(screen.getByTestId('tracking-header-remark-dot')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /remarks/i }));
        expect(onRemarksClick).toHaveBeenCalledTimes(1);
    });

    it('hides the red dot when there are no open remarks', () => {
        renderWithProviders(
            <TrackingHeader
                transaction={{
                    id: 1,
                    ref: 'IMP-2026-001',
                    bl: 'BL-2026-001',
                    status: 'Vessel Arrived',
                    color: 'green',
                    colorLabel: 'Green',
                    importer: 'Client Name',
                    date: '2026-03-26',
                    open_remarks_count: 0,
                }}
                onBack={vi.fn()}
                onEditClick={vi.fn()}
                onRemarksClick={vi.fn()}
                statusColor="#0a84ff"
                statusBg="rgba(10,132,255,0.12)"
            />,
            {
                outletContext: {
                    user: { name: 'Encoder User', role: 'encoder' },
                },
            },
        );

        expect(screen.queryByTestId('tracking-header-remark-dot')).not.toBeInTheDocument();
    });
});
