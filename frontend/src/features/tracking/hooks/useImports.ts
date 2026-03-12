import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiImportTransaction, PaginatedResponse } from '../types';

interface UseImportsParams {
    search?: string;
    status?: string;
    selective_color?: string;
    exclude_statuses?: string;
    page?: number;
    per_page?: number;
}

export const useImports = (params?: UseImportsParams) => {
    return useQuery<PaginatedResponse<ApiImportTransaction>>({
        queryKey: ['imports', params],
        queryFn: () => trackingApi.getImports(params),
        placeholderData: keepPreviousData,
    });
};
