import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

/**
 * Consolidated delete hook for both import and export transactions.
 * Replaces the identical `useDeleteImport` and `useDeleteExport` pair.
 */
export const useDeleteTransaction = (type: 'import' | 'export') => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            type === 'import'
                ? trackingApi.deleteImport(id)
                : trackingApi.deleteExport(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [type === 'import' ? 'imports' : 'exports'] });
            queryClient.invalidateQueries({ queryKey: [type === 'import' ? 'import-stats' : 'export-stats'] });
        },
    });
};
