import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import type { ArchiveYear } from '../../documents/types/document.types';
import { useArchiveWorkspace } from './useArchiveWorkspace';

const archiveData: ArchiveYear[] = [
    {
        year: 2025,
        imports: 1,
        exports: 1,
        documents: [
            {
                id: 1,
                type: 'import',
                bl_no: 'BL-IMP-001',
                customs_ref_no: 'CUS-IMP-001',
                month: 1,
                client: 'Atlas Importers',
                client_id: 11,
                selective_color: 'green',
                origin_country: 'Japan',
                destination_country: null,
                vessel_name: 'MV Sampaguita',
                location_of_goods: 'South Harbor Warehouse',
                transaction_date: '2025-01-15',
                transaction_id: 101,
                documentable_type: 'App\\Models\\ImportTransaction',
                stage: 'boc',
                filename: 'boc.pdf',
                formatted_size: '120 KB',
                size_bytes: 120000,
                archive_origin: 'direct_archive_upload',
                archived_at: '2025-01-16T00:00:00Z',
                uploaded_at: '2025-01-16T00:00:00Z',
                uploader: { id: 1, name: 'Encoder User' },
            },
            {
                id: 2,
                type: 'export',
                bl_no: 'BL-EXP-002',
                customs_ref_no: 'CUS-EXP-002',
                month: 2,
                client: 'Pacific Exporters',
                client_id: 22,
                selective_color: null,
                origin_country: null,
                destination_country: 'Canada',
                vessel_name: 'MV Coral Reef',
                location_of_goods: null,
                transaction_date: '2025-02-20',
                transaction_id: 202,
                documentable_type: 'App\\Models\\ExportTransaction',
                stage: 'billing',
                filename: 'billing.pdf',
                formatted_size: '150 KB',
                size_bytes: 150000,
                archive_origin: 'direct_archive_upload',
                archived_at: '2025-02-21T00:00:00Z',
                uploaded_at: '2025-02-21T00:00:00Z',
                uploader: { id: 2, name: 'Admin User' },
            },
        ],
    },
];

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useArchiveWorkspace', () => {
    it('matches archive records by vessel name, country, and customs reference', () => {
        const { result } = renderHook(
            () => useArchiveWorkspace({ archiveData, queryKey: ['archives'] }),
            { wrapper: createWrapper() },
        );

        act(() => {
            result.current.setGlobalSearch('sampaguita');
        });

        expect(result.current.globalResults.map((record) => record.blNo)).toEqual(['BL-IMP-001']);
        expect(result.current.flatDocumentList.map((record) => record.blNo)).toEqual(['BL-IMP-001']);

        act(() => {
            result.current.setGlobalSearch('canada');
        });

        expect(result.current.globalResults.map((record) => record.blNo)).toEqual(['BL-EXP-002']);
        expect(result.current.flatDocumentList.map((record) => record.blNo)).toEqual(['BL-EXP-002']);

        act(() => {
            result.current.setGlobalSearch('CUS-IMP-001');
        });

        expect(result.current.globalResults.map((record) => record.blNo)).toEqual(['BL-IMP-001']);
        expect(result.current.flatDocumentList.map((record) => record.blNo)).toEqual(['BL-IMP-001']);
    });
});
