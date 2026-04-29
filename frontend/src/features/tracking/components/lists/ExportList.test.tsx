import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { ExportList } from './ExportList';

vi.mock('../../hooks/useCreateTransaction', () => ({
    useCreateTransaction: () => ({
        mutateAsync: vi.fn(),
        isPending: false,
    }),
}));

vi.mock('../../hooks/useCancelTransaction', () => ({
    useCancelTransaction: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../vessel-groups/VesselListToolbar', () => ({
    VesselListToolbar: () => <div>Export toolbar</div>,
}));

vi.mock('../vessel-groups/VesselGroupedExportList', () => ({
    VesselGroupedExportList: () => <div>Grouped export list</div>,
}));

vi.mock('../modals/EncodeModal', () => ({
    EncodeModal: () => null,
}));

vi.mock('../modals/CancelTransactionModal', () => ({
    CancelTransactionModal: () => null,
}));

describe('ExportList', () => {
    it('renders the grouped encoder page shell with the current export guidance', () => {
        renderWithProviders(<ExportList />, {
            route: appRoutes.exports,
            path: appRoutes.exports,
        });

        expect(screen.getByText('Export Transactions')).toBeInTheDocument();
        expect(
            screen.getByText('Manage each export shipment record with transaction-level status, document, and cancellation controls.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Grouped export list')).toBeInTheDocument();
    });
});
