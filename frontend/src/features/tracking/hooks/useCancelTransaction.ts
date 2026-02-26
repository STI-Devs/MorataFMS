import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

/**
 * Consolidated cancel hook for both import and export transactions.
 * Replaces the identical `useCancelImport` and `useCancelExport` pair.
 */
export const useCancelTransaction = (type: 'import' | 'export') => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            type === 'import'
                ? trackingApi.cancelImport(id, reason)
                : trackingApi.cancelExport(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [type === 'import' ? 'imports' : 'exports'] });
            queryClient.invalidateQueries({ queryKey: [type === 'import' ? 'import-stats' : 'export-stats'] });
        },
    });
};
