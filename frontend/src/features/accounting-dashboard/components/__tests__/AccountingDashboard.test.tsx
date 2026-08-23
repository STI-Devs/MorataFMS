import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { makeApiExportTransaction, makeApiImportTransaction } from '../../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { AccountingDashboard } from '../AccountingDashboard';

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: {
        getAllImports: vi.fn(),
        getAllExports: vi.fn(),
    },
}));

describe('AccountingDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the header and loading skeletons while queries are resolving', () => {
        vi.mocked(trackingApi.getAllImports).mockReturnValue(new Promise(() => {}));
        vi.mocked(trackingApi.getAllExports).mockReturnValue(new Promise(() => {}));

        renderWithProviders(<AccountingDashboard />, {
            route: appRoutes.accountantDashboard,
            path: appRoutes.accountantDashboard,
        });

        expect(screen.getByRole('heading', { name: 'Accounting Dashboard' })).toBeInTheDocument();
        expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });

    it('computes and displays the KPI metrics accurately when data is loaded', async () => {
        const importReady = makeApiImportTransaction({
            id: 1,
            open_remarks_count: 1,
            stages: {
                boc: 'completed',
                bonds: 'completed',
                do: 'completed',
                ppa: 'completed',
                port_charges: 'completed',
                releasing: 'completed',
                billing: 'pending',
            },
        });

        const importPending = makeApiImportTransaction({
            id: 2,
            open_remarks_count: 0,
            stages: {
                boc: 'completed',
                bonds: 'pending',
                do: 'pending',
                ppa: 'pending',
                port_charges: 'pending',
                releasing: 'pending',
                billing: 'pending',
            },
        });

        const exportReady = makeApiExportTransaction({
            id: 10,
            open_remarks_count: 0,
            stages: {
                boc: 'completed',
                bl_generation: 'completed',
                phytosanitary: 'completed',
                co: 'completed',
                cil: 'completed',
                dccci: 'completed',
                billing: 'pending',
            },
        });

        vi.mocked(trackingApi.getAllImports).mockResolvedValue([importReady, importPending]);
        vi.mocked(trackingApi.getAllExports).mockResolvedValue([exportReady]);

        renderWithProviders(<AccountingDashboard />, {
            route: appRoutes.accountantDashboard,
            path: appRoutes.accountantDashboard,
        });

        // Wait for data resolution and rendered numbers
        await waitFor(() => {
            expect(screen.getByText('1 imports · 1 exports')).toBeInTheDocument();
        });

        // Active Imports & Ready to Bill both equal 2
        expect(screen.getByText('Active Imports')).toBeInTheDocument();
        expect(screen.getAllByText('2')).toHaveLength(2);
        expect(screen.getByText('2 pending billing')).toBeInTheDocument();

        // Active Exports: 1
        expect(screen.getByText('Active Exports')).toBeInTheDocument();
        expect(screen.getByText('1 pending billing')).toBeInTheDocument();

        // Ready to Bill
        expect(screen.getByText('Ready to Bill')).toBeInTheDocument();

        // Needs Attention: 1 import has open_remarks_count = 1
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    });

    it('navigates to the corresponding module routes on click', async () => {
        vi.mocked(trackingApi.getAllImports).mockResolvedValue([]);
        vi.mocked(trackingApi.getAllExports).mockResolvedValue([]);

        renderWithProviders(<AccountingDashboard />, {
            route: appRoutes.accountantDashboard,
            path: appRoutes.accountantDashboard,
            routes: [
                { path: appRoutes.accountantImpExp, element: <div>Tasks Page</div> },
                { path: appRoutes.accountantDocuments, element: <div>Documents Page</div> },
            ],
        });

        const tasksButton = screen.getByRole('button', { name: /Transaction Tasks/i });
        fireEvent.click(tasksButton);
        expect(await screen.findByText('Tasks Page')).toBeInTheDocument();
    });
});
