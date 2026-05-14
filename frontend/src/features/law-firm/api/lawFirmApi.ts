import api from '../../../lib/axios';
import type {
    CreateLegalArchiveRecordPayload,
    CreateEditableNotarialGeneratedDocumentPayload,
    CreateNotarialBookPayload,
    CreateNotarialLegacyFilesPayload,
    CreateNotarialPageScanPayload,
    CreateNotarialTemplatePayload,
    LegalArchiveQuery,
    LegalArchiveRecord,
    LegalBook,
    LegalBooksQuery,
    LegalCatalogResponse,
    LawFirmDocumentModule,
    LegalLegacyBookFile,
    LegalPageScan,
    LegalParty,
    NotarialTemplate,
    NotarialTemplateQuery,
    NotarialGeneratedDocument,
    NotarialGeneratedDocumentQuery,
    OnlyOfficeEditorConfigResponse,
    PaginatedResponse,
    UpdateNotarialBookPayload,
    UpdateNotarialTemplatePayload,
    UpdateNotarialPageScanPayload,
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

    async getBooks(params?: LegalBooksQuery): Promise<PaginatedResponse<LegalBook>> {
        const response = await api.get('/api/notarial/books', { params });

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

    async createBook(payload: CreateNotarialBookPayload): Promise<LegalBook> {
        const formData = new FormData();
        formData.append('book_number', String(payload.book_number));
        formData.append('year', String(payload.year));

        if (payload.status) {
            formData.append('status', payload.status);
        }

        if (payload.notes) {
            formData.append('notes', payload.notes);
        }

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post('/api/notarial/books', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    async updateBook(bookId: number, payload: UpdateNotarialBookPayload): Promise<LegalBook> {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (payload.book_number !== undefined) {
            formData.append('book_number', String(payload.book_number));
        }

        if (payload.year !== undefined) {
            formData.append('year', String(payload.year));
        }

        if (payload.status) {
            formData.append('status', payload.status);
        }

        if (payload.notes !== undefined) {
            formData.append('notes', payload.notes);
        }

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post(`/api/notarial/books/${bookId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
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

    async getLegacyBookFiles(bookId: number): Promise<{ data: LegalLegacyBookFile[] }> {
        const response = await api.get(`/api/notarial/books/${bookId}/legacy-files`);

        return response.data;
    },

    async createLegacyBookFiles(bookId: number, payload: CreateNotarialLegacyFilesPayload): Promise<LegalLegacyBookFile[]> {
        const formData = new FormData();

        payload.files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });

        const response = await api.post(`/api/notarial/books/${bookId}/legacy-files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    async deleteLegacyBookFile(fileId: number): Promise<void> {
        await api.delete(`/api/notarial/legacy-files/${fileId}`);
    },

    async getBookPageScans(bookId: number): Promise<{ data: LegalPageScan[] }> {
        const response = await api.get(`/api/notarial/books/${bookId}/page-scans`);

        return response.data;
    },

    async createBookPageScan(bookId: number, payload: CreateNotarialPageScanPayload): Promise<LegalPageScan> {
        const formData = new FormData();
        formData.append('page_start', String(payload.page_start));
        formData.append('page_end', String(payload.page_end));
        formData.append('file', payload.file);

        const response = await api.post(`/api/notarial/books/${bookId}/page-scans`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    async updateBookPageScan(scanId: number, payload: UpdateNotarialPageScanPayload): Promise<LegalPageScan> {
        const formData = new FormData();
        formData.append('page_start', String(payload.page_start));
        formData.append('page_end', String(payload.page_end));

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post(`/api/notarial/page-scans/${scanId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    async deleteBookPageScan(scanId: number): Promise<void> {
        await api.delete(`/api/notarial/page-scans/${scanId}`);
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
