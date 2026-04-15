import api from '../../../lib/axios';
import { getMaxFilesErrorMessage, MAX_MULTI_UPLOAD_FILES } from '../../../lib/uploads';
import type {
    ApiClient,
    ApiCountry,
    ApiDocument,
    ApiExportTransaction,
    ApiImportTransaction,
    ApiTrackingDetail,
    CreateExportPayload,
    CreateImportPayload,
    DocumentTransactionListResponse,
    DocumentableType,
    PaginatedResponse,
    OperationalScope,
    TransactionStats,
    UploadDocumentPayload,
    UploadDocumentsPayload,
} from '../types';

const MAX_PAGE_SIZE = 500;

async function fetchAllPages<T>(
    fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
    const firstPage = await fetchPage(1);
    const allRows = [...firstPage.data];
    const lastPage = firstPage.meta?.last_page ?? 1;

    if (lastPage <= 1) {
        return allRows;
    }

    const remainingPages = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, index) => fetchPage(index + 2)),
    );

    for (const page of remainingPages) {
        allRows.push(...page.data);
    }

    return allRows;
}

function getUploadErrorMessage(error: unknown): string {
    const responseData = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat().find((message) => typeof message === 'string' && message.trim().length > 0)
        : null;

    return validationMessage
        ?? responseData?.message
        ?? (error instanceof Error ? error.message : null)
        ?? 'Upload failed. Please try again.';
}

function withUploadErrorMessage(error: unknown, message: string): Error {
    if (error && typeof error === 'object') {
        const errorRecord = error as {
            message?: string;
            response?: {
                data?: {
                    message?: string;
                };
            };
        };

        errorRecord.message = message;
        errorRecord.response ??= {};
        errorRecord.response.data ??= {};
        errorRecord.response.data.message = message;

        return error as Error;
    }

    return new Error(message);
}

type ArchiveDocumentUpload = {
    file: File;
    stage: string;
};

type CreateArchiveImportPayload = {
    bl_no: string;
    selective_color: 'green' | 'yellow' | 'red';
    importer_id: number;
    file_date: string;
    customs_ref_no?: string;
    origin_country_id?: number;
    notes?: string;
    documents?: ArchiveDocumentUpload[];
    not_applicable_stages?: string[];
};

type CreateArchiveExportPayload = {
    bl_no: string;
    shipper_id: number;
    destination_country_id: number;
    file_date: string;
    vessel?: string;
    notes?: string;
    documents?: ArchiveDocumentUpload[];
    not_applicable_stages?: string[];
};

