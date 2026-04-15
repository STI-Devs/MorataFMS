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

    it('renders empty states when there are no active imports or exports', () => {
        mockUseAllImportsData.mockReturnValue({ data: [], isLoading: false });
        mockUseAllExportsData.mockReturnValue({ data: [], isLoading: false });

        renderWithProviders(<TrackingDashboard />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
        });

        expect(screen.getByText('No imports found')).toBeInTheDocument();
        expect(screen.getByText('No exports found')).toBeInTheDocument();
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

        expect(screen.getAllByText('1 active')).toHaveLength(2);
        expect(screen.getByText('IMP/2026 001')).toBeInTheDocument();
        expect(screen.getByText('Acme Imports')).toBeInTheDocument();
        expect(screen.getByText('Bravo Exports')).toBeInTheDocument();
        expect(screen.getByText('MV Pacific')).toBeInTheDocument();
        expect(screen.getAllByText('Completed')).toHaveLength(2);

        fireEvent.click(screen.getByText('IMP/2026 001'));

        expect(screen.getByText('Tracking detail route')).toBeInTheDocument();
    });
});
