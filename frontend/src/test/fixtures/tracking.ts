import type {
    ApiDocument,
    ApiExportTransaction,
    ApiImportTransaction,
    DocumentTransactionListResponse,
    DocumentTransactionListRow,
} from '../../features/tracking/types';
import { mapExportTransaction, mapImportTransaction } from '../../features/tracking/utils/mappers';
import type { TransactionDetailResult } from '../../features/tracking/utils/transactionDetail';

export function makeApiImportTransaction(
    overrides: Partial<ApiImportTransaction> = {},
): ApiImportTransaction {
    return {
        id: 101,
        customs_ref_no: 'IMP-2026-001',
        bl_no: 'BL-IMP-001',
        vessel_name: 'MV Pacific Star',
        selective_color: 'green',
        importer: { id: 77, name: 'Acme Imports' },
        arrival_date: '2026-03-20',
        origin_country: { id: 10, name: 'Japan', code: 'JP' },
        location_of_goods: { id: 14, name: 'South Harbor Warehouse' },
        assigned_user: { id: 5, name: 'Encoder User' },
        status: 'Processing',
        notes: null,
        waiting_since: null,
        created_at: '2026-03-20T00:00:00Z',
        open_remarks_count: 2,
        documents_count: 1,
        ...overrides,
    };
}

export function makeApiExportTransaction(
    overrides: Partial<ApiExportTransaction> = {},
): ApiExportTransaction {
    return {
        id: 202,
        bl_no: 'BL-EXP-001',
        vessel: 'MV Pacific',
        export_date: '2026-03-21',
        shipper: { id: 88, name: 'Bravo Exports' },
        destination_country: { id: 30, name: 'Singapore', code: 'SG' },
        assigned_user: { id: 6, name: 'Admin User' },
        status: 'Completed',
        notes: null,
        waiting_since: null,
        created_at: '2026-03-21T00:00:00Z',
        open_remarks_count: 1,
        documents_count: 1,
        ...overrides,
    };
}

export function makeApiDocument(overrides: Partial<ApiDocument> = {}): ApiDocument {
    return {
        id: 301,
        type: 'boc',
        filename: 'boc-clearance.pdf',
        size_bytes: 4096,
        formatted_size: '4 KB',
        version: 1,
        download_url: '/api/documents/301/download',
        uploaded_by: { id: 8, name: 'Admin User' },
        created_at: '2026-03-24T00:00:00Z',
        updated_at: '2026-03-24T00:00:00Z',
        ...overrides,
    };
}

export function makeDocumentTransactionRow(
    overrides: Partial<DocumentTransactionListRow> = {},
): DocumentTransactionListRow {
    return {
        id: 401,
        type: 'import',
        ref: 'IMP-2026-001',
        bl_no: 'BL-IMP-001',
        client: 'ACME IMPORTS',
        date: '2026-03-20',
        date_label: 'Arrival',
        port: 'Manila',
        vessel: 'MV Pacific',
        status: 'completed',
        documents_count: 2,
        ...overrides,
    };
}

export function makeDocumentTransactionsResponse(
    overrides: Partial<DocumentTransactionListResponse> = {},
): DocumentTransactionListResponse {
    return {
        data: [makeDocumentTransactionRow()],
        counts: {
            completed: 1,
            imports: 1,
            exports: 0,
            cancelled: 0,
        },
        meta: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 1,
        },
        ...overrides,
    };
}

export function makeImportDetailResult(
    overrides: Partial<ApiImportTransaction> = {},
): TransactionDetailResult {
    const raw = makeApiImportTransaction(overrides);

    return {
        raw,
        mapped: mapImportTransaction(raw),
        isImport: true,
    };
}

export function makeExportDetailResult(
    overrides: Partial<ApiExportTransaction> = {},
): TransactionDetailResult {
    const raw = makeApiExportTransaction(overrides);

    return {
        raw,
        mapped: mapExportTransaction(raw),
        isImport: false,
    };
}
