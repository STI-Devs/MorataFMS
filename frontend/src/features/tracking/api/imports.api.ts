import api from '../../../lib/axios';
import type {
    ApiImportTransaction,
    CreateImportPayload,
    OperationalScope,
    PaginatedResponse,
    TransactionStats,
} from '../types';
import { MAX_PAGE_SIZE, fetchAllPages } from './internal/pagination';

export type ImportListParams = {
    search?: string;
    status?: string;
    selective_color?: string;
    operational_scope?: OperationalScope;
    exclude_statuses?: string;
    page?: number;
    per_page?: number;
};

const getImports = async (params?: ImportListParams): Promise<PaginatedResponse<ApiImportTransaction>> => {
    const response = await api.get('/api/import-transactions', { params });
    return response.data;
};

export const importsApi = {
    getImports,

    getAllImports: async (params?: Omit<ImportListParams, 'page' | 'per_page'>): Promise<ApiImportTransaction[]> =>
        fetchAllPages((page) =>
            getImports({
                ...params,
                page,
                per_page: MAX_PAGE_SIZE,
            }),
        ),

    createImport: async (data: CreateImportPayload): Promise<ApiImportTransaction> => {
        const response = await api.post('/api/import-transactions', data);
        return response.data.data;
    },

    updateImport: async ({ id, data }: { id: number; data: CreateImportPayload }): Promise<ApiImportTransaction> => {
        const response = await api.put(`/api/import-transactions/${id}`, data);
        return response.data.data;
    },

    updateImportStageApplicability: async (
        id: number,
        payload: { stage: string; not_applicable: boolean },
    ): Promise<ApiImportTransaction> => {
        const response = await api.patch(`/api/import-transactions/${id}/stage-applicability`, payload);
        return response.data.data;
    },

    getImportStats: async (signal?: AbortSignal): Promise<TransactionStats> => {
        const response = await api.get('/api/import-transactions/stats', { signal });
        return response.data.data;
    },

    deleteImport: async (id: number): Promise<void> => {
        await api.delete(`/api/import-transactions/${id}`);
    },

    cancelImport: async (id: number, reason: string): Promise<void> => {
        await api.patch(`/api/import-transactions/${id}/cancel`, { reason });
    },
};
