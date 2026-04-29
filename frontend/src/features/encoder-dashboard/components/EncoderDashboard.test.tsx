import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { EncoderDashboard } from './EncoderDashboard';

const { mockUseEncoderDashboard } = vi.hoisted(() => ({
    mockUseEncoderDashboard: vi.fn(),
}));

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../hooks/useEncoderDashboard', () => ({
    useEncoderDashboard: mockUseEncoderDashboard,
}));

describe('EncoderDashboard', () => {
    beforeEach(() => {
        mockUseEncoderDashboard.mockReturnValue({
            data: {
                kpis: {
                    active_imports: 4,
                    active_exports: 6,
                    needs_update: 2,
                    upcoming_eta_etd: 3,
                    open_remarks: 1,
                    document_gaps: 5,
                },
                attention_items: [
                    {
                        id: 'needs-update-import-1',
                        ref: 'IMP-ENC-001',
                        type: 'import',
                        status: 'needs_update',
                        title: 'Import record needs an update',
                        detail: 'Current status: Processing. Update the record or upload the next required document.',
                        age: '3d ago',
                        destination: 'imports',
                    },
                    {
                        id: 'remark-export-1',
                        ref: 'BL-ENC-002',
                        type: 'export',
                        status: 'remark',
                        title: 'Open remark needs resolution',
                        detail: 'Client correction still pending.',
                        age: '1h ago',
                        destination: 'documents',
                    },
                ],
            },
            isLoading: false,
            isError: false,
        });
    });

    it('renders encoder workload kpis and attention items', () => {
        renderWithProviders(<EncoderDashboard />, {
            route: appRoutes.encoderDashboard,
            path: appRoutes.encoderDashboard,
        });

        expect(screen.getByText('Assigned Brokerage Dashboard')).toBeInTheDocument();
        expect(screen.getByText('My Operation Queue')).toBeInTheDocument();
        expect(screen.getByText('My Imports')).toBeInTheDocument();
        expect(screen.getByText('My Exports')).toBeInTheDocument();
        expect(screen.getByText('ETA/ETD This Week')).toBeInTheDocument();
        expect(screen.getByText('Open Remarks')).toBeInTheDocument();
        expect(screen.getByText('No Update in 48h')).toBeInTheDocument();
        expect(screen.getByText('Needs update')).toHaveClass('inline-flex', 'min-w-[92px]', 'justify-center', 'whitespace-nowrap');
        expect(screen.getByText('Document Gaps')).toBeInTheDocument();
        expect(screen.getByText('IMP-ENC-001')).toBeInTheDocument();
        expect(screen.getByText('BL-ENC-002')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Records Archive and legacy folders/i })).toBeInTheDocument();
    });

    it('navigates to the tracking detail from a queue item', () => {
        renderWithProviders(<EncoderDashboard />, {
            route: appRoutes.encoderDashboard,
            path: appRoutes.encoderDashboard,
            routes: [
                {
                    path: appRoutes.trackingDetail,
                    element: <div>Tracking detail route</div>,
                },
            ],
        });

        fireEvent.click(screen.getByRole('button', { name: /IMP-ENC-001/i }));

        expect(screen.getByText('Tracking detail route')).toBeInTheDocument();
    });
});
