import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminReviewApi } from '../api/adminReviewApi';
import type {
    AdminReviewArchiveResponse,
    AdminReviewDetailResponse,
    AdminReviewQueueParams,
    AdminReviewQueueResponse,
    AdminReviewStats,
    TransactionType,
} from '../types/document.types';

export const adminReviewKeys = {
    all: ['admin-document-review'] as const,
    queue: (params?: AdminReviewQueueParams) =>
        ['admin-document-review', 'queue', params] as const,
    detail: (type: TransactionType | null, id: number | null) =>
        ['admin-document-review', 'detail', type, id] as const,
    stats: () => ['admin-document-review', 'stats'] as const,
};

export const useReviewQueue = (params?: AdminReviewQueueParams) =>
    useQuery<AdminReviewQueueResponse>({
        queryKey: adminReviewKeys.queue(params),
        queryFn: () => adminReviewApi.fetchReviewQueue(params),
        placeholderData: keepPreviousData,
    });

export const useReviewDetail = (type: TransactionType | null, id: number | null) =>
    useQuery<AdminReviewDetailResponse>({
        queryKey: adminReviewKeys.detail(type, id),
        queryFn: () => adminReviewApi.fetchReviewDetail(type!, id!),
        enabled: type !== null && id !== null,
    });

export const useReviewStats = () =>
    useQuery<AdminReviewStats>({
        queryKey: adminReviewKeys.stats(),
        queryFn: () => adminReviewApi.fetchReviewStats(),
    });

export const useArchiveReviewedTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation<
        AdminReviewArchiveResponse,
        Error,
        { type: TransactionType; id: number }
    >({
        mutationFn: ({ type, id }) => adminReviewApi.archiveReviewedTransaction(type, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminReviewKeys.all });
            queryClient.invalidateQueries({ queryKey: ['archives'] });
            queryClient.invalidateQueries({ queryKey: ['my-archives'] });
        },
    });
};
