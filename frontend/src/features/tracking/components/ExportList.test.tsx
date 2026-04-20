import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { ExportList } from './ExportList';

vi.mock('../hooks/useCreateTransaction', () => ({
    useCreateTransaction: () => ({
        mutateAsync: vi.fn(),
        isPending: false,
    }),
}));

vi.mock('../hooks/useCancelTransaction', () => ({
    useCancelTransaction: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}));

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('./VesselListToolbar', () => ({
    VesselListToolbar: () => <div>Export toolbar</div>,
}));

vi.mock('./VesselGroupedExportList', () => ({
    VesselGroupedExportList: () => <div>Grouped export list</div>,
}));

vi.mock('./EncodeModal', () => ({
    EncodeModal: () => null,
}));

vi.mock('./CancelTransactionModal', () => ({
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
