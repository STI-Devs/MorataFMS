import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiExportTransaction, PaginatedResponse } from '../types';
import { trackingKeys } from '../utils/queryKeys';

interface UseExportsParams {
    search?: string;
    status?: string;
    exclude_statuses?: string;
    page?: number;
    per_page?: number;
}

export const useExports = (params?: UseExportsParams) => {
    return useQuery<PaginatedResponse<ApiExportTransaction>>({
        queryKey: trackingKeys.exports.list(params),
        queryFn: () => trackingApi.getExports(params),
        placeholderData: keepPreviousData,
    });
};
