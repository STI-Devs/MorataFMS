import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { UploadDocumentPayload } from '../types';

export const useUploadDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UploadDocumentPayload) =>
            trackingApi.uploadDocument(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [
                    'documents',
                    variables.documentable_type,
                    variables.documentable_id,
                ],
            });
        },
    });
};
