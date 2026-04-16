import { fireEvent, screen } from '@testing-library/react';
import { ProcessorTransactionPage } from '../ProcessorTransactionPage';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as trackingApi from '../../../tracking/api/trackingApi';
import { makeApiImportTransaction } from '../../../../test/fixtures/tracking';

vi.mock('../../../tracking/api/trackingApi', async (importOriginal) => {
    const actual = await importOriginal<typeof trackingApi>();
    return {
        ...actual,
        trackingApi: {
            ...actual.trackingApi,
            getAllImports: vi.fn().mockResolvedValue([]),
            getAllExports: vi.fn().mockResolvedValue([]),
        },
    };
});

describe('ProcessorTransactionPage', () => {
    beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-15T00:00:00Z').getTime());
        vi.mocked(trackingApi.trackingApi.getAllImports).mockReset();
        vi.mocked(trackingApi.trackingApi.getAllExports).mockReset();
        vi.mocked(trackingApi.trackingApi.getAllImports).mockResolvedValue([]);
        vi.mocked(trackingApi.trackingApi.getAllExports).mockResolvedValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the task queue UI instead of generic transaction lists', async () => {
        renderWithProviders(<ProcessorTransactionPage />);

        expect(screen.getByText('Processor Task Queue')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Imports/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Exports/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search bl, ref, client, vessel, blocker/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ready/i })).toBeInTheDocument();

        // Verify it doesn't render generic headers
        expect(screen.queryByText(/Full Import List/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Full Export List/i)).not.toBeInTheDocument();

        expect(trackingApi.trackingApi.getAllImports).toHaveBeenCalledWith({
            exclude_statuses: 'completed,cancelled',
            operational_scope: 'workspace',
        });
    });

    it('shows compact ready and waiting processor rows for imports and supports queue filters', async () => {
        const readyImport = makeApiImportTransaction({
            id: 1,
            customs_ref_no: 'REF-IMP-001',
            stages: {
                boc: 'completed',
                bonds: 'completed',
                ppa: 'pending',
                do: 'pending',
                port_charges: 'pending',
                releasing: 'pending',
                billing: 'pending',
            },
        });

        const waitingImport = makeApiImportTransaction({
            id: 2,
            customs_ref_no: 'REF-IMP-002',
            created_at: '2026-04-08T00:00:00Z',
            waiting_since: '2026-04-13T00:00:00Z',
            stages: {
                boc: 'completed',
                bonds: 'pending',
                ppa: 'pending',
                do: 'pending',
                port_charges: 'pending',
                releasing: 'pending',
                billing: 'pending',
            },
        });

        vi.mocked(trackingApi.trackingApi.getAllImports).mockResolvedValueOnce([readyImport, waitingImport]);

        renderWithProviders(<ProcessorTransactionPage />);

        expect(await screen.findByText('REF-IMP-001')).toBeInTheDocument();
        expect(screen.getByText('REF-IMP-002')).toBeInTheDocument();

        expect(screen.getByText('Ready to Upload')).toBeInTheDocument();
        expect(screen.getByText('Waiting / Monitoring')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Open Upload Tasks/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /View Details/i })).toBeInTheDocument();
        expect(screen.getByText('PPA Ready')).toBeInTheDocument();
        expect(screen.getAllByText('Port Charges Waiting').length).toBeGreaterThan(0);
        expect(screen.getByText('Waiting 2 days')).toBeInTheDocument();
        expect(screen.getByText('Waiting for BONDS.')).toBeInTheDocument();
        expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: /^Overdue/i }));

        expect(screen.getByText('REF-IMP-002')).toBeInTheDocument();
        expect(screen.queryByText('REF-IMP-001')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /^All/i }));
        fireEvent.change(screen.getByPlaceholderText(/search bl, ref, client, vessel, blocker/i), {
            target: { value: '002' },
        });

        expect(screen.getByText('REF-IMP-002')).toBeInTheDocument();
        expect(screen.queryByText('REF-IMP-001')).not.toBeInTheDocument();
    });
});
