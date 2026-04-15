import { screen } from '@testing-library/react';
import { AccountingImpExpPage } from '../AccountingImpExpPage';
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

describe('AccountingImpExpPage', () => {
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

    it('renders the accounting task queue', async () => {
        renderWithProviders(<AccountingImpExpPage />);

        expect(screen.getByText('Finance & Accounting Tasks')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Imports/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Exports/i })).toBeInTheDocument();

        expect(trackingApi.trackingApi.getAllImports).toHaveBeenCalledWith({
            exclude_statuses: 'completed,cancelled',
            operational_scope: 'workspace',
        });
    });

    it('displays shared transactions for billing', async () => {
        const mockImport = makeApiImportTransaction({
            id: 2,
            customs_ref_no: 'REF-ACT-002',
            created_at: '2026-04-06T00:00:00Z',
            waiting_since: '2026-04-12T00:00:00Z',
            stages: {
                boc: 'completed',
                bonds: 'completed',
                phytosanitary: 'completed',
                ppa: 'completed',
                do: 'completed',
                port_charges: 'pending',
                releasing: 'pending',
                billing: 'pending',
            },
        });

        vi.mocked(trackingApi.trackingApi.getAllImports).mockResolvedValueOnce([mockImport]);

        renderWithProviders(<AccountingImpExpPage />);

        expect(await screen.findByText('REF-ACT-002')).toBeInTheDocument();
        expect(screen.getByText('Billing & Liquidation:')).toBeInTheDocument();
        expect(screen.getByText('Ready to Upload')).toBeInTheDocument();
        expect(screen.getByText('Waiting / Monitoring')).toBeInTheDocument();
        expect(screen.getByText('Waiting 3 days')).toBeInTheDocument();
        expect(screen.getByText('Waiting for Payment for Port Charges.')).toBeInTheDocument();
    });
});
