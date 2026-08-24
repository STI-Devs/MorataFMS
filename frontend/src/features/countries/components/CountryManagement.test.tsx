import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Country } from '../types/country.types';
import { CountryManagement } from './CountryManagement';

const {
    mockUseCountriesAdmin,
    mockUseCreateCountry,
    mockUseUpdateCountry,
    mockUseToggleCountry,
    mockToggleCountry,
} = vi.hoisted(() => ({
    mockUseCountriesAdmin: vi.fn(),
    mockUseCreateCountry: vi.fn(),
    mockUseUpdateCountry: vi.fn(),
    mockUseToggleCountry: vi.fn(),
    mockToggleCountry: vi.fn(),
}));

vi.mock('../hooks/useCountriesAdmin', () => ({
    useCountriesAdmin: mockUseCountriesAdmin,
    useCreateCountry: mockUseCreateCountry,
    useUpdateCountry: mockUseUpdateCountry,
    useToggleCountry: mockUseToggleCountry,
}));

const mockCountries: Country[] = [
    {
        id: 1,
        name: 'China',
        code: 'CN',
        type: 'both',
        type_label: 'Both',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 2,
        name: 'Hong Kong',
        code: 'HK',
        type: 'export_destination',
        type_label: 'Export Destination',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 3,
        name: 'Indonesia',
        code: 'ID',
        type: 'import_origin',
        type_label: 'Import Origin',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 4,
        name: 'Archived Country',
        code: 'AC',
        type: 'import_origin',
        type_label: 'Import Origin',
        is_active: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
];

describe('CountryManagement', () => {
    beforeEach(() => {
        mockToggleCountry.mockReset();
        mockToggleCountry.mockResolvedValue({ message: 'Country status toggled.' });

        mockUseCountriesAdmin.mockReturnValue({
            data: mockCountries,
            isLoading: false,
            isError: false,
        });

        mockUseCreateCountry.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseUpdateCountry.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseToggleCountry.mockReturnValue({ mutateAsync: mockToggleCountry, isPending: false });
    });

    it('renders country management dashboard with KPI cards and country table', () => {
        render(<CountryManagement />);

        expect(screen.getByText('Country Management')).toBeInTheDocument();
        expect(screen.getByText('China')).toBeInTheDocument();
        expect(screen.getByText('Hong Kong')).toBeInTheDocument();
        expect(screen.getByText('Indonesia')).toBeInTheDocument();
        expect(screen.getByText('Archived Country')).toBeInTheDocument();

        // Check KPI metrics
        expect(screen.getByText('Total Countries')).toBeInTheDocument();
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Both Flows').length).toBeGreaterThan(0);
    });

    it('filters countries by search query', () => {
        render(<CountryManagement />);

        const searchInput = screen.getByPlaceholderText('Search countries, ISO code...');
        fireEvent.change(searchInput, { target: { value: 'Hong' } });

        expect(screen.getByText('Hong Kong')).toBeInTheDocument();
        expect(screen.queryByText('China')).not.toBeInTheDocument();
    });

    it('filters countries by usage flow button', () => {
        render(<CountryManagement />);

        fireEvent.click(screen.getByRole('button', { name: /export destination/i }));

        expect(screen.getByText('Hong Kong')).toBeInTheDocument();
        expect(screen.queryByText('Indonesia')).not.toBeInTheDocument();
    });

    it('toggles country active status with confirmation modal', async () => {
        render(<CountryManagement />);

        const deactivateButtons = screen.getAllByTitle('Deactivate Country');
        fireEvent.click(deactivateButtons[0]);

        expect(screen.getByText('Deactivate Country?')).toBeInTheDocument();
        expect(
            screen.getByText(/Are you sure you want to deactivate China\? It will be hidden from client and transaction dropdowns\./)
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

        await waitFor(() => {
            expect(mockToggleCountry).toHaveBeenCalledWith(1);
        });
    });
});
