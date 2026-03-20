import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../../tracking/api/trackingApi';
import { trackingKeys } from '../../tracking/utils/queryKeys';

export const useDeleteDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => trackingApi.deleteDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackingKeys.documents.all });
        },
    });
};
