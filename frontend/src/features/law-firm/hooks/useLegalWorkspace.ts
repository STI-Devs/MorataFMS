import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lawFirmApi } from '../api/lawFirmApi';
import type {
    CreateEditableNotarialGeneratedDocumentPayload,
    CreateNotarialTemplatePayload,
    LegalArchiveQuery,
    LawFirmDocumentModule,
    NotarialTemplateQuery,
    NotarialGeneratedDocumentQuery,
    UpdateNotarialTemplatePayload,
} from '../types/legalRecords.types';
import { lawFirmKeys } from '../utils/queryKeys';

export const useLegalCatalog = (module?: LawFirmDocumentModule) =>
    useQuery({
        queryKey: lawFirmKeys.catalog(module),
        queryFn: () => lawFirmApi.getCatalog(module),
    });

export const useLegalParties = (search: string, limit = 8) =>
    useQuery({
        queryKey: lawFirmKeys.legalParties(search, limit),
        queryFn: () => lawFirmApi.getLegalParties({ search, limit }),
        select: (response) => response.data ?? [],
        enabled: search.trim().length > 0,
    });

export const useNotarialTemplates = (params?: NotarialTemplateQuery) =>
    useQuery({
        queryKey: lawFirmKeys.templates(params),
        queryFn: () => lawFirmApi.getTemplates(params),
    });

export const useNotarialGeneratedDocuments = (params?: NotarialGeneratedDocumentQuery) =>
    useQuery({
        queryKey: lawFirmKeys.generatedDocuments(params),
        queryFn: () => lawFirmApi.getGeneratedDocuments(params),
    });

export const useNotarialGeneratedDocument = (documentId: number | null, module?: LawFirmDocumentModule) =>
    useQuery({
        queryKey: lawFirmKeys.generatedDocument(documentId ?? 0, module),
        queryFn: () => lawFirmApi.getGeneratedDocument(documentId!, module),
        enabled: documentId !== null && documentId > 0,
        refetchInterval: 8000,
    });

export const useNotarialGeneratedDocumentEditorConfig = (documentId: number | null, module?: LawFirmDocumentModule) =>
    useQuery({
        queryKey: lawFirmKeys.generatedDocumentEditor(documentId ?? 0, module),
        queryFn: () => lawFirmApi.getGeneratedDocumentEditorConfig(documentId!, module),
        enabled: documentId !== null && documentId > 0,
    });

export const useLegalArchive = (params?: LegalArchiveQuery) =>
    useQuery({
        queryKey: lawFirmKeys.archive(params),
        queryFn: () => lawFirmApi.getArchive(params),
    });

export const useCreateNotarialTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateNotarialTemplatePayload) => lawFirmApi.createTemplate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'templates'] });
        },
    });
};

export const useUpdateNotarialTemplate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ templateId, data }: { templateId: number; data: UpdateNotarialTemplatePayload }) =>
            lawFirmApi.updateTemplate(templateId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'templates'] });
        },
    });
};

export const useDeleteNotarialTemplate = (module?: LawFirmDocumentModule) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (templateId: number) => lawFirmApi.deleteTemplate(templateId, module),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'templates'] });
        },
    });
};

export const useCreateEditableNotarialGeneratedDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateEditableNotarialGeneratedDocumentPayload) =>
            lawFirmApi.createEditableGeneratedDocument(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'generated-documents'] });
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'legal-parties'] });
        },
    });
};

export const useDeleteNotarialGeneratedDocument = (module?: LawFirmDocumentModule) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (documentId: number) => lawFirmApi.deleteGeneratedDocument(documentId, module),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'generated-documents'] });
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'templates'] });
        },
    });
};

export const useCreateLegalArchiveRecord = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: lawFirmApi.createArchiveRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'archive'] });
        },
    });
};
