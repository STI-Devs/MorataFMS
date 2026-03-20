import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { CreateImportPayload } from '../types';
import { trackingKeys } from '../utils/queryKeys';

export const useCreateImport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateImportPayload) => trackingApi.createImport(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackingKeys.imports.all });
        },
    });
};
