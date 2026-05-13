import type { LegalArchiveQuery, LegalBooksQuery, NotarialTemplateQuery, NotarialGeneratedDocumentQuery } from '../types/legalRecords.types';

export const lawFirmKeys = {
    catalog: ['law-firm', 'catalog'] as const,
    books: (params?: LegalBooksQuery) => ['law-firm', 'books', params] as const,
    templates: (params?: NotarialTemplateQuery) => ['law-firm', 'templates', params] as const,
    generatedDocuments: (params?: NotarialGeneratedDocumentQuery) => ['law-firm', 'generated-documents', params] as const,
    generatedDocument: (documentId: number) => ['law-firm', 'generated-document', documentId] as const,
    generatedDocumentEditor: (documentId: number) => ['law-firm', 'generated-document-editor', documentId] as const,
    archive: (params?: LegalArchiveQuery) => ['law-firm', 'archive', params] as const,
    bookPageScans: (bookId: number) => ['law-firm', 'book-page-scans', bookId] as const,
    legacyBookFiles: (bookId: number) => ['law-firm', 'legacy-book-files', bookId] as const,
    legalParties: (search: string, limit: number) => ['law-firm', 'legal-parties', search, limit] as const,
};
