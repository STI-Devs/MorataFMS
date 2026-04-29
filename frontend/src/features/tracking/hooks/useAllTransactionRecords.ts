import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiExportTransaction, ApiImportTransaction } from '../types';
import { trackingKeys } from '../utils/queryKeys';

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
        queryKey: trackingKeys.imports.allRecords(params),
        queryFn: () => trackingApi.getAllImports(params),
    });

export const useAllExportsData = (params?: ExportParams) =>
    useQuery<ApiExportTransaction[]>({
        queryKey: trackingKeys.exports.allRecords(params),
        queryFn: () => trackingApi.getAllExports(params),
    });
