import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

export const useDeleteImport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => trackingApi.deleteImport(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imports'] });
            queryClient.invalidateQueries({ queryKey: ['import-stats'] });
        },
    });
};
