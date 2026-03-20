import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import { trackingKeys } from '../utils/queryKeys';

export const useDeleteExport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => trackingApi.deleteExport(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackingKeys.exports.all });
            queryClient.invalidateQueries({ queryKey: trackingKeys.exports.stats });
        },
    });
};
