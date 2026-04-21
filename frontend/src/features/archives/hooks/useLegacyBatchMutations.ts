import { useMutation, useQueryClient } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import type { CreateLegacyBatchPayload } from '../types/legacyBatch.types';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

export const useLegacyBatchMutations = () => {
    const queryClient = useQueryClient();

    const invalidateBatch = async (batchId: string) => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: legacyBatchQueryKeys.all }),
            queryClient.invalidateQueries({ queryKey: legacyBatchQueryKeys.detail(batchId) }),
        ]);
    };

    const createBatch = useMutation({
        mutationFn: (payload: CreateLegacyBatchPayload) => legacyBatchApi.createLegacyBatch(payload),
        onSuccess: async (batch) => {
            queryClient.setQueryData(legacyBatchQueryKeys.detail(batch.id), batch);
            await queryClient.invalidateQueries({ queryKey: legacyBatchQueryKeys.all });
        },
    });

    const signUploads = useMutation({
        mutationFn: ({ batchId, relativePaths }: { batchId: string; relativePaths: string[] }) =>
            legacyBatchApi.signLegacyBatchUploads(batchId, relativePaths),
    });

    const completeUploads = useMutation({
        mutationFn: ({ batchId, relativePaths }: { batchId: string; relativePaths: string[] }) =>
            legacyBatchApi.completeLegacyBatchUploads(batchId, relativePaths),
        onSuccess: async (_, variables) => {
            await invalidateBatch(variables.batchId);
        },
    });

    const finalizeBatch = useMutation({
        mutationFn: (batchId: string) => legacyBatchApi.finalizeLegacyBatch(batchId),
        onSuccess: async (batch) => {
            queryClient.setQueryData(legacyBatchQueryKeys.detail(batch.id), batch);
            await invalidateBatch(batch.id);
        },
    });

    const deleteBatch = useMutation({
        mutationFn: (batchId: string) => legacyBatchApi.deleteLegacyBatch(batchId),
        onSuccess: async (_, batchId) => {
            queryClient.removeQueries({ queryKey: legacyBatchQueryKeys.detail(batchId) });
            await queryClient.invalidateQueries({ queryKey: legacyBatchQueryKeys.all });
        },
    });

    return {
        createBatch,
        signUploads,
        completeUploads,
        finalizeBatch,
        deleteBatch,
    };
};
