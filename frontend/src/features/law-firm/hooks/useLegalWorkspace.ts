import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lawFirmApi } from '../api/lawFirmApi';
import type {
    CreateNotarialBookPayload,
    CreateNotarialLegacyFilesPayload,
    CreateNotarialPageScanPayload,
    CreateNotarialTemplatePayload,
    GenerateNotarialTemplateRecordPayload,
    LegalArchiveQuery,
    LegalBooksQuery,
    NotarialTemplateQuery,
    NotarialTemplateRecordQuery,
    UpdateNotarialBookPayload,
    UpdateNotarialPageScanPayload,
    UpdateNotarialTemplatePayload,
} from '../types/legalRecords.types';
import { lawFirmKeys } from '../utils/queryKeys';

export const useLegalCatalog = () =>
    useQuery({
        queryKey: lawFirmKeys.catalog,
        queryFn: () => lawFirmApi.getCatalog(),
    });

export const useLegalParties = (search: string, limit = 8) =>
    useQuery({
        queryKey: lawFirmKeys.legalParties(search, limit),
        queryFn: () => lawFirmApi.getLegalParties({ search, limit }),
        select: (response) => response.data ?? [],
        enabled: search.trim().length > 0,
    });

export const useLegalBooks = (params?: LegalBooksQuery) =>
    useQuery({
        queryKey: lawFirmKeys.books(params),
        queryFn: () => lawFirmApi.getBooks(params),
    });

export const useNotarialTemplates = (params?: NotarialTemplateQuery) =>
    useQuery({
        queryKey: lawFirmKeys.templates(params),
        queryFn: () => lawFirmApi.getTemplates(params),
    });

export const useNotarialTemplateRecords = (params?: NotarialTemplateRecordQuery) =>
    useQuery({
        queryKey: lawFirmKeys.templateRecords(params),
        queryFn: () => lawFirmApi.getTemplateRecords(params),
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

export const useGenerateNotarialTemplateRecord = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: GenerateNotarialTemplateRecordPayload) => lawFirmApi.generateTemplateRecord(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'template-records'] });
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'books'] });
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'legal-parties'] });
        },
    });
};

export const useCreateNotarialBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateNotarialBookPayload) => lawFirmApi.createBook(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'books'] });
        },
    });
};

export const useUpdateNotarialBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookId, data }: { bookId: number; data: UpdateNotarialBookPayload }) =>
            lawFirmApi.updateBook(bookId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['law-firm', 'books'] });
        },
    });
};

export const useBookPageScans = (bookId: number | null) =>
    useQuery({
        queryKey: lawFirmKeys.bookPageScans(bookId ?? 0),
        queryFn: () => lawFirmApi.getBookPageScans(bookId!),
        select: (res) => res.data ?? [],
        enabled: bookId !== null && bookId > 0,
    });

export const useLegacyBookFiles = (bookId: number | null) =>
    useQuery({
        queryKey: lawFirmKeys.legacyBookFiles(bookId ?? 0),
        queryFn: () => lawFirmApi.getLegacyBookFiles(bookId!),
        select: (res) => res.data ?? [],
        enabled: bookId !== null && bookId > 0,
    });

export const useCreateLegacyBookFiles = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookId, data }: { bookId: number; data: CreateNotarialLegacyFilesPayload }) =>
            lawFirmApi.createLegacyBookFiles(bookId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: lawFirmKeys.legacyBookFiles(variables.bookId) });
        },
    });
};

export const useDeleteLegacyBookFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ fileId }: { fileId: number; bookId: number }) => lawFirmApi.deleteLegacyBookFile(fileId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: lawFirmKeys.legacyBookFiles(variables.bookId) });
        },
    });
};

export const useCreateBookPageScan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookId, data }: { bookId: number; data: CreateNotarialPageScanPayload }) =>
            lawFirmApi.createBookPageScan(bookId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: lawFirmKeys.bookPageScans(variables.bookId) });
        },
    });
};

export const useUpdateBookPageScan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ scanId, data }: { scanId: number; data: UpdateNotarialPageScanPayload; bookId: number }) =>
            lawFirmApi.updateBookPageScan(scanId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: lawFirmKeys.bookPageScans(variables.bookId) });
        },
    });
};

export const useDeleteBookPageScan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ scanId }: { scanId: number; bookId: number }) => lawFirmApi.deleteBookPageScan(scanId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: lawFirmKeys.bookPageScans(variables.bookId) });
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
