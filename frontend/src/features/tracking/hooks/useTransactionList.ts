import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiExportTransaction, ApiImportTransaction, PaginatedResponse } from '../types';

interface UseTransactionListParams {
    search?: string;
    status?: string;
    selective_color?: string; // only for imports
    page?: number;
    per_page?: number;
}

export function useTransactionList(type: 'import', params?: UseTransactionListParams): UseQueryResult<PaginatedResponse<ApiImportTransaction>>;
export function useTransactionList(type: 'export', params?: UseTransactionListParams): UseQueryResult<PaginatedResponse<ApiExportTransaction>>;
export function useTransactionList(type: 'import' | 'export', params?: UseTransactionListParams): UseQueryResult<PaginatedResponse<any>> {
    return useQuery({
        queryKey: [type === 'import' ? 'imports' : 'exports', params],
        queryFn: () => type === 'import'
            ? trackingApi.getImports(params)
            : trackingApi.getExports(params),
        placeholderData: keepPreviousData,
    });
}
