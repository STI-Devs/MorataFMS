import type { LawFirmDocumentModule, LegalArchiveQuery, NotarialTemplateQuery, NotarialGeneratedDocumentQuery } from '../types/legalRecords.types';

export const lawFirmKeys = {
    catalog: (module?: LawFirmDocumentModule) => ['law-firm', 'catalog', module ?? 'notarial'] as const,
    templates: (params?: NotarialTemplateQuery) => ['law-firm', 'templates', params] as const,
    generatedDocuments: (params?: NotarialGeneratedDocumentQuery) => ['law-firm', 'generated-documents', params] as const,
    generatedDocument: (documentId: number, module?: LawFirmDocumentModule) => ['law-firm', 'generated-document', module ?? 'notarial', documentId] as const,
    generatedDocumentEditor: (documentId: number, module?: LawFirmDocumentModule) => ['law-firm', 'generated-document-editor', module ?? 'notarial', documentId] as const,
    archive: (params?: LegalArchiveQuery) => ['law-firm', 'archive', params] as const,
    legalParties: (search: string, limit: number) => ['law-firm', 'legal-parties', search, limit] as const,
};
