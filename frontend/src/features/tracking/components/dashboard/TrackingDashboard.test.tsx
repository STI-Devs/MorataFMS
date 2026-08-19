import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { makeApiExportTransaction, makeApiImportTransaction } from '../../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { TrackingDashboard } from './TrackingDashboard';

const { mockUseAllImportsData, mockUseAllExportsData } = vi.hoisted(() => ({
    mockUseAllImportsData: vi.fn(),
    mockUseAllExportsData: vi.fn(),
}));

vi.mock('../../hooks/useAllTransactionRecords', () => ({
    useAllImportsData: mockUseAllImportsData,
    useAllExportsData: mockUseAllExportsData,
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

describe('TrackingDashboard', () => {
    beforeEach(() => {
        mockUseAllImportsData.mockReset();
        mockUseAllExportsData.mockReset();
    });

    it('renders loading placeholders while transaction data is still pending', () => {
        mockUseAllImportsData.mockReturnValue({ data: undefined, isLoading: true });
        mockUseAllExportsData.mockReturnValue({ data: undefined, isLoading: true });

        const { container } = renderWithProviders(<TrackingDashboard />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
        });

        expect(screen.getByText('Live Tracking Overview')).toBeInTheDocument();
        expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0);
    });

    it('renders empty states when there are no active vessels', () => {
        mockUseAllImportsData.mockReturnValue({ data: [], isLoading: false });
        mockUseAllExportsData.mockReturnValue({ data: [], isLoading: false });

        renderWithProviders(<TrackingDashboard />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
        });

        expect(screen.getByText('No vessels found')).toBeInTheDocument();
    });

    it('renders mapped rows and navigates to the tracking detail route on click', () => {
        mockUseAllImportsData.mockReturnValue({
            data: [makeApiImportTransaction({ customs_ref_no: 'IMP/2026 001', status: 'completed' })],
            isLoading: false,
        });
        mockUseAllExportsData.mockReturnValue({
            data: [makeApiExportTransaction({ id: 42, status: 'completed' })],
            isLoading: false,
        });

        renderWithProviders(<TrackingDashboard />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
            routes: [
                {
                    path: appRoutes.trackingDetail,
                    element: <div>Tracking detail route</div>,
                },
            ],
        });

        expect(screen.getByText('MV Pacific Star')).toBeInTheDocument(); // import vessel group
        expect(screen.getByText('MV Pacific')).toBeInTheDocument();       // export vessel group
        expect(screen.getByText('IMP/2026 001')).toBeInTheDocument();
        expect(screen.getByText('Acme Imports')).toBeInTheDocument();
        expect(screen.getByText('Bravo Exports')).toBeInTheDocument();
        expect(screen.getAllByText('completed')).toHaveLength(2);

        fireEvent.click(screen.getByText('IMP/2026 001'));

        expect(screen.getByText('Tracking detail route')).toBeInTheDocument();
    });

    it('renders KPI summary cards with counts and allows toggling expand/collapse all and filtering', () => {
        mockUseAllImportsData.mockReturnValue({
            data: [
                makeApiImportTransaction({ customs_ref_no: 'IMP/2026 001', open_remarks_count: 1 }),
                makeApiImportTransaction({ id: 2, customs_ref_no: 'IMP/2026 002', vessel_name: 'MV Ocean Leader' }),
            ],
            isLoading: false,
        });
        mockUseAllExportsData.mockReturnValue({
            data: [makeApiExportTransaction({ id: 42 })],
            isLoading: false,
        });

        renderWithProviders(<TrackingDashboard />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
        });

        expect(screen.getByText('Active Imports')).toBeInTheDocument();
        expect(screen.getByText('Active Exports')).toBeInTheDocument();
        expect(screen.getByText('Vessels Tracked')).toBeInTheDocument();
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();

        // Check expand/collapse toggle
        expect(screen.getByText('IMP/2026 001')).toBeInTheDocument();
        const collapseButton = screen.getByRole('button', { name: /Collapse all/i });

        // Click Collapse all
        fireEvent.click(collapseButton);
        expect(screen.queryByText('IMP/2026 001')).not.toBeInTheDocument();

        // Click Expand all
        const expandButton = screen.getByRole('button', { name: /Expand all/i });
        fireEvent.click(expandButton);
        expect(screen.getByText('IMP/2026 001')).toBeInTheDocument();

        // Search input filtering
        const searchInput = screen.getByPlaceholderText('Filter vessel, BL, ref...');
        fireEvent.change(searchInput, { target: { value: 'Ocean Leader' } });
        expect(screen.getByText('MV Ocean Leader')).toBeInTheDocument();
        expect(screen.queryByText('MV Pacific Star')).not.toBeInTheDocument();
    });
});
