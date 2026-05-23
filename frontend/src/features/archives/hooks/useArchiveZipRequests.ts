import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TransactionType } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { ArchiveZipExport, ArchiveZipExportListResponse, ArchiveZipExportStatus } from '../types/archiveHistory.types';
import { archiveKeys } from '../utils/archiveQueryKeys';
import { MONTH_NAMES } from '../utils/archive.utils';

export type ArchiveZipRequestStatus = ArchiveZipExportStatus;

export type ArchiveZipRequest = {
    id: string;
    requestKey: string;
    folderName: string;
    filename: string;
    year: number;
    month: number;
    type: TransactionType;
    fileCount: number;
    blCount: number;
    fileSizeBytes: number;
    status: ArchiveZipRequestStatus;
    requestedAt: string | null;
    completedAt: string | null;
    expiresAt: string | null;
    canDownload: boolean;
    errorMessage: string | null;
};

export type ArchiveZipRequestInput = {
    requestKey: string;
    folderName: string;
    year: number;
    month: number;
    type: TransactionType;
    fileCount: number;
    blCount: number;
    filename: string;
};

type UseArchiveZipRequestsArgs = {
    mine: boolean;
};

const ZIP_REQUEST_PAGE_SIZE = 20;

const isActiveZipStatus = (status: ArchiveZipRequestStatus) => (
    status === 'pending' || status === 'processing'
);

const buildFolderName = (year: number, month: number, type: TransactionType): string => (
    `${MONTH_NAMES[month - 1].slice(0, 3).toUpperCase()} ${year} ${type.toUpperCase()}S`
);

const toZipRequest = (archiveZipExport: ArchiveZipExport): ArchiveZipRequest | null => {
    if (archiveZipExport.month === null || archiveZipExport.type === null) {
        return null;
    }

    return {
        id: archiveZipExport.id,
        requestKey: `${archiveZipExport.month}|${archiveZipExport.type}`,
        folderName: buildFolderName(archiveZipExport.year, archiveZipExport.month, archiveZipExport.type),
        filename: archiveZipExport.filename,
        year: archiveZipExport.year,
        month: archiveZipExport.month,
        type: archiveZipExport.type,
        fileCount: archiveZipExport.file_count,
        blCount: archiveZipExport.bl_count,
        fileSizeBytes: archiveZipExport.file_size_bytes,
        status: archiveZipExport.status,
        requestedAt: archiveZipExport.requested_at,
        completedAt: archiveZipExport.completed_at,
        expiresAt: archiveZipExport.expires_at,
        canDownload: archiveZipExport.can_download,
        errorMessage: archiveZipExport.error_message,
    };
};

const downloadBlob = (blob: Blob, filename: string) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
};

export const useArchiveZipRequests = ({ mine }: UseArchiveZipRequestsArgs) => {
    const queryClient = useQueryClient();
    const queryKey = archiveKeys.zipExports(mine);

    const zipExportsQuery = useQuery({
        queryKey,
        queryFn: () => trackingApi.getArchiveZipExports({ mine, per_page: ZIP_REQUEST_PAGE_SIZE }),
        refetchInterval: (query) => {
            const data = query.state.data as ArchiveZipExportListResponse | undefined;

            return data?.data.some((archiveZipExport) => isActiveZipStatus(archiveZipExport.status))
                ? 3000
                : false;
        },
    });

    const requests = useMemo(() => (
        zipExportsQuery.data?.data
            .map(toZipRequest)
            .filter((request): request is ArchiveZipRequest => request !== null) ?? []
    ), [zipExportsQuery.data]);

    const preparingRequestKeys = useMemo(() => new Set(
        requests
            .filter((request) => isActiveZipStatus(request.status))
            .map((request) => request.requestKey),
    ), [requests]);

    const invalidateZipRequests = useCallback(() => (
        queryClient.invalidateQueries({ queryKey })
    ), [queryClient, queryKey]);

    const requestMutation = useMutation({
        mutationFn: (input: ArchiveZipRequestInput) => trackingApi.createArchiveZipExport({
            scope: 'folder',
            year: input.year,
            month: input.month,
            type: input.type,
            mine,
        }),
        onSuccess: invalidateZipRequests,
    });

    const retryMutation = useMutation({
        mutationFn: (requestId: string) => trackingApi.retryArchiveZipExport(requestId),
        onSuccess: invalidateZipRequests,
    });

    const deleteMutation = useMutation({
        mutationFn: (requestId: string) => trackingApi.deleteArchiveZipExport(requestId),
        onSuccess: invalidateZipRequests,
    });

    const clearFinishedMutation = useMutation({
        mutationFn: async (requestIds: string[]) => {
            await Promise.all(requestIds.map((requestId) => trackingApi.deleteArchiveZipExport(requestId)));
        },
        onSuccess: invalidateZipRequests,
    });

    const downloadMutation = useMutation({
        mutationFn: (request: ArchiveZipRequest) => trackingApi.downloadArchiveZipExport(request.id)
            .then((blob) => ({ blob, filename: request.filename })),
        onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
    });

    const requestFolderZip = useCallback((input: ArchiveZipRequestInput) => {
        if (preparingRequestKeys.has(input.requestKey)) {
            return;
        }

        requestMutation.mutate(input);
    }, [preparingRequestKeys, requestMutation]);

    const downloadRequest = useCallback((requestId: string) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || request.status !== 'ready' || !request.canDownload) {
            return;
        }

        downloadMutation.mutate(request);
    }, [downloadMutation, requests]);

    const dismissRequest = useCallback((requestId: string) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || isActiveZipStatus(request.status)) {
            return;
        }

        deleteMutation.mutate(requestId);
    }, [deleteMutation, requests]);

    const retryRequest = useCallback((requestId: string) => {
        const request = requests.find((item) => item.id === requestId);

        if (!request || isActiveZipStatus(request.status)) {
            return;
        }

        retryMutation.mutate(requestId);
    }, [requests, retryMutation]);

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
        preparingRequestKeys,
        requestFolderZip,
        downloadRequest,
        dismissRequest,
        retryRequest,
        clearFinishedRequests,
        isLoading: zipExportsQuery.isLoading,
        isRequesting: requestMutation.isPending,
    };
};
