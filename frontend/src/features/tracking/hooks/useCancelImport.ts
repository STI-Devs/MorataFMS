import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import { trackingKeys } from '../utils/queryKeys';

export const useCancelImport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            trackingApi.cancelImport(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackingKeys.imports.all });
            queryClient.invalidateQueries({ queryKey: trackingKeys.imports.stats });
        },
    });
};
