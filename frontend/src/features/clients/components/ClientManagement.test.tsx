import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client } from '../types/client.types';
import { ClientManagement } from './ClientManagement';

const {
    mockUseClients,
    mockUseCreateClient,
    mockUseUpdateClient,
    mockUseToggleClient,
    mockUseClientTransactions,
    mockToggleClient,
} = vi.hoisted(() => ({
    mockUseClients: vi.fn(),
    mockUseCreateClient: vi.fn(),
    mockUseUpdateClient: vi.fn(),
    mockUseToggleClient: vi.fn(),
    mockUseClientTransactions: vi.fn(),
    mockToggleClient: vi.fn(),
}));

vi.mock('../hooks/useClients', () => ({
    useClients: mockUseClients,
    useCreateClient: mockUseCreateClient,
    useUpdateClient: mockUseUpdateClient,
    useToggleClient: mockUseToggleClient,
    useClientTransactions: mockUseClientTransactions,
}));

vi.mock('../../../lib/axios', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    },
}));

const mockClients: Client[] = [
    {
        id: 1,
        name: 'Adventist Development and Relief Agency Inc.',
        type: 'both',
        country_id: 1,
        country: { id: 1, name: 'Philippines', code: 'PH' },
        contact_person: 'John Doe',
        contact_email: 'adra@example.com',
        contact_phone: '+63 912 345 6789',
        address: 'Manila, Philippines',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 2,
        name: 'Anflo Banana Corporation',
        type: 'exporter',
        country_id: 2,
        country: { id: 2, name: 'China', code: 'CN' },
        contact_person: 'Jane Smith',
        contact_email: 'anflo@example.com',
        contact_phone: null,
        address: null,
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 3,
        name: 'Legacy Inactive Importer',
        type: 'importer',
        country_id: null,
        country: null,
        contact_person: null,
        contact_email: null,
        contact_phone: null,
        address: null,
        is_active: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
];

describe('ClientManagement', () => {
    beforeEach(() => {
        mockToggleClient.mockReset();
        mockToggleClient.mockResolvedValue({ message: 'Client status toggled successfully.' });

        mockUseClients.mockReturnValue({
            data: mockClients,
            isLoading: false,
            isError: false,
        });

        mockUseCreateClient.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseUpdateClient.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseToggleClient.mockReturnValue({ mutateAsync: mockToggleClient, isPending: false });
        mockUseClientTransactions.mockReturnValue({
            data: {
                transactions: {
                    imports: [],
                    exports: [],
                },
            },
            isLoading: false,
        });
    });

    it('renders client management dashboard with KPI cards and clients list', () => {
        render(<ClientManagement />);

        expect(screen.getByText('Brokerage Client Management')).toBeInTheDocument();
        expect(screen.getByText('Adventist Development and Relief Agency Inc.')).toBeInTheDocument();
        expect(screen.getByText('Anflo Banana Corporation')).toBeInTheDocument();
        expect(screen.getByText('Legacy Inactive Importer')).toBeInTheDocument();

        // Check KPI metrics
        expect(screen.getByText('Total Clients')).toBeInTheDocument();
        expect(screen.getByText('Active Accounts')).toBeInTheDocument();
        expect(screen.getByText('Dual Operations')).toBeInTheDocument();
    });

    it('filters clients by search input', () => {
        render(<ClientManagement />);

        const searchInput = screen.getByPlaceholderText('Search client name, contact, country...');
        fireEvent.change(searchInput, { target: { value: 'Banana' } });

        expect(screen.getByText('Anflo Banana Corporation')).toBeInTheDocument();
        expect(screen.queryByText('Adventist Development and Relief Agency Inc.')).not.toBeInTheDocument();
    });

    it('filters clients by type button', () => {
        render(<ClientManagement />);

        fireEvent.click(screen.getByRole('button', { name: /exporter/i }));

        expect(screen.getByText('Anflo Banana Corporation')).toBeInTheDocument();
        expect(screen.queryByText('Adventist Development and Relief Agency Inc.')).not.toBeInTheDocument();
    });

    it('toggles client active status with confirmation modal', async () => {
        render(<ClientManagement />);

        // Click deactivate on the first active client
        const deactivateButtons = screen.getAllByTitle('Deactivate Client');
        fireEvent.click(deactivateButtons[0]);

        expect(screen.getByText('Deactivate Client?')).toBeInTheDocument();
        expect(
            screen.getByText('Are you sure you want to deactivate Adventist Development and Relief Agency Inc.?')
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

        await waitFor(() => {
            expect(mockToggleClient).toHaveBeenCalledWith(1);
        });
    });
});
