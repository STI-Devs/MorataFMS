import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditTransactionModal from './EditTransactionModal';

const { mockUseClients, mockUseCountries, mockUseLocationsOfGoods, mockUseUpdateTransaction } = vi.hoisted(() => ({
    mockUseClients: vi.fn(),
    mockUseCountries: vi.fn(),
    mockUseLocationsOfGoods: vi.fn(),
    mockUseUpdateTransaction: vi.fn(),
}));

vi.mock('../hooks/useClients', () => ({
    useClients: mockUseClients,
}));

vi.mock('../hooks/useCountries', () => ({
    useCountries: mockUseCountries,
}));

vi.mock('../hooks/useLocationsOfGoods', () => ({
    useLocationsOfGoods: mockUseLocationsOfGoods,
}));

vi.mock('../hooks/useUpdateTransaction', () => ({
    useUpdateTransaction: mockUseUpdateTransaction,
}));

describe('EditTransactionModal', () => {
    const mutateAsync = vi.fn();

    beforeEach(() => {
        mutateAsync.mockReset().mockResolvedValue(undefined);
        mockUseClients.mockReset();
        mockUseCountries.mockReset();
        mockUseLocationsOfGoods.mockReset();
        mockUseUpdateTransaction.mockReset();

        mockUseClients.mockImplementation((clientType: 'importer' | 'exporter') => ({
            data: clientType === 'importer'
                ? [{ id: 11, name: 'Acme Imports', type: 'importer' }]
                : [{ id: 21, name: 'Bravo Exports', type: 'exporter' }],
        }));
        mockUseCountries.mockImplementation((countryType?: 'import_origin' | 'export_destination') => ({
            data: countryType === 'import_origin'
                ? [{ id: 31, name: 'Japan', code: 'JP' }]
                : [{ id: 41, name: 'Singapore', code: 'SG' }],
        }));
        mockUseLocationsOfGoods.mockReturnValue({
            data: [{ id: 51, name: 'South Harbor Warehouse' }],
        });
        mockUseUpdateTransaction.mockReturnValue({
            mutateAsync,
            isPending: false,
            isError: false,
            error: null,
        });
    });

    it('lets import users update selective color, vessel name, and location of goods', async () => {
        const onClose = vi.fn();

        render(
            <EditTransactionModal
                isOpen
                onClose={onClose}
                type="import"
                transaction={{
                    id: 99,
                    customs_ref_no: 'REF-2026-099',
                    bl_no: 'BL-2026-099',
                    vessel_name: 'MV Old Vessel',
                    selective_color: 'yellow',
                    importer: { id: 11, name: 'Acme Imports' },
                    arrival_date: '2026-04-10',
                    origin_country: { id: 31, name: 'Japan', code: 'JP' },
                    location_of_goods: { id: 51, name: 'South Harbor Warehouse' },
                    status: 'Pending',
                    notes: null,
                    waiting_since: null,
                    created_at: '2026-04-10T00:00:00Z',
                    open_remarks_count: 0,
                    documents_count: 0,
                }}
            />,
        );

        expect(screen.getByLabelText(/selective color/i)).not.toBeDisabled();

        fireEvent.change(screen.getByLabelText(/selective color/i), { target: { value: 'red' } });
        fireEvent.change(screen.getByLabelText(/vessel name/i), { target: { value: 'MV New Vessel' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                id: 99,
                data: {
                    customs_ref_no: 'REF-2026-099',
                    bl_no: 'BL-2026-099',
                    vessel_name: 'MV New Vessel',
                    selective_color: 'red',
                    importer_id: 11,
                    origin_country_id: 31,
                    location_of_goods_id: 51,
                    arrival_date: '2026-04-10',
                },
            });
        });

        expect(onClose).toHaveBeenCalled();
    });
});
