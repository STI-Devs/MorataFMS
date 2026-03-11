import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { CreateExportPayload, CreateImportPayload } from '../types';

export const useUpdateTransaction = (type: 'import' | 'export') => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: CreateImportPayload | CreateExportPayload }) => {
            if (type === 'import') {
                return trackingApi.updateImport({ id, data: data as CreateImportPayload });
            }
            return trackingApi.updateExport({ id, data: data as CreateExportPayload });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${type}s`] });
            queryClient.invalidateQueries({ queryKey: [`${type}-stats`] });
        },
    });
};
