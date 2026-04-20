import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { makeApiExportTransaction, makeApiImportTransaction } from '../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { AdminLiveTracking } from './AdminLiveTracking';

const { mockUseAllImportsData, mockUseAllExportsData } = vi.hoisted(() => ({
    mockUseAllImportsData: vi.fn(),
    mockUseAllExportsData: vi.fn(),
}));

vi.mock('../hooks/useAllTransactionRecords', () => ({
    useAllImportsData: mockUseAllImportsData,
    useAllExportsData: mockUseAllExportsData,
}));

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

describe('AdminLiveTracking', () => {
    beforeEach(() => {
        mockUseAllImportsData.mockReset();
        mockUseAllExportsData.mockReset();
    });

    it('renders empty states when no live transactions are available', () => {
        mockUseAllImportsData.mockReturnValue({ data: [], isLoading: false });
        mockUseAllExportsData.mockReturnValue({ data: [], isLoading: false });

        renderWithProviders(<AdminLiveTracking />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
        });

        expect(screen.getByTestId('admin-live-tracking-page')).toHaveClass('bg-surface-secondary');
        expect(screen.getByText('Live Tracking Overview')).toBeInTheDocument();
        expect(screen.getByText('No imports found')).toBeInTheDocument();
        expect(screen.getByText('No exports found')).toBeInTheDocument();
    });

    it('renders grouped vessel panels and navigates to transaction detail', () => {
        mockUseAllImportsData.mockReturnValue({
            data: [makeApiImportTransaction({ customs_ref_no: 'IMP/2026 001' })],
            isLoading: false,
        });
        mockUseAllExportsData.mockReturnValue({
            data: [makeApiExportTransaction({ id: 42, bl_no: 'BL-EXP-042' })],
            isLoading: false,
        });

        renderWithProviders(<AdminLiveTracking />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
            routes: [
                {
                    path: appRoutes.trackingDetail,
                    element: <div>Tracking detail route</div>,
                },
            ],
        });

        expect(screen.getByText('MV Pacific Star')).toBeInTheDocument();
        expect(screen.getByText('MV Pacific')).toBeInTheDocument();
        expect(screen.getByText('IMP/2026 001')).toBeInTheDocument();
        expect(screen.getByText('BL-EXP-042')).toBeInTheDocument();
        expect(screen.getByText('Active Imports')).toBeInTheDocument();

        fireEvent.click(screen.getByText('IMP/2026 001'));

        expect(screen.getByText('Tracking detail route')).toBeInTheDocument();
    });
});
