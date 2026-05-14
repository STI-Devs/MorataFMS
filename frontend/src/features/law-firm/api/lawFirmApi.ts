import api from '../../../lib/axios';
import type {
    CreateLegalArchiveRecordPayload,
    CreateEditableNotarialGeneratedDocumentPayload,
    CreateNotarialTemplatePayload,
    LegalArchiveQuery,
    LegalArchiveRecord,
    LegalCatalogResponse,
    LawFirmDocumentModule,
    LegalParty,
    NotarialTemplate,
    NotarialTemplateQuery,
    NotarialGeneratedDocument,
    NotarialGeneratedDocumentQuery,
    OnlyOfficeEditorConfigResponse,
    PaginatedResponse,
    UpdateNotarialTemplatePayload,
} from '../types/legalRecords.types';

const documentWorkflowPrefix = (module?: LawFirmDocumentModule): string =>
    module === 'legal' ? '/api/legal' : '/api/notarial';

export const lawFirmApi = {
    async downloadFile(downloadUrl: string, filename: string): Promise<void> {
        const response = await api.get(downloadUrl, {
            responseType: 'blob',
        });

        const objectUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = objectUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
    },

    async getCatalog(module?: LawFirmDocumentModule): Promise<LegalCatalogResponse> {
        const response = await api.get(`${documentWorkflowPrefix(module)}/document-types`);

        return response.data;
    },

    async getLegalParties(params?: { search?: string; limit?: number }): Promise<{ data: LegalParty[] }> {
        const response = await api.get('/api/notarial/legal-parties', { params });

        return response.data;
    },

    async getTemplates(params?: NotarialTemplateQuery): Promise<PaginatedResponse<NotarialTemplate>> {
        const response = await api.get(`${documentWorkflowPrefix(params?.module)}/templates`, { params });

        return response.data;
    },

    async createTemplate(payload: CreateNotarialTemplatePayload): Promise<NotarialTemplate> {
        const formData = new FormData();
        if (payload.module) {
            formData.append('module', payload.module);
        }
        formData.append('code', payload.code);
        formData.append('label', payload.label);
        formData.append('document_code', payload.document_code);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        if (payload.is_active !== undefined) {
            formData.append('is_active', payload.is_active ? '1' : '0');
        }

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post(`${documentWorkflowPrefix(payload.module)}/templates`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    async updateTemplate(templateId: number, payload: UpdateNotarialTemplatePayload): Promise<NotarialTemplate> {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        if (payload.module !== undefined) {
            formData.append('module', payload.module);
        }

        if (payload.code !== undefined) {
            formData.append('code', payload.code);
        }

        if (payload.label !== undefined) {
            formData.append('label', payload.label);
        }

        if (payload.document_code !== undefined) {
            formData.append('document_code', payload.document_code);
        }

        if (payload.description !== undefined) {
            formData.append('description', payload.description);
        }

        if (payload.is_active !== undefined) {
            formData.append('is_active', payload.is_active ? '1' : '0');
        }

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post(`${documentWorkflowPrefix(payload.module)}/templates/${templateId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    async deleteTemplate(templateId: number, module?: LawFirmDocumentModule): Promise<void> {
        await api.delete(`${documentWorkflowPrefix(module)}/templates/${templateId}`);
    },

    async getGeneratedDocuments(params?: NotarialGeneratedDocumentQuery): Promise<PaginatedResponse<NotarialGeneratedDocument>> {
        const response = await api.get(`${documentWorkflowPrefix(params?.module)}/generated-documents`, { params });

        return response.data;
    },

    async getGeneratedDocument(documentId: number, module?: LawFirmDocumentModule): Promise<NotarialGeneratedDocument> {
        const response = await api.get(`${documentWorkflowPrefix(module)}/generated-documents/${documentId}`);

        return response.data.data;
    },

    async createEditableGeneratedDocument(payload: CreateEditableNotarialGeneratedDocumentPayload): Promise<NotarialGeneratedDocument> {
        const response = await api.post(`${documentWorkflowPrefix(payload.module)}/generated-documents`, payload);

        return response.data.data;
    },

    async getGeneratedDocumentEditorConfig(documentId: number, module?: LawFirmDocumentModule): Promise<OnlyOfficeEditorConfigResponse> {
        const response = await api.get(`${documentWorkflowPrefix(module)}/generated-documents/${documentId}/onlyoffice/config`);

        return response.data;
    },

    async previewGeneratedDocument(documentId: number): Promise<Blob> {
        const response = await api.get(`/api/notarial/generated-documents/${documentId}/preview`, {
            responseType: 'blob',
        });

        return new Blob([response.data], {
            type: response.headers['content-type'] || response.data.type || 'application/octet-stream',
        });
    },

    async deleteGeneratedDocument(documentId: number, module?: LawFirmDocumentModule): Promise<void> {
        await api.delete(`${documentWorkflowPrefix(module)}/generated-documents/${documentId}`);
    },

    async getArchive(params?: LegalArchiveQuery): Promise<PaginatedResponse<LegalArchiveRecord>> {
        const response = await api.get('/api/legal-archive', { params });

        return response.data;
    },

    async createArchiveRecord(payload: CreateLegalArchiveRecordPayload): Promise<LegalArchiveRecord> {
        const formData = new FormData();
        formData.append('file_category', payload.file_category);
        formData.append('file_code', payload.file_code);
        formData.append('title', payload.title);
        formData.append('related_name', payload.related_name);

        if (payload.document_date) {
            formData.append('document_date', payload.document_date);
        }

        if (payload.notes) {
            formData.append('notes', payload.notes);
        }

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post('/api/legal-archive', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },
};
