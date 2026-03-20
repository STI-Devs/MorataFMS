import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { CreateExportPayload, CreateImportPayload } from '../types';
import { trackingKeys } from '../utils/queryKeys';

/**
 * Unified hook that wraps createImport / createExport into a single mutation
 * typed as `CreateImportPayload | CreateExportPayload` so callers don't need
 * to satisfy the intersection type that TypeScript infers from the conditional.
 */
export function useCreateTransaction(type: 'import' | 'export') {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateImportPayload | CreateExportPayload) => {
            if (type === 'import') {
                return trackingApi.createImport(data as CreateImportPayload);
            }
            return trackingApi.createExport(data as CreateExportPayload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: type === 'import' ? trackingKeys.imports.all : trackingKeys.exports.all,
            });
        },
    });
}
