import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';

export const useDeleteDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => trackingApi.deleteDocument(id),
        onSuccess: () => {
            // Invalidate all document queries since we don't know which transaction it belonged to
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
};
