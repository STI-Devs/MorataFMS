import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { UploadDocumentPayload } from '../../tracking/types';
import { trackingKeys } from '../../tracking/utils/queryKeys';

export const useUploadDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UploadDocumentPayload) =>
            trackingApi.uploadDocument(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: trackingKeys.documents.list(
                    variables.documentable_type,
                    variables.documentable_id,
                ),
            });
        },
    });
};
