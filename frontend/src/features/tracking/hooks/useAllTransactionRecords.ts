import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiExportTransaction, ApiImportTransaction } from '../types';

type ImportParams = {
    search?: string;
    status?: string;
    selective_color?: string;
    exclude_statuses?: string;
};

type ExportParams = {
    search?: string;
    status?: string;
    exclude_statuses?: string;
};

export const useAllImportsData = (params?: ImportParams) =>
    useQuery<ApiImportTransaction[]>({
        queryKey: ['imports', 'all-records', params],
        queryFn: () => trackingApi.getAllImports(params),
    });

export const useAllExportsData = (params?: ExportParams) =>
    useQuery<ApiExportTransaction[]>({
        queryKey: ['exports', 'all-records', params],
        queryFn: () => trackingApi.getAllExports(params),
    });
