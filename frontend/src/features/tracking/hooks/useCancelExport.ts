import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import { trackingKeys } from '../utils/queryKeys';

export const useCancelExport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            trackingApi.cancelExport(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackingKeys.exports.all });
            queryClient.invalidateQueries({ queryKey: trackingKeys.exports.stats });
        },
    });
};
