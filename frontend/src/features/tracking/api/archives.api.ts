import api from '../../../lib/axios';
import { startApiDownload } from '../../../lib/downloads';
import type {
    ArchiveFolderHistoryParams,
    ArchiveFolderHistoryResponse,
    ArchiveDocumentIndexParams,
    ArchiveDocumentIndexResponse,
    ArchiveZipExport,
    ArchiveZipExportCreateParams,
    ArchiveZipExportListParams,
    ArchiveZipExportListResponse,
} from '../../archives/types/archiveHistory.types';
import type { ArchiveYear } from '../../documents/types/document.types';
import type { ApiExportTransaction, ApiImportTransaction } from '../types';
import { buildArchiveFormData } from './internal/archiveFormData';

export type ArchiveDocumentUpload = {
    file: File;
    stage: string;
};

export type CreateArchiveImportPayload = {
    bl_no: string;
    vessel_name?: string;
    selective_color: 'green' | 'yellow' | 'orange' | 'red';
    importer_id: number;
    file_date: string;
    customs_ref_no?: string;
    origin_country_id?: number;
    location_of_goods_id?: number;
    notes?: string;
    documents?: ArchiveDocumentUpload[];
    not_applicable_stages?: string[];
};

export type CreateArchiveExportPayload = {
    bl_no: string;
    shipper_id: number;
    destination_country_id: number;
    file_date: string;
    vessel?: string;
    notes?: string;
    documents?: ArchiveDocumentUpload[];
    not_applicable_stages?: string[];
};

export type UpdateArchiveImportPayload = {
    customs_ref_no?: string | null;
    bl_no: string;
    vessel_name?: string | null;
    selective_color: 'green' | 'yellow' | 'orange' | 'red';
    importer_id: number;
    origin_country_id?: number;
    location_of_goods_id?: number;
    file_date: string;
};

export type UpdateArchiveExportPayload = {
    bl_no: string;
    vessel?: string | null;
    shipper_id: number;
    destination_country_id: number;
    file_date: string;
};

export const archivesApi = {
    getArchives: async (): Promise<ArchiveYear[]> => {
        const response = await api.get('/api/archives');
        return response.data.data;
    },

    getMyArchives: async (): Promise<ArchiveYear[]> => {
        const response = await api.get('/api/archives', { params: { mine: 1 } });
        return response.data.data;
    },

    getArchiveFolderHistory: async (params: ArchiveFolderHistoryParams): Promise<ArchiveFolderHistoryResponse> => {
        const response = await api.get('/api/archives/history', {
            params: {
                ...params,
                mine: params.mine ? 1 : undefined,
            },
        });

        return response.data;
    },

    getArchiveDocuments: async (params: ArchiveDocumentIndexParams = {}): Promise<ArchiveDocumentIndexResponse> => {
        const response = await api.get('/api/archives/documents', {
            params: {
                ...params,
                mine: params.mine ? 1 : undefined,
            },
        });

        return response.data;
    },

    getArchiveZipExports: async (params: ArchiveZipExportListParams = {}): Promise<ArchiveZipExportListResponse> => {
        const response = await api.get('/api/archive-zip-exports', {
            params: {
                ...params,
                mine: params.mine === undefined ? undefined : Number(params.mine),
            },
        });

        return response.data;
    },

    createArchiveZipExport: async (params: ArchiveZipExportCreateParams): Promise<ArchiveZipExport> => {
        const response = await api.post('/api/archive-zip-exports', {
            ...params,
            mine: params.mine ? 1 : undefined,
        });

        return response.data.data;
    },

    retryArchiveZipExport: async (id: string): Promise<ArchiveZipExport> => {
        const response = await api.post(`/api/archive-zip-exports/${id}/retry`);

        return response.data.data;
    },

    deleteArchiveZipExport: async (id: string): Promise<void> => {
        await api.delete(`/api/archive-zip-exports/${id}`);
    },

    startArchiveZipExportDownload: (id: string): void => {
        startApiDownload(`/api/archive-zip-exports/${encodeURIComponent(id)}/download`);
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

    updateArchiveImport: async (id: number, data: UpdateArchiveImportPayload): Promise<ApiImportTransaction> => {
        const response = await api.put(`/api/archives/import/${id}`, data);
        return response.data.data;
    },

    updateArchiveExport: async (id: number, data: UpdateArchiveExportPayload): Promise<ApiExportTransaction> => {
        const response = await api.put(`/api/archives/export/${id}`, data);
        return response.data.data;
    },
};
