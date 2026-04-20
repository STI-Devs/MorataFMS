import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { ImportList } from './ImportList';

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
    VesselListToolbar: () => <div>Import toolbar</div>,
}));

vi.mock('./VesselGroupedImportList', () => ({
    VesselGroupedImportList: () => <div>Grouped import list</div>,
}));

vi.mock('./EncodeModal', () => ({
    EncodeModal: () => null,
}));

vi.mock('./CancelTransactionModal', () => ({
    CancelTransactionModal: () => null,
}));

describe('ImportList', () => {
    it('renders the grouped encoder page shell with the current import guidance', () => {
        renderWithProviders(<ImportList />, {
            route: appRoutes.imports,
            path: appRoutes.imports,
        });

        expect(screen.getByText('Import Transactions')).toBeInTheDocument();
        expect(
            screen.getByText('Manage each import transaction with full status, document, and remarks control at the record level.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Grouped import list')).toBeInTheDocument();
    });
});
