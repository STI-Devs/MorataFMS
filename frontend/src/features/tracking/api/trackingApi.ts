import api from '../../../lib/axios';
import {
    MAX_MULTI_UPLOAD_FILES,
    getMaxFilesErrorMessage,
} from '../../../lib/uploads';
import type {
    ApiDocument,
    ApiExportTransaction,
    ApiImportTransaction,
    ApiTrackingDetail,
    UploadDocumentsPayload,
} from '../types';
import { archivesApi } from './archives.api';
import { documentsApi } from './documents.api';
import { exportsApi } from './exports.api';
import { importsApi } from './imports.api';
import {
    getUploadErrorMessage,
    withUploadErrorMessage,
} from './internal/uploadErrors';
import { referenceApi } from './reference.api';

export const trackingApi = {
    getTrackingDetail: async (referenceId: string): Promise<ApiTrackingDetail> => {
        const response = await api.get(`/api/tracking/${encodeURIComponent(referenceId)}`);
        return response.data.data;
    },

    ...importsApi,
    ...exportsApi,
    ...referenceApi,
    ...archivesApi,
    ...documentsApi,

    // --- Multi-file upload workflow (rollback on partial failure) ---
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

    uploadVesselBillingDocuments: async (
        payload: import('../types').UploadVesselBillingDocumentsPayload,
    ): Promise<import('../types').VesselBillingUploadResult> => {
        if (payload.files.length > MAX_MULTI_UPLOAD_FILES) {
            throw new Error(getMaxFilesErrorMessage());
        }

        return documentsApi.uploadVesselBillingDocuments(payload);
    },

    // --- Archive create + per-document upload workflow (rollback on failure) ---
    createArchiveImportWithDocuments: async (
        data: import('./archives.api').CreateArchiveImportPayload,
    ): Promise<ApiImportTransaction> => {
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

    createArchiveExportWithDocuments: async (
        data: import('./archives.api').CreateArchiveExportPayload,
    ): Promise<ApiExportTransaction> => {
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
};
