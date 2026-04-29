import api from '../../../lib/axios';
import type {
    ApiExportTransaction,
    CreateExportPayload,
    OperationalScope,
    PaginatedResponse,
    TransactionStats,
} from '../types';
import { MAX_PAGE_SIZE, fetchAllPages } from './internal/pagination';

export type ExportListParams = {
    search?: string;
    status?: string;
    operational_scope?: OperationalScope;
    exclude_statuses?: string;
    page?: number;
    per_page?: number;
};

const getExports = async (params?: ExportListParams): Promise<PaginatedResponse<ApiExportTransaction>> => {
    const response = await api.get('/api/export-transactions', { params });
    return response.data;
};

export const exportsApi = {
    getExports,

    getAllExports: async (params?: Omit<ExportListParams, 'page' | 'per_page'>): Promise<ApiExportTransaction[]> =>
        fetchAllPages((page) =>
            getExports({
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

    updateExportStageApplicability: async (
        id: number,
        payload: { stage: string; not_applicable: boolean },
    ): Promise<ApiExportTransaction> => {
        const response = await api.patch(`/api/export-transactions/${id}/stage-applicability`, payload);
        return response.data.data;
    },

    getExportStats: async (signal?: AbortSignal): Promise<TransactionStats> => {
        const response = await api.get('/api/export-transactions/stats', { signal });
        return response.data.data;
    },

    deleteExport: async (id: number): Promise<void> => {
        await api.delete(`/api/export-transactions/${id}`);
    },

    cancelExport: async (id: number, reason: string): Promise<void> => {
        await api.patch(`/api/export-transactions/${id}/cancel`, { reason });
    },
};
