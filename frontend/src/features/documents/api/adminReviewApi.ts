import api from '../../../lib/axios';
import type {
    AdminReviewArchiveResponse,
    AdminReviewDetailResponse,
    AdminReviewQueueParams,
    AdminReviewQueueResponse,
    AdminReviewStats,
    TransactionType,
} from '../types/document.types';

export const adminReviewApi = {
    async fetchReviewQueue(params?: AdminReviewQueueParams): Promise<AdminReviewQueueResponse> {
        const response = await api.get('/api/admin/document-review', {
            params: {
                ...params,
                type: params?.type === 'all' ? undefined : params?.type,
                status: params?.status === 'all' ? undefined : params?.status,
            },
        });

        return response.data;
    },

    async fetchReviewDetail(type: TransactionType, id: number): Promise<AdminReviewDetailResponse> {
        const response = await api.get(`/api/admin/document-review/${type}/${id}`);
        return response.data;
    },

    async fetchReviewStats(): Promise<AdminReviewStats> {
        const response = await api.get('/api/admin/document-review/stats');
        return response.data;
    },

    async archiveReviewedTransaction(type: TransactionType, id: number): Promise<AdminReviewArchiveResponse> {
        const response = await api.post(`/api/admin/document-review/${type}/${id}/archive`);
        return response.data;
    },
};
