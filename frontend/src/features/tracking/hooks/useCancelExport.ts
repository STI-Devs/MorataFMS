import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

export const useCancelExport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            trackingApi.cancelExport(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
            queryClient.invalidateQueries({ queryKey: ['export-stats'] });
        },
    });
};
