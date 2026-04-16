import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import type { ArchiveDocument } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import { EditArchiveRecordModal } from './EditArchiveRecordModal';

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: {
        getClients: vi.fn(),
        getCountries: vi.fn(),
        getLocationsOfGoods: vi.fn(),
        updateArchiveImport: vi.fn(),
        updateArchiveExport: vi.fn(),
    },
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('EditArchiveRecordModal', () => {
    const importRecord = {
        id: 1,
        type: 'import',
        bl_no: 'BL-ARCH-IMP-001',
        customs_ref_no: null,
        month: 4,
        client: 'Archive Importer',
        client_id: 11,
        selective_color: 'green',
        origin_country: 'Philippines',
        origin_country_id: 21,
        vessel_name: 'MV Archive Pearl',
        location_of_goods: 'South Harbor Warehouse',
        location_of_goods_id: 31,
        transaction_date: '2024-08-20',
        transaction_id: 101,
        documentable_type: 'App\\Models\\ImportTransaction',
        stage: 'boc',
        filename: 'archive-boc.pdf',
        formatted_size: '100 KB',
        size_bytes: 102400,
        archive_origin: 'direct_archive_upload',
        archived_at: '2024-08-20T00:00:00Z',
        uploaded_at: '2024-08-20T00:00:00Z',
        uploader: { id: 1, name: 'Encoder User' },
    } satisfies ArchiveDocument;

    const exportRecord = {
        id: 2,
        type: 'export',
        bl_no: 'BL-ARCH-EXP-001',
        month: 4,
        client: 'Archive Shipper',
        client_id: 12,
        destination_country: 'Japan',
        destination_country_id: 22,
        vessel_name: null,
        transaction_date: '2024-08-21',
        transaction_id: 102,
        documentable_type: 'App\\Models\\ExportTransaction',
        stage: 'boc',
        filename: 'archive-export.pdf',
        formatted_size: '120 KB',
        size_bytes: 122880,
        archive_origin: 'direct_archive_upload',
        archived_at: '2024-08-21T00:00:00Z',
        uploaded_at: '2024-08-21T00:00:00Z',
        uploader: { id: 2, name: 'Admin User' },
    } satisfies ArchiveDocument;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(trackingApi.getClients).mockResolvedValue([
            { id: 11, name: 'Archive Importer', type: 'importer' },
            { id: 12, name: 'Archive Shipper', type: 'exporter' },
        ]);
        vi.mocked(trackingApi.getCountries).mockResolvedValue([
            { id: 21, name: 'Philippines', code: 'PH' },
            { id: 22, name: 'Japan', code: 'JP' },
        ]);
        vi.mocked(trackingApi.getLocationsOfGoods).mockResolvedValue([
            { id: 31, name: 'South Harbor Warehouse' },
        ]);
    });

    it('shows the current archive selections immediately while lookup options are still loading', () => {
        vi.mocked(trackingApi.getClients).mockImplementation(() => new Promise(() => {}));
        vi.mocked(trackingApi.getCountries).mockImplementation(() => new Promise(() => {}));
        vi.mocked(trackingApi.getLocationsOfGoods).mockImplementation(() => new Promise(() => {}));

        render(
            <EditArchiveRecordModal
                isOpen={true}
                onClose={() => {}}
                record={importRecord}
            />,
            { wrapper: createWrapper() },
        );

        expect(screen.getByDisplayValue('Archive Importer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Philippines')).toBeInTheDocument();
        expect(screen.getByDisplayValue('South Harbor Warehouse')).toBeInTheDocument();
    });

    it('submits archive import edits with archive-specific optional fields', async () => {
        vi.mocked(trackingApi.updateArchiveImport).mockResolvedValue({ id: 101 } as never);
        const onClose = vi.fn();

        render(
            <EditArchiveRecordModal
                isOpen={true}
                onClose={onClose}
                record={importRecord}
            />,
            { wrapper: createWrapper() },
        );

        fireEvent.change(screen.getByLabelText(/Customs Ref No\./i), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText(/^Bill of Lading$/i), { target: { value: 'BL-ARCH-IMP-009' } });

        const importForm = screen.getByRole('button', { name: /Save Archive/i }).closest('form');
        expect(importForm).not.toBeNull();
        fireEvent.submit(importForm!);

        await waitFor(() => {
            expect(trackingApi.updateArchiveImport).toHaveBeenCalledWith(101, {
                customs_ref_no: null,
                bl_no: 'BL-ARCH-IMP-009',
                vessel_name: 'MV Archive Pearl',
                selective_color: 'green',
                importer_id: 11,
                origin_country_id: 21,
                location_of_goods_id: 31,
                file_date: '2024-08-20',
            });
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('submits archive export edits without forcing a vessel name', async () => {
        vi.mocked(trackingApi.updateArchiveExport).mockResolvedValue({ id: 102 } as never);

        render(
            <EditArchiveRecordModal
                isOpen={true}
                onClose={() => {}}
                record={exportRecord}
            />,
            { wrapper: createWrapper() },
        );

        fireEvent.change(screen.getByLabelText(/^Bill of Lading$/i), { target: { value: 'BL-ARCH-EXP-009' } });
        const exportForm = screen.getByRole('button', { name: /Save Archive/i }).closest('form');
        expect(exportForm).not.toBeNull();
        fireEvent.submit(exportForm!);

        await waitFor(() => {
            expect(trackingApi.updateArchiveExport).toHaveBeenCalledWith(102, {
                bl_no: 'BL-ARCH-EXP-009',
                vessel: null,
                shipper_id: 12,
                destination_country_id: 22,
                file_date: '2024-08-21',
            });
        });
    });
});
