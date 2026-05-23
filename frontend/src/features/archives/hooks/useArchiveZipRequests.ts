import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TransactionType } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { ArchiveZipExport, ArchiveZipExportListResponse, ArchiveZipExportStatus } from '../types/archiveHistory.types';
import { archiveKeys } from '../utils/archiveQueryKeys';
import { MONTH_NAMES } from '../utils/archive.utils';

export type ArchiveZipRequestStatus = ArchiveZipExportStatus;

export type ArchiveZipRequest = {
    id: string;
    scope: ArchiveZipExport['scope'];
    requestKey: string;
    folderName: string;
    filename: string;
    year: number;
    month: number | null;
    type: TransactionType | null;
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

type ArchiveFolderZipRequestInput = {
    scope?: 'folder';
    requestKey: string;
    folderName: string;
    year: number;
    month: number;
    type: TransactionType;
    fileCount: number;
    blCount: number;
    filename: string;
};

type ArchiveYearZipRequestInput = {
    scope: 'year';
    requestKey: string;
    folderName: string;
    year: number;
    fileCount: number;
    blCount: number;
    filename: string;
};

export type ArchiveZipRequestInput = ArchiveFolderZipRequestInput | ArchiveYearZipRequestInput;

type UseArchiveZipRequestsArgs = {
    mine: boolean;
};

const ZIP_REQUEST_PAGE_SIZE = 20;
const DOWNLOAD_START_GUARD_MS = 2000;

const isActiveZipStatus = (status: ArchiveZipRequestStatus) => (
    status === 'pending' || status === 'processing'
);

const buildFolderName = (year: number, month: number, type: TransactionType): string => (
    `${MONTH_NAMES[month - 1].slice(0, 3).toUpperCase()} ${year} ${type.toUpperCase()}S`
);

const toZipRequest = (archiveZipExport: ArchiveZipExport): ArchiveZipRequest | null => {
    if (archiveZipExport.scope === 'year') {
        return {
            id: archiveZipExport.id,
            scope: archiveZipExport.scope,
            requestKey: `year|${archiveZipExport.year}`,
            folderName: `FY ${archiveZipExport.year}`,
            filename: archiveZipExport.filename,
            year: archiveZipExport.year,
            month: null,
            type: null,
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
    }

    if (archiveZipExport.month === null || archiveZipExport.type === null) {
        return null;
    }

    return {
        id: archiveZipExport.id,
        scope: archiveZipExport.scope,
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

export const useArchiveZipRequests = ({ mine }: UseArchiveZipRequestsArgs) => {
    const queryClient = useQueryClient();
    const queryKey = archiveKeys.zipExports(mine);
    const activeDownloadRequestIdRef = useRef<string | null>(null);
    const downloadResetTimerRef = useRef<number | null>(null);
    const [downloadingRequestId, setDownloadingRequestId] = useState<string | null>(null);

    useEffect(() => () => {
        if (downloadResetTimerRef.current !== null) {
            window.clearTimeout(downloadResetTimerRef.current);
        }
    }, []);

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
        mutationFn: (input: ArchiveZipRequestInput) => {
            if (input.scope === 'year') {
                return trackingApi.createArchiveZipExport({
                    scope: 'year',
                    year: input.year,
                    mine,
                });
            }

            return trackingApi.createArchiveZipExport({
                scope: 'folder',
                year: input.year,
                month: input.month,
                type: input.type,
                mine,
            });
        },
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

    const markDownloadStarted = useCallback((requestId: string) => {
        activeDownloadRequestIdRef.current = requestId;
        setDownloadingRequestId(requestId);

        if (downloadResetTimerRef.current !== null) {
            window.clearTimeout(downloadResetTimerRef.current);
        }

        downloadResetTimerRef.current = window.setTimeout(() => {
            if (activeDownloadRequestIdRef.current === requestId) {
                activeDownloadRequestIdRef.current = null;
                setDownloadingRequestId(null);
            }

            downloadResetTimerRef.current = null;
        }, DOWNLOAD_START_GUARD_MS);
    }, []);

    const requestFolderZip = useCallback((input: ArchiveZipRequestInput) => {
        if (preparingRequestKeys.has(input.requestKey)) {
            return;
        }

        requestMutation.mutate(input);
    }, [preparingRequestKeys, requestMutation]);

    const downloadRequest = useCallback((requestId: string) => {
        if (activeDownloadRequestIdRef.current === requestId || downloadingRequestId === requestId) {
            return;
        }

        const request = requests.find((item) => item.id === requestId);

        if (!request || request.status !== 'ready' || !request.canDownload) {
            return;
        }

        markDownloadStarted(requestId);
        trackingApi.startArchiveZipExportDownload(request.id);
    }, [downloadingRequestId, markDownloadStarted, requests]);

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
        downloadingRequestId,
        isLoading: zipExportsQuery.isLoading,
        isRequesting: requestMutation.isPending,
    };
};
