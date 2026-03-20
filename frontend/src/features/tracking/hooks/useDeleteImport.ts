import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import { trackingKeys } from '../utils/queryKeys';

export const useDeleteImport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => trackingApi.deleteImport(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackingKeys.imports.all });
            queryClient.invalidateQueries({ queryKey: trackingKeys.imports.stats });
        },
    });
};
