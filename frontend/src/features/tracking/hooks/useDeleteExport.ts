import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

export const useDeleteExport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => trackingApi.deleteExport(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
            queryClient.invalidateQueries({ queryKey: ['export-stats'] });
        },
    });
};
