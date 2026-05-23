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

    const appendManifest = useMutation({
        mutationFn: ({ batchId, files }: { batchId: string; files: CreateLegacyBatchPayload['files'] }) =>
            legacyBatchApi.appendLegacyBatchManifest(batchId, files),
        onSuccess: async (_, variables) => {
            await invalidateBatch(variables.batchId);
        },
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

    const requestZipExport = useMutation({
        mutationFn: (batchId: string) => legacyBatchApi.requestLegacyBatchZipExport(batchId),
        onSuccess: async (zipExport, batchId) => {
            if (zipExport.legacyBatchId) {
                await invalidateBatch(zipExport.legacyBatchId);
                return;
            }

            await invalidateBatch(batchId);
        },
    });

    const retryZipExport = useMutation({
        mutationFn: ({ exportId }: { exportId: string; batchId: string }) =>
            legacyBatchApi.retryLegacyBatchZipExport(exportId),
        onSuccess: async (zipExport, variables) => {
            if (zipExport.legacyBatchId) {
                await invalidateBatch(zipExport.legacyBatchId);
                return;
            }

            await invalidateBatch(variables.batchId);
        },
    });

    const downloadZipExport = useMutation({
        mutationFn: async ({ exportId, filename }: { exportId: string; filename: string }) => {
            legacyBatchApi.downloadLegacyBatchZipExport(exportId, filename);
        },
    });

    return {
        createBatch,
        appendManifest,
        signUploads,
        completeUploads,
        finalizeBatch,
        deleteBatch,
        requestZipExport,
        retryZipExport,
        downloadZipExport,
    };
};
