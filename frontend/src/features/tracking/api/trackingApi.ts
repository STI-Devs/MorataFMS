import api from '../../../lib/axios';
import type {
    ApiClient,
    ApiCountry,
    ApiExportTransaction,
    ApiImportTransaction,
    CreateExportPayload,
    CreateImportPayload,
    PaginatedResponse,
    TransactionStats
} from '../types';

export const trackingApi = {
    // --- Import Transactions ---
    getImports: async (params?: {
        search?: string;
        status?: string;
        selective_color?: string;
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

    // --- Export Transactions ---
    getExports: async (params?: {
        search?: string;
        status?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<ApiExportTransaction>> => {
        const response = await api.get('/api/export-transactions', { params });
        return response.data;
    },

    createExport: async (data: CreateExportPayload): Promise<ApiExportTransaction> => {
        const response = await api.post('/api/export-transactions', data);
        return response.data.data;
    },

    // --- Stats (total counts across all records) ---
    getImportStats: async (): Promise<TransactionStats> => {
        const response = await api.get('/api/import-transactions/stats');
        return response.data.data;
    },

    getExportStats: async (): Promise<TransactionStats> => {
        const response = await api.get('/api/export-transactions/stats');
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

    // --- Documents ---
    getDocuments: async (params: {
        documentable_type: DocumentableType;
        documentable_id: number;
    }): Promise<ApiDocument[]> => {
        const response = await api.get('/api/documents', { params });
        return response.data.data;
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
};

