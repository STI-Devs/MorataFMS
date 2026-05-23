import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import type {
    LegacyBatchModule,
    LegacyBatchZipExport,
    LegacyBatchZipExportListResponse,
    LegacyBatchZipExportStatus,
} from '../types/legacyBatch.types';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

export type LegacyBatchZipRequestStatus = LegacyBatchZipExportStatus;

export type LegacyBatchZipRequest = {
    id: string;
    batchId: string;
    batchName: string;
    rootFolder: string;
    moduleLabel: string;
    filename: string;
    fileCount: number;
    fileSizeBytes: number;
    status: LegacyBatchZipRequestStatus;
    requestedAt: string | null;
    completedAt: string | null;
    expiresAt: string | null;
    canDownload: boolean;
    errorMessage: string | null;
    requestedBy: string | null;
};

type UseLegacyBatchZipRequestsArgs = {
    module?: LegacyBatchModule;
};

const ZIP_REQUEST_PAGE_SIZE = 20;

const isActiveZipStatus = (status: LegacyBatchZipRequestStatus) => (
    status === 'pending' || status === 'processing'
);

const toZipRequest = (zipExport: LegacyBatchZipExport): LegacyBatchZipRequest | null => {
    if (!zipExport.legacyBatch) {
        return null;
    }

    return {
        id: zipExport.id,
        batchId: zipExport.legacyBatch.id,
        batchName: zipExport.legacyBatch.batchName,
        rootFolder: zipExport.legacyBatch.rootFolder,
        moduleLabel: zipExport.legacyBatch.moduleLabel,
        filename: zipExport.filename,
        fileCount: zipExport.fileCount,
        fileSizeBytes: zipExport.fileSizeBytes,
        status: zipExport.status,
        requestedAt: zipExport.requestedAt,
        completedAt: zipExport.completedAt,
        expiresAt: zipExport.expiresAt,
        canDownload: zipExport.canDownload,
        errorMessage: zipExport.errorMessage,
        requestedBy: zipExport.requestedBy?.name ?? null,
    };
};

export const useLegacyBatchZipRequests = ({ module }: UseLegacyBatchZipRequestsArgs = {}) => {
    const queryClient = useQueryClient();
    const queryKey = legacyBatchQueryKeys.zipExports(module);

    const zipExportsQuery = useQuery({
        queryKey,
        queryFn: () => legacyBatchApi.getLegacyBatchZipExports({
            module,
            per_page: ZIP_REQUEST_PAGE_SIZE,
        }),
        refetchInterval: (query) => {
            const data = query.state.data as LegacyBatchZipExportListResponse | undefined;

            return data?.data.some((zipExport) => isActiveZipStatus(zipExport.status))
                ? 3000
                : false;
        },
    });

    const requests = useMemo(() => (
        zipExportsQuery.data?.data
            .map(toZipRequest)
            .filter((request): request is LegacyBatchZipRequest => request !== null) ?? []
    ), [zipExportsQuery.data]);

    const invalidateZipRequests = useCallback(async (batchId?: string | null) => {
        const invalidations = [
            queryClient.invalidateQueries({ queryKey }),
            queryClient.invalidateQueries({ queryKey: legacyBatchQueryKeys.all }),
        ];

        if (batchId) {
            invalidations.push(queryClient.invalidateQueries({ queryKey: legacyBatchQueryKeys.detail(batchId) }));
        }

        await Promise.all(invalidations);
    }, [queryClient, queryKey]);

    const requestMutation = useMutation({
        mutationFn: (batchId: string) => legacyBatchApi.requestLegacyBatchZipExport(batchId),
        onSuccess: (zipExport, batchId) => invalidateZipRequests(zipExport.legacyBatchId ?? batchId),
    });

    const retryMutation = useMutation({
        mutationFn: ({ exportId }: { batchId: string; exportId: string }) =>
            legacyBatchApi.retryLegacyBatchZipExport(exportId),
        onSuccess: (zipExport, variables) => invalidateZipRequests(zipExport.legacyBatchId ?? variables.batchId),
    });

    const deleteMutation = useMutation({
        mutationFn: (requestId: string) => legacyBatchApi.deleteLegacyBatchZipExport(requestId),
        onSuccess: () => invalidateZipRequests(),
    });

    const clearFinishedMutation = useMutation({
        mutationFn: async (requestIds: string[]) => {
            await Promise.all(requestIds.map((requestId) => legacyBatchApi.deleteLegacyBatchZipExport(requestId)));
        },
        onSuccess: () => invalidateZipRequests(),
    });

    const downloadMutation = useMutation({
        mutationFn: (request: LegacyBatchZipRequest) => legacyBatchApi.downloadLegacyBatchZipExport(
            request.id,
            request.filename,
        ),
    });

    const requestBatchZip = useCallback((batchId: string) => {
        requestMutation.mutate(batchId);
    }, [requestMutation]);

    const retryRequest = useCallback((requestId: string) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || isActiveZipStatus(request.status)) {
            return;
        }

        retryMutation.mutate({ batchId: request.batchId, exportId: requestId });
    }, [requests, retryMutation]);

    const retryBatchZip = useCallback((batchId: string, exportId: string) => {
        retryMutation.mutate({ batchId, exportId });
    }, [retryMutation]);

    const downloadRequest = useCallback((requestId: string) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || request.status !== 'ready' || !request.canDownload) {
            return;
        }

        downloadMutation.mutate(request);
    }, [downloadMutation, requests]);

    const downloadBatchZip = useCallback((exportId: string, filename: string) => {
        downloadMutation.mutate({
            id: exportId,
            batchId: '',
            batchName: '',
            rootFolder: '',
            moduleLabel: '',
            filename,
            fileCount: 0,
            fileSizeBytes: 0,
            status: 'ready',
            requestedAt: null,
            completedAt: null,
            expiresAt: null,
            canDownload: true,
            errorMessage: null,
            requestedBy: null,
        });
    }, [downloadMutation]);

    const dismissRequest = useCallback((requestId: string) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || isActiveZipStatus(request.status)) {
            return;
        }

        deleteMutation.mutate(requestId);
    }, [deleteMutation, requests]);

    const clearFinishedRequests = useCallback(() => {
        const finishedRequestIds = requests
            .filter((request) => !isActiveZipStatus(request.status))
            .map((request) => request.id);

        if (finishedRequestIds.length === 0) {
            return;
        }

        clearFinishedMutation.mutate(finishedRequestIds);
    }, [clearFinishedMutation, requests]);

    return {
        requests,
        requestBatchZip,
        retryBatchZip,
        downloadBatchZip,
        downloadRequest,
        retryRequest,
        dismissRequest,
        clearFinishedRequests,
        isLoading: zipExportsQuery.isLoading,
        isRequesting: requestMutation.isPending,
        isRetrying: retryMutation.isPending,
        isDownloading: downloadMutation.isPending,
        requestingBatchId: requestMutation.isPending ? requestMutation.variables ?? null : null,
        retryingBatchId: retryMutation.isPending ? retryMutation.variables?.batchId ?? null : null,
    };
};
