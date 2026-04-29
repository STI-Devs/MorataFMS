import api from '../../../lib/axios';
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
