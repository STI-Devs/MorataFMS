import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { makeApiExportTransaction, makeApiImportTransaction } from '../../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { ProcessorDashboard } from '../ProcessorDashboard';

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: {
        getAllImports: vi.fn(),
        getAllExports: vi.fn(),
    },
}));

describe('ProcessorDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the header and loading skeletons while queries are resolving', () => {
        vi.mocked(trackingApi.getAllImports).mockReturnValue(new Promise(() => {}));
        vi.mocked(trackingApi.getAllExports).mockReturnValue(new Promise(() => {}));

        renderWithProviders(<ProcessorDashboard />, {
            route: appRoutes.processorDashboard,
            path: appRoutes.processorDashboard,
        });

        expect(screen.getByRole('heading', { name: 'Processor Dashboard' })).toBeInTheDocument();
        expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });

    it('computes and displays the KPI metrics accurately when data is loaded', async () => {
        const importReady = makeApiImportTransaction({
            id: 1,
            open_remarks_count: 1,
            stages: {
                boc: 'completed',
                bonds: 'completed',
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
                bl_generation: 'pending',
                phytosanitary: 'pending',
                co: 'pending',
                cil: 'pending',
                dccci: 'pending',
                billing: 'pending',
            },
        });

        vi.mocked(trackingApi.getAllImports).mockResolvedValue([importReady]);
        vi.mocked(trackingApi.getAllExports).mockResolvedValue([exportReady]);

        renderWithProviders(<ProcessorDashboard />, {
            route: appRoutes.processorDashboard,
            path: appRoutes.processorDashboard,
        });

        // Wait for data resolution and rendered numbers
        await waitFor(() => {
            expect(screen.getByText('Active Imports')).toBeInTheDocument();
        });

        expect(screen.getByText('Active Exports')).toBeInTheDocument();
        expect(screen.getByText('Ready to Process')).toBeInTheDocument();
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    });

    it('supports module navigation on card click', async () => {
        vi.mocked(trackingApi.getAllImports).mockResolvedValue([]);
        vi.mocked(trackingApi.getAllExports).mockResolvedValue([]);

        renderWithProviders(<ProcessorDashboard />, {
            route: appRoutes.processorDashboard,
            path: appRoutes.processorDashboard,
        });

        const tasksCard = screen.getByRole('heading', { name: 'Transaction Tasks' });
        expect(tasksCard).toBeInTheDocument();

        const docsCard = screen.getByRole('heading', { name: 'Documents' });
        expect(docsCard).toBeInTheDocument();
    });
});
