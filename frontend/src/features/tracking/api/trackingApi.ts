import api from '../../../lib/axios';
import type {
    ApiClient,
    ApiCountry,
    ApiDocument,
    ApiExportTransaction,
    ApiImportTransaction,
    ApiTrackingDetail,
    CreateExportPayload,
    CreateImportPayload,
    DocumentTransactionListResponse,
    DocumentableType,
    PaginatedResponse,
    TransactionStats,
    UploadDocumentPayload,
} from '../types';

const MAX_PAGE_SIZE = 500;

async function fetchAllPages<T>(
    fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
    const firstPage = await fetchPage(1);
    const allRows = [...firstPage.data];
    const lastPage = firstPage.meta?.last_page ?? 1;

    if (lastPage <= 1) {
        return allRows;
    }

    const remainingPages = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, index) => fetchPage(index + 2)),
    );

    for (const page of remainingPages) {
        allRows.push(...page.data);
    }

    return allRows;
}

export const trackingApi = {
    getTrackingDetail: async (referenceId: string): Promise<ApiTrackingDetail> => {
        const response = await api.get(`/api/tracking/${encodeURIComponent(referenceId)}`);
        return response.data.data;
    },

    // --- Import Transactions ---
    getImports: async (params?: {
        search?: string;
        status?: string;
        selective_color?: string;
        exclude_statuses?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<ApiImportTransaction>> => {
        const response = await api.get('/api/import-transactions', { params });
        return response.data;
    },

    createImport: async (data: CreateImportPayload): Promise<ApiImportTransaction> => {
        const response = await api.post('/api/import-transactions', data);
        return response.data.data;
    },

    updateImport: async ({ id, data }: { id: number; data: CreateImportPayload }): Promise<ApiImportTransaction> => {
        const response = await api.put(`/api/import-transactions/${id}`, data);
        return response.data.data;
    },

    // --- Export Transactions ---
    getExports: async (params?: {
        search?: string;
        status?: string;
        exclude_statuses?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<ApiExportTransaction>> => {
        const response = await api.get('/api/export-transactions', { params });
        return response.data;
    },

    getAllImports: async (params?: {
        search?: string;
        status?: string;
        selective_color?: string;
        exclude_statuses?: string;
    }): Promise<ApiImportTransaction[]> =>
        fetchAllPages((page) =>
            trackingApi.getImports({
                ...params,
                page,
                per_page: MAX_PAGE_SIZE,
            }),
        ),

    getAllExports: async (params?: {
        search?: string;
        status?: string;
        exclude_statuses?: string;
    }): Promise<ApiExportTransaction[]> =>
        fetchAllPages((page) =>
            trackingApi.getExports({
                ...params,
                page,
                per_page: MAX_PAGE_SIZE,
            }),
        ),

    createExport: async (data: CreateExportPayload): Promise<ApiExportTransaction> => {
        const response = await api.post('/api/export-transactions', data);
        return response.data.data;
    },

    updateExport: async ({ id, data }: { id: number; data: CreateExportPayload }): Promise<ApiExportTransaction> => {
        const response = await api.put(`/api/export-transactions/${id}`, data);
        return response.data.data;
    },

    // --- Stats (total counts across all records) ---
    getImportStats: async (signal?: AbortSignal): Promise<TransactionStats> => {
        const response = await api.get('/api/import-transactions/stats', { signal });
        return response.data.data;
    },

    getExportStats: async (signal?: AbortSignal): Promise<TransactionStats> => {
        const response = await api.get('/api/export-transactions/stats', { signal });
        return response.data.data;
    },

    // --- Delete Transactions ---
    deleteImport: async (id: number): Promise<void> => {
        await api.delete(`/api/import-transactions/${id}`);
    },

    deleteExport: async (id: number): Promise<void> => {
        await api.delete(`/api/export-transactions/${id}`);
    },

    // --- Cancel Transactions ---
    cancelImport: async (id: number, reason: string): Promise<void> => {
        await api.patch(`/api/import-transactions/${id}/cancel`, { reason });
    },

    cancelExport: async (id: number, reason: string): Promise<void> => {
        await api.patch(`/api/export-transactions/${id}/cancel`, { reason });
    },

    // --- Clients (for dropdowns) ---
    getClients: async (type?: 'importer' | 'exporter'): Promise<ApiClient[]> => {
        const response = await api.get('/api/clients', {
            params: type ? { type } : undefined,
        });
        return response.data.data;
    },

    // --- Countries (for dropdowns) ---
    getCountries: async (type?: 'export_destination'): Promise<ApiCountry[]> => {
        const response = await api.get('/api/countries', {
            params: type ? { type } : undefined,
        });
        return response.data.data;
    },

    // --- Create Client (for archive uploads when client not in DB) ---
    createClient: async (data: { name: string; type: 'importer' | 'exporter' | 'both' }): Promise<ApiClient> => {
        const response = await api.post('/api/clients', data);
        return response.data.data;
    },

    // --- Dedicated Archive Endpoints (strict: file_date must be past or today) ---
    getArchives: async (): Promise<import('../../documents/types/document.types').ArchiveYear[]> => {
        const response = await api.get('/api/archives');
        return response.data.data;
    },

    getMyArchives: async (): Promise<import('../../documents/types/document.types').ArchiveYear[]> => {
        const response = await api.get('/api/archives', { params: { mine: 1 } });
        return response.data.data;
    },

    createArchiveImport: async (data: {
        bl_no: string;
        selective_color: 'green' | 'yellow' | 'red';
        importer_id: number;
        file_date: string;          // YYYY-MM-DD, must be <= today (enforced by backend)
        customs_ref_no?: string;
        origin_country_id?: number;
        notes?: string;
    }): Promise<ApiImportTransaction> => {
        const response = await api.post('/api/archives/import', data);
        return response.data.data;
    },

    createArchiveExport: async (data: {
        bl_no: string;
        shipper_id: number;
        destination_country_id: number;
        file_date: string;          // YYYY-MM-DD, must be <= today (enforced by backend)
        vessel?: string;
        notes?: string;
    }): Promise<ApiExportTransaction> => {
        const response = await api.post('/api/archives/export', data);
        return response.data.data;
    },

    // --- Documents ---
    getDocuments: async (params: {
        documentable_type: DocumentableType;
        documentable_id: number;
    }): Promise<ApiDocument[]> => {
        const response = await api.get('/api/documents', { params });
        return response.data.data;
    },

    getDocumentTransactions: async (params?: {
        search?: string;
        type?: 'import' | 'export';
        page?: number;
        per_page?: number;
    }): Promise<DocumentTransactionListResponse> => {
        const response = await api.get('/api/documents/transactions', { params });
        return response.data;
    },

    uploadDocument: async (payload: UploadDocumentPayload): Promise<ApiDocument> => {
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('type', payload.type);
        formData.append('documentable_type', payload.documentable_type);
        formData.append('documentable_id', String(payload.documentable_id));

        const response = await api.post('/api/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    },

    downloadDocument: async (id: number, filename: string): Promise<void> => {
        const response = await api.get(`/api/documents/${id}/download`, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    deleteDocument: async (id: number): Promise<void> => {
        await api.delete(`/api/documents/${id}`);
    },

    getDocumentPreviewUrl: async (id: number): Promise<string> => {
        // Both S3 and Local disks now safely return a pre-signed JSON URL
        const { data } = await api.get<{ url: string }>(`/api/documents/${id}/preview`);
        return data.url;
    },
};
