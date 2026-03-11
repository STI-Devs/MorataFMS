import api from '../../../lib/axios';
import type { CreateRemarkData, Remark, RemarkDocument } from '../types/remark.types';

export const remarkApi = {
    /** Get all remarks for a transaction. */
    async getRemarks(type: 'import' | 'export', id: number): Promise<{ data: Remark[] }> {
        const response = await api.get(`/api/transactions/${type}/${id}/remarks`);
        return response.data;
    },

    /** Create a new remark (admin only). */
    async createRemark(type: 'import' | 'export', id: number, data: CreateRemarkData): Promise<Remark> {
        const response = await api.post(`/api/transactions/${type}/${id}/remarks`, data);
        return response.data;
    },

    /** Mark a remark as resolved. */
    async resolveRemark(remarkId: number): Promise<{ message: string; data: Remark }> {
        const response = await api.patch(`/api/remarks/${remarkId}/resolve`);
        return response.data;
    },

    /** Get documents for a transaction (for "Pin to Document" dropdown). */
    async getDocuments(type: 'import' | 'export', id: number): Promise<{ data: RemarkDocument[] }> {
        const docType = type === 'import'
            ? 'App\\Models\\ImportTransaction'
            : 'App\\Models\\ExportTransaction';
        const response = await api.get('/api/documents', {
            params: { documentable_type: docType, documentable_id: id },
        });
        return response.data;
    },
};
