import api from '../../../lib/axios';
import type {
    CreateLegalArchiveRecordPayload,
    CreateNotarialBookPayload,
    CreateNotarialLegacyFilesPayload,
    CreateNotarialPageScanPayload,
    CreateNotarialTemplatePayload,
    LegalArchiveQuery,
    LegalArchiveRecord,
    LegalBook,
    LegalBooksQuery,
    LegalCatalogResponse,
    LegalLegacyBookFile,
    LegalPageScan,
    LegalParty,
    NotarialTemplate,
    NotarialTemplateQuery,
    NotarialTemplateRecord,
    NotarialTemplateRecordQuery,
    PaginatedResponse,
    UpdateNotarialBookPayload,
    UpdateNotarialTemplatePayload,
    UpdateNotarialPageScanPayload,
    GenerateNotarialTemplateRecordPayload,
} from '../types/legalRecords.types';

export const lawFirmApi = {
    async getCatalog(): Promise<LegalCatalogResponse> {
        const response = await api.get('/api/notarial/document-types');

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
        const response = await api.get('/api/notarial/templates', { params });

        return response.data;
    },

    async createTemplate(payload: CreateNotarialTemplatePayload): Promise<NotarialTemplate> {
        const formData = new FormData();
        formData.append('code', payload.code);
        formData.append('label', payload.label);
        formData.append('document_code', payload.document_code);
        formData.append('field_schema', JSON.stringify(payload.field_schema));

        if (payload.default_notarial_act_type) {
            formData.append('default_notarial_act_type', payload.default_notarial_act_type);
        }

        if (payload.description) {
            formData.append('description', payload.description);
        }

        if (payload.is_active !== undefined) {
            formData.append('is_active', payload.is_active ? '1' : '0');
        }

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post('/api/notarial/templates', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    async updateTemplate(templateId: number, payload: UpdateNotarialTemplatePayload): Promise<NotarialTemplate> {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (payload.code !== undefined) {
            formData.append('code', payload.code);
        }

        if (payload.label !== undefined) {
            formData.append('label', payload.label);
        }

        if (payload.document_code !== undefined) {
            formData.append('document_code', payload.document_code);
        }

        if (payload.default_notarial_act_type !== undefined) {
            formData.append('default_notarial_act_type', payload.default_notarial_act_type);
        }

        if (payload.description !== undefined) {
            formData.append('description', payload.description);
        }

        if (payload.field_schema !== undefined) {
            formData.append('field_schema', JSON.stringify(payload.field_schema));
        }

        if (payload.is_active !== undefined) {
            formData.append('is_active', payload.is_active ? '1' : '0');
        }

        if (payload.file) {
            formData.append('file', payload.file);
        }

        const response = await api.post(`/api/notarial/templates/${templateId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
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

    async getTemplateRecords(params?: NotarialTemplateRecordQuery): Promise<PaginatedResponse<NotarialTemplateRecord>> {
        const response = await api.get('/api/notarial/template-records', { params });

        return response.data;
    },

    async generateTemplateRecord(payload: GenerateNotarialTemplateRecordPayload): Promise<NotarialTemplateRecord> {
        const response = await api.post('/api/notarial/template-records', payload);

        return response.data.data;
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
