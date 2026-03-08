import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

export const useCancelImport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            trackingApi.cancelImport(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imports'] });
            queryClient.invalidateQueries({ queryKey: ['import-stats'] });
        },
    });
};
