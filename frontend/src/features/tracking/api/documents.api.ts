import api from '../../../lib/axios';
import {
    MAX_UPLOAD_FILE_SIZE_BYTES,
    getMaxFileSizeErrorMessage,
} from '../../../lib/uploads';
import type {
    ApiDocument,
    DocumentTransactionListResponse,
    DocumentableType,
    UploadDocumentPayload,
} from '../types';

export const documentsApi = {
    getDocuments: async (params: {
        documentable_type: DocumentableType;
        documentable_id: number;
    }): Promise<ApiDocument[]> => {
        const response = await api.get('/api/documents', { params });
        return response.data.data;
    },

    getDocumentTransactions: async (params?: {
        search?: string;
        type?: 'import' | 'export';
        page?: number;
        per_page?: number;
    }): Promise<DocumentTransactionListResponse> => {
        const response = await api.get('/api/documents/transactions', { params });
        return response.data;
    },

    uploadDocument: async (payload: UploadDocumentPayload): Promise<ApiDocument> => {
        if (payload.file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
            throw new Error(getMaxFileSizeErrorMessage());
        }

        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('type', payload.type);
        formData.append('documentable_type', payload.documentable_type);
        formData.append('documentable_id', String(payload.documentable_id));

        const response = await api.post('/api/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    },

    downloadDocument: async (id: number, filename: string): Promise<void> => {
        const response = await api.get(`/api/documents/${id}/download`, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    previewDocument: async (id: number): Promise<Blob> => {
        const response = await api.get(`/api/documents/${id}/preview`, {
            responseType: 'blob',
        });

        return new Blob([response.data], {
            type: response.headers['content-type'] || response.data.type || 'application/octet-stream',
        });
    },

    deleteDocument: async (id: number): Promise<void> => {
        await api.delete(`/api/documents/${id}`);
    },

    replaceDocument: async (id: number, file: File): Promise<ApiDocument> => {
        if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
            throw new Error(getMaxFileSizeErrorMessage());
        }

        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/api/documents/${id}/replace`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    },
};
