import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { CreateExportPayload } from '../types';

export const useCreateExport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateExportPayload) => trackingApi.createExport(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
        },
    });
};
