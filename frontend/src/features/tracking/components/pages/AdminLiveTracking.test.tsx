import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { makeApiExportTransaction, makeApiImportTransaction } from '../../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { AdminLiveTracking } from './AdminLiveTracking';

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

    it('opens vessel groups when live data arrives after loading', () => {
        let importsQuery = { data: [] as ReturnType<typeof makeApiImportTransaction>[], isLoading: true };
        let exportsQuery = { data: [] as ReturnType<typeof makeApiExportTransaction>[], isLoading: true };

        mockUseAllImportsData.mockImplementation(() => importsQuery);
        mockUseAllExportsData.mockImplementation(() => exportsQuery);

        function Harness() {
            const [, forceRender] = useState(0);

            return (
                <>
                    <button
                        type="button"
                        onClick={() => {
                            importsQuery = {
                                data: [makeApiImportTransaction({
                                    customs_ref_no: 'IMP-LIVE-001',
                                    vessel_name: 'EVER COMPOSE S101',
                                    open_remarks_count: 0,
                                })],
                                isLoading: false,
                            };
                            exportsQuery = {
                                data: [makeApiExportTransaction({
                                    bl_no: 'EXP-LIVE-001',
                                    vessel: 'MV LADY ROSE V112',
                                    open_remarks_count: 0,
                                })],
                                isLoading: false,
                            };
                            forceRender((value) => value + 1);
                        }}
                    >
                        Load live data
                    </button>
                    <AdminLiveTracking />
                </>
            );
        }

        renderWithProviders(<Harness />, {
            route: appRoutes.liveTracking,
            path: appRoutes.liveTracking,
        });

        expect(screen.queryByText('IMP-LIVE-001')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Load live data' }));

        expect(screen.getByText('EVER COMPOSE S101')).toBeInTheDocument();
        expect(screen.getByText('MV LADY ROSE V112')).toBeInTheDocument();
        expect(screen.getByText('IMP-LIVE-001')).toBeInTheDocument();
        expect(screen.getByText('EXP-LIVE-001')).toBeInTheDocument();
        expect(screen.getAllByText('1 total')).toHaveLength(2);
        expect(screen.queryByText('1 active')).not.toBeInTheDocument();
    });
});
