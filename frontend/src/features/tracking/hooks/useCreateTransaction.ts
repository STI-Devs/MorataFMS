import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { CreateExportPayload, CreateImportPayload } from '../types';

export const useCreateTransaction = (type: 'import' | 'export') => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            if (type === 'import') {
                return await trackingApi.createImport(data as CreateImportPayload);
            } else {
                return await trackingApi.createExport(data as CreateExportPayload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [type === 'import' ? 'imports' : 'exports'] });
            queryClient.invalidateQueries({ queryKey: [`${type}-stats`] });
        },
    });
};