export const trackingApi = {
    getTrackingDetail: async (referenceId: string): Promise<ApiTrackingDetail> => {
        const response = await api.get(`/api/tracking/${encodeURIComponent(referenceId)}`);
        return response.data.data;
    },

    // --- Import Transactions ---
    getImports: async (params?: {
        search?: string;
        status?: string;
        selective_color?: string;
        operational_scope?: OperationalScope;
        exclude_statuses?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<ApiImportTransaction>> => {
        const response = await api.get('/api/import-transactions', { params });
        return response.data;
    },

    createImport: async (data: CreateImportPayload): Promise<ApiImportTransaction> => {
        const response = await api.post('/api/import-transactions', data);
        return response.data.data;
    },

    updateImport: async ({ id, data }: { id: number; data: CreateImportPayload }): Promise<ApiImportTransaction> => {
        const response = await api.put(`/api/import-transactions/${id}`, data);
        return response.data.data;
    },

    updateImportStageApplicability: async (
        id: number,
        payload: { stage: string; not_applicable: boolean },
    ): Promise<ApiImportTransaction> => {
        const response = await api.patch(`/api/import-transactions/${id}/stage-applicability`, payload);
        return response.data.data;
    },

    // --- Export Transactions ---
    getExports: async (params?: {
        search?: string;
        status?: string;
        operational_scope?: OperationalScope;
        exclude_statuses?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<ApiExportTransaction>> => {
        const response = await api.get('/api/export-transactions', { params });
        return response.data;
    },

    getAllImports: async (params?: {
        search?: string;
        status?: string;
        selective_color?: string;
        operational_scope?: OperationalScope;
        exclude_statuses?: string;
    }): Promise<ApiImportTransaction[]> =>
        fetchAllPages((page) =>
            trackingApi.getImports({
                ...params,
                page,
                per_page: MAX_PAGE_SIZE,
            }),
        ),

    getAllExports: async (params?: {
        search?: string;
        status?: string;
        operational_scope?: OperationalScope;
        exclude_statuses?: string;
    }): Promise<ApiExportTransaction[]> =>
        fetchAllPages((page) =>
            trackingApi.getExports({
                ...params,
                page,
                per_page: MAX_PAGE_SIZE,
            }),
        ),

    createExport: async (data: CreateExportPayload): Promise<ApiExportTransaction> => {
        const response = await api.post('/api/export-transactions', data);
        return response.data.data;
    },

    updateExport: async ({ id, data }: { id: number; data: CreateExportPayload }): Promise<ApiExportTransaction> => {
        const response = await api.put(`/api/export-transactions/${id}`, data);
        return response.data.data;
    },

    updateExportStageApplicability: async (
        id: number,
        payload: { stage: string; not_applicable: boolean },
    ): Promise<ApiExportTransaction> => {
        const response = await api.patch(`/api/export-transactions/${id}/stage-applicability`, payload);
        return response.data.data;
    },

    // --- Stats (total counts across all records) ---
    getImportStats: async (signal?: AbortSignal): Promise<TransactionStats> => {
        const response = await api.get('/api/import-transactions/stats', { signal });
        return response.data.data;
    },

    getExportStats: async (signal?: AbortSignal): Promise<TransactionStats> => {
        const response = await api.get('/api/export-transactions/stats', { signal });
        return response.data.data;
    },

    // --- Delete Transactions ---
    deleteImport: async (id: number): Promise<void> => {
        await api.delete(`/api/import-transactions/${id}`);
    },

    deleteExport: async (id: number): Promise<void> => {
        await api.delete(`/api/export-transactions/${id}`);
    },

    // --- Cancel Transactions ---
    cancelImport: async (id: number, reason: string): Promise<void> => {
        await api.patch(`/api/import-transactions/${id}/cancel`, { reason });
    },

    cancelExport: async (id: number, reason: string): Promise<void> => {
        await api.patch(`/api/export-transactions/${id}/cancel`, { reason });
    },

    // --- Clients (for dropdowns) ---
    getClients: async (type?: 'importer' | 'exporter'): Promise<ApiClient[]> => {
        const response = await api.get('/api/clients', {
            params: type ? { type } : undefined,
        });
        return response.data.data;
    },

    // --- Countries (for dropdowns) ---
    getCountries: async (type?: 'export_destination'): Promise<ApiCountry[]> => {
        const response = await api.get('/api/countries', {
            params: type ? { type } : undefined,
        });
        return response.data.data;
    },

    // --- Create Client (for archive uploads when client not in DB) ---
    createClient: async (data: { name: string; type: 'importer' | 'exporter' | 'both' }): Promise<ApiClient> => {
        const response = await api.post('/api/clients', data);
        return response.data.data;
    },

    // --- Dedicated Archive Endpoints (strict: file_date must be past or today) ---
    getArchives: async (): Promise<import('../../documents/types/document.types').ArchiveYear[]> => {
        const response = await api.get('/api/archives');
        return response.data.data;
    },

    getMyArchives: async (): Promise<import('../../documents/types/document.types').ArchiveYear[]> => {
        const response = await api.get('/api/archives', { params: { mine: 1 } });
        return response.data.data;
    },

    createArchiveImport: async (data: CreateArchiveImportPayload): Promise<ApiImportTransaction> => {
        const hasDocuments = (data.documents?.length ?? 0) > 0;

        const response = hasDocuments
            ? await api.post('/api/archives/import', buildArchiveFormData(data), {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            : await api.post('/api/archives/import', data);

        return response.data.data;
    },

    createArchiveExport: async (data: CreateArchiveExportPayload): Promise<ApiExportTransaction> => {
        const hasDocuments = (data.documents?.length ?? 0) > 0;

        const response = hasDocuments
            ? await api.post('/api/archives/export', buildArchiveFormData(data), {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            : await api.post('/api/archives/export', data);

        return response.data.data;
    },

    rollbackArchiveImport: async (id: number): Promise<void> => {
        await api.delete(`/api/archives/import/${id}`);
    },

    rollbackArchiveExport: async (id: number): Promise<void> => {
        await api.delete(`/api/archives/export/${id}`);
    },

    createArchiveImportWithDocuments: async (data: CreateArchiveImportPayload): Promise<ApiImportTransaction> => {
        const { documents = [], ...archivePayload } = data;
        const transaction = await trackingApi.createArchiveImport(archivePayload);

        if (documents.length === 0) {
            return transaction;
        }

        try {
            for (const document of documents) {
                await trackingApi.uploadDocument({
                    file: document.file,
                    type: document.stage,
                    documentable_type: 'App\\Models\\ImportTransaction',
                    documentable_id: transaction.id,
                });
            }

            return transaction;
        } catch (error) {
            let rollbackFailed = false;

            try {
                await trackingApi.rollbackArchiveImport(transaction.id);
            } catch {
                rollbackFailed = true;
            }

            const baseMessage = getUploadErrorMessage(error);
            const rollbackMessage = rollbackFailed
                ? 'The archive rollback failed. Manual cleanup may be required.'
                : 'The archive record and uploaded files were rolled back.';
            const message = `Failed to upload archive documents. ${rollbackMessage} ${baseMessage}`;

            throw withUploadErrorMessage(error, message);
        }
    },

    createArchiveExportWithDocuments: async (data: CreateArchiveExportPayload): Promise<ApiExportTransaction> => {
        const { documents = [], ...archivePayload } = data;
        const transaction = await trackingApi.createArchiveExport(archivePayload);

        if (documents.length === 0) {
            return transaction;
        }

        try {
            for (const document of documents) {
                await trackingApi.uploadDocument({
                    file: document.file,
                    type: document.stage,
                    documentable_type: 'App\\Models\\ExportTransaction',
                    documentable_id: transaction.id,
                });
            }

            return transaction;
        } catch (error) {
            let rollbackFailed = false;

            try {
                await trackingApi.rollbackArchiveExport(transaction.id);
            } catch {
                rollbackFailed = true;
            }

            const baseMessage = getUploadErrorMessage(error);
            const rollbackMessage = rollbackFailed
                ? 'The archive rollback failed. Manual cleanup may be required.'
                : 'The archive record and uploaded files were rolled back.';
            const message = `Failed to upload archive documents. ${rollbackMessage} ${baseMessage}`;

            throw withUploadErrorMessage(error, message);
        }
    },

    // --- Documents ---
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

    uploadDocuments: async (payload: UploadDocumentsPayload): Promise<ApiDocument[]> => {
        if (payload.files.length > MAX_MULTI_UPLOAD_FILES) {
            throw new Error(getMaxFilesErrorMessage());
        }

        const uploadedDocuments: ApiDocument[] = [];

        for (const file of payload.files) {
            try {
                uploadedDocuments.push(await trackingApi.uploadDocument({
                    file,
                    type: payload.type,
                    documentable_type: payload.documentable_type,
                    documentable_id: payload.documentable_id,
                }));
            } catch (error) {
                if (uploadedDocuments.length > 0) {
                    await Promise.allSettled(
                        uploadedDocuments.map((document) => trackingApi.deleteDocument(document.id)),
                    );
                }

                const baseMessage = getUploadErrorMessage(error);
                const rollbackMessage = uploadedDocuments.length > 0
                    ? `Uploaded files were rolled back.`
                    : 'Nothing was uploaded.';
                const enhancedMessage = payload.files.length > 1
                    ? `Failed to upload "${file.name}". ${rollbackMessage} ${baseMessage}`
                    : baseMessage;

                throw withUploadErrorMessage(error, enhancedMessage);
            }
        }

        return uploadedDocuments;
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
};

function buildArchiveFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        if (key === 'documents' && Array.isArray(value)) {
            value.forEach((document, index) => {
                if (!document || typeof document !== 'object') {
                    return;
                }

                const file = 'file' in document ? document.file : null;
                const stage = 'stage' in document ? document.stage : null;

                if (file instanceof File) {
                    formData.append(`documents[${index}][file]`, file);
                }

                if (typeof stage === 'string' && stage !== '') {
                    formData.append(`documents[${index}][stage]`, stage);
                }
            });

            return;
        }

        if (key === 'not_applicable_stages' && Array.isArray(value)) {
            value.forEach((stage, index) => {
                if (typeof stage === 'string' && stage !== '') {
                    formData.append(`not_applicable_stages[${index}]`, stage);
                }
            });

            return;
        }

        formData.append(key, String(value));
    });

    return formData;
}
