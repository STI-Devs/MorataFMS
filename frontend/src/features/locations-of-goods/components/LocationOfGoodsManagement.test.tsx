import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocationOfGoods } from '../types/locationOfGoods.types';
import { LocationOfGoodsManagement } from './LocationOfGoodsManagement';

const {
    mockUseLocationsOfGoodsAdmin,
    mockUseCreateLocationOfGoods,
    mockUseUpdateLocationOfGoods,
    mockUseToggleLocationOfGoods,
    mockToggleLocation,
} = vi.hoisted(() => ({
    mockUseLocationsOfGoodsAdmin: vi.fn(),
    mockUseCreateLocationOfGoods: vi.fn(),
    mockUseUpdateLocationOfGoods: vi.fn(),
    mockUseToggleLocationOfGoods: vi.fn(),
    mockToggleLocation: vi.fn(),
}));

vi.mock('../hooks/useLocationsOfGoodsAdmin', () => ({
    useLocationsOfGoodsAdmin: mockUseLocationsOfGoodsAdmin,
    useCreateLocationOfGoods: mockUseCreateLocationOfGoods,
    useUpdateLocationOfGoods: mockUseUpdateLocationOfGoods,
    useToggleLocationOfGoods: mockUseToggleLocationOfGoods,
}));

const mockLocations: LocationOfGoods[] = [
    {
        id: 1,
        name: 'AJMR',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 2,
        name: 'DICT',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 3,
        name: 'KTC',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 4,
        name: 'PACINTER',
        is_active: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
];

describe('LocationOfGoodsManagement', () => {
    beforeEach(() => {
        mockToggleLocation.mockReset();
        mockToggleLocation.mockResolvedValue({ message: 'Location status toggled.' });

        mockUseLocationsOfGoodsAdmin.mockReturnValue({
            data: mockLocations,
            isLoading: false,
            isError: false,
        });

        mockUseCreateLocationOfGoods.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseUpdateLocationOfGoods.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseToggleLocationOfGoods.mockReturnValue({ mutateAsync: mockToggleLocation, isPending: false });
    });

    it('renders location of goods dashboard with KPI cards and table', () => {
        render(<LocationOfGoodsManagement />);

        expect(screen.getByText('Location of Goods')).toBeInTheDocument();
        expect(screen.getByText('AJMR')).toBeInTheDocument();
        expect(screen.getByText('DICT')).toBeInTheDocument();
        expect(screen.getByText('KTC')).toBeInTheDocument();
        expect(screen.getByText('PACINTER')).toBeInTheDocument();

        // Check KPI metric cards
        expect(screen.getByText('Total Locations')).toBeInTheDocument();
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
    });

    it('filters locations by search term', () => {
        render(<LocationOfGoodsManagement />);

        const searchInput = screen.getByPlaceholderText('Search locations, ports, yards...');
        fireEvent.change(searchInput, { target: { value: 'DICT' } });

        expect(screen.getByText('DICT')).toBeInTheDocument();
        expect(screen.queryByText('AJMR')).not.toBeInTheDocument();
    });

    it('filters locations by status pill buttons', () => {
        render(<LocationOfGoodsManagement />);

        fireEvent.click(screen.getByRole('button', { name: /^active/i }));

        expect(screen.getByText('AJMR')).toBeInTheDocument();
        expect(screen.getByText('DICT')).toBeInTheDocument();
        expect(screen.queryByText('PACINTER')).not.toBeInTheDocument();
    });

    it('toggles location active status with confirmation modal', async () => {
        render(<LocationOfGoodsManagement />);

        const deactivateButtons = screen.getAllByTitle('Deactivate Location');
        fireEvent.click(deactivateButtons[0]);

        expect(screen.getByText('Deactivate Location?')).toBeInTheDocument();
        expect(
            screen.getByText(/Are you sure you want to deactivate AJMR\? It will be hidden from import declaration dropdowns\./)
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

        await waitFor(() => {
            expect(mockToggleLocation).toHaveBeenCalledWith(1);
        });
    });
});
