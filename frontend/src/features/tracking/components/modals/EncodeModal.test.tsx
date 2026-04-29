import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EncodeModal } from './EncodeModal';

const { mockUseClients, mockUseCountries, mockUseLocationsOfGoods } = vi.hoisted(() => ({
    mockUseClients: vi.fn(),
    mockUseCountries: vi.fn(),
    mockUseLocationsOfGoods: vi.fn(),
}));

vi.mock('../../hooks/useClients', () => ({
    useClients: mockUseClients,
}));

vi.mock('../../hooks/useCountries', () => ({
    useCountries: mockUseCountries,
}));

vi.mock('../../hooks/useLocationsOfGoods', () => ({
    useLocationsOfGoods: mockUseLocationsOfGoods,
}));

describe('EncodeModal', () => {
    beforeEach(() => {
        mockUseClients.mockReset();
        mockUseCountries.mockReset();
        mockUseLocationsOfGoods.mockReset();

        mockUseClients.mockReturnValue({
            data: [{ id: 1, name: 'AKTIV MULTI TRADING CORP', type: 'importer' }],
            isLoading: false,
        });
        mockUseCountries.mockImplementation((countryType?: 'import_origin' | 'export_destination') => ({
            data: countryType === 'import_origin'
                ? [{ id: 21, name: 'Japan', code: 'JP' }]
                : [],
            isLoading: false,
        }));
        mockUseLocationsOfGoods.mockReturnValue({
            data: [{ id: 4, name: 'South Harbor Warehouse' }],
            isLoading: false,
        });
    });

    it('shows the backend duplicate message instead of the generic axios status text', async () => {
        const onSave = vi.fn().mockRejectedValue({
            response: {
                status: 422,
                data: {
                    message: 'A transaction with this bill of lading already exists.',
                },
            },
        });

        render(<EncodeModal isOpen onClose={vi.fn()} type="import" onSave={onSave} />);

        fireEvent.change(screen.getByLabelText(/blsc/i), { target: { value: 'green' } });
        fireEvent.change(screen.getByLabelText(/customs ref no/i), { target: { value: 'REF123456' } });
        fireEvent.change(screen.getByLabelText(/importer/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/bill of lading/i), { target: { value: 'BL123456' } });
        fireEvent.change(screen.getByLabelText(/vessel name/i), { target: { value: 'MV Missing Duplicate' } });
        fireEvent.change(screen.getByLabelText(/arrival date/i), { target: { value: '2026-04-09' } });

        fireEvent.click(screen.getByRole('button', { name: /encode/i }));

        await waitFor(() => {
            expect(
                screen.getByText('A transaction with this bill of lading already exists.'),
            ).toBeInTheDocument();
        });

        expect(screen.queryByText('Request failed with status code 422')).not.toBeInTheDocument();
    });

    it('requires an explicit departure date when encoding an export transaction', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);

        mockUseClients.mockReturnValue({
            data: [{ id: 1, name: 'ANFLO BANANA CORPORATION', type: 'exporter' }],
            isLoading: false,
        });
        mockUseCountries.mockImplementation((countryType?: 'import_origin' | 'export_destination') => ({
            data: countryType === 'export_destination'
                ? [{ id: 9, name: 'Singapore', code: 'SG' }]
                : [],
            isLoading: false,
        }));

        render(<EncodeModal isOpen onClose={vi.fn()} type="export" onSave={onSave} />);

        expect(screen.getByLabelText(/departure date/i)).toHaveValue('');
        expect(screen.getByLabelText(/^vessel$/i)).toBeRequired();

        fireEvent.change(screen.getByLabelText(/shipper/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/bill of lading/i), { target: { value: 'BL-EXPORT-001' } });
        fireEvent.change(screen.getByLabelText(/vessel/i), { target: { value: 'MV Pacific' } });
        fireEvent.change(screen.getByLabelText(/departure date/i), { target: { value: '2026-04-20' } });
        fireEvent.change(screen.getByLabelText(/port of destination/i), { target: { value: '9' } });

        fireEvent.click(screen.getByRole('button', { name: /encode/i }));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith({
                shipper_id: 1,
                bl_no: 'BL-EXPORT-001',
                vessel: 'MV Pacific',
                export_date: '2026-04-20',
                destination_country_id: 9,
            });
        });
    });

    it('includes origin, vessel name, and location of goods when encoding an import transaction', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);

        render(<EncodeModal isOpen onClose={vi.fn()} type="import" onSave={onSave} />);

        expect(screen.getByLabelText(/vessel name/i)).toBeRequired();
        fireEvent.change(screen.getByLabelText(/blsc/i), { target: { value: 'orange' } });
        fireEvent.change(screen.getByLabelText(/customs ref no/i), { target: { value: 'REF-IMP-909' } });
        fireEvent.change(screen.getByLabelText(/importer/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/bill of lading/i), { target: { value: 'BL-IMP-909' } });
        fireEvent.change(screen.getByLabelText(/vessel name/i), { target: { value: 'MV Golden Tide' } });
        fireEvent.change(screen.getByLabelText(/origin/i), { target: { value: '21' } });
        fireEvent.change(screen.getByLabelText(/location of goods/i), { target: { value: '4' } });
        fireEvent.change(screen.getByLabelText(/arrival date/i), { target: { value: '2026-04-15' } });

        fireEvent.click(screen.getByRole('button', { name: /encode/i }));

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith({
                customs_ref_no: 'REF-IMP-909',
                bl_no: 'BL-IMP-909',
                vessel_name: 'MV Golden Tide',
                selective_color: 'orange',
                importer_id: 1,
                origin_country_id: 21,
                location_of_goods_id: 4,
                arrival_date: '2026-04-15',
            });
        });
    });
});
