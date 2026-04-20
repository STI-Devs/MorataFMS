import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { VesselGroupedImportList } from './VesselGroupedImportList';
import { VesselGroupedExportList } from './VesselGroupedExportList';

vi.mock('../../../components/Pagination', () => ({
    Pagination: () => <div data-testid="pagination" />,
}));

vi.mock('./RemarkViewerModal', () => ({
    RemarkViewerModal: () => null,
}));

vi.mock('./ImportTransactionRow', () => ({
    ImportTransactionRow: ({ transaction }: { transaction: { customs_ref_no: string } }) => (
        <div>{transaction.customs_ref_no}</div>
    ),
}));

vi.mock('./ExportTransactionRow', () => ({
    ExportTransactionRow: ({ transaction }: { transaction: { bl_no: string } }) => (
        <div>{transaction.bl_no}</div>
    ),
}));

vi.mock('../hooks/useImports', () => ({
    useImports: () => ({
        data: {
            data: [
                {
                    id: 1,
                    customs_ref_no: 'IMP-0001',
                    bl_no: 'BL-0001',
                    vessel_name: 'WITWIW',
                    selective_color: 'green',
                    importer: { id: 4, name: 'CI PHILIPPINES INC' },
                    arrival_date: '2026-04-15',
                    assigned_user: { id: 9, name: 'Encoder User' },
                    status: 'Pending',
                    notes: null,
                    waiting_since: null,
                    created_at: '2026-04-20T00:00:00Z',
                    open_remarks_count: 0,
                    documents_count: 1,
                },
            ],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: 1,
            },
            links: {
                first: null,
                last: null,
                prev: null,
                next: null,
            },
        },
        isLoading: false,
    }),
}));

vi.mock('../hooks/useExports', () => ({
    useExports: () => ({
        data: {
            data: [
                {
                    id: 2,
                    bl_no: 'EXP-0001',
                    vessel: 'ERER',
                    export_date: '2026-04-15',
                    shipper: { id: 7, name: 'AKTIV MULTI TRADING CO. PHILS. INC.' },
                    assigned_user: { id: 8, name: 'Encoder User' },
                    status: 'Pending',
                    notes: null,
                    waiting_since: null,
                    created_at: '2026-04-20T00:00:00Z',
                    open_remarks_count: 0,
                    documents_count: 1,
                },
            ],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: 1,
            },
            links: {
                first: null,
                last: null,
                prev: null,
                next: null,
            },
        },
        isLoading: false,
    }),
}));

describe('Vessel grouped encoder lists', () => {
    it('renders the import transactions inside an inset vessel hierarchy panel', () => {
        renderWithProviders(
            <VesselGroupedImportList
                filters={{ search: '', status: 'all', time: 'all' }}
                onCancel={vi.fn()}
            />,
            {
                route: '/imports?page=1&per_page=15',
                path: '/imports',
            },
        );

        expect(screen.getByText('WITWIW')).toBeInTheDocument();
        expect(screen.getByText('IMP-0001')).toBeInTheDocument();
        expect(screen.getByTestId('tracking-vessel-group-panel')).toBeInTheDocument();
        expect(screen.getByTestId('tracking-vessel-group-guide')).toHaveClass('border-l-2', 'border-slate-300');
    });

    it('renders the export transactions inside an inset vessel hierarchy panel', () => {
        renderWithProviders(
            <VesselGroupedExportList
                filters={{ search: '', status: 'all', time: 'all' }}
                onCancel={vi.fn()}
            />,
            {
                route: '/exports?page=1&per_page=15',
                path: '/exports',
            },
        );

        expect(screen.getByText('ERER')).toBeInTheDocument();
        expect(screen.getByText('EXP-0001')).toBeInTheDocument();
        expect(screen.getByTestId('tracking-vessel-group-panel')).toBeInTheDocument();
        expect(screen.getByTestId('tracking-vessel-group-guide')).toHaveClass('border-l-2', 'border-slate-300');
    });
});
