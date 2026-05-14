import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocumentGenerator } from './useDocumentGenerator';

const {
    mockUseLegalCatalog,
    mockUseNotarialTemplates,
    mockUseNotarialGeneratedDocuments,
    mockUseLegalParties,
    mockUseCreateEditableNotarialGeneratedDocument,
    mockMutateAsync,
    mockToastSuccess,
    mockToastError,
} = vi.hoisted(() => ({
    mockUseLegalCatalog: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseNotarialGeneratedDocuments: vi.fn(),
    mockUseLegalParties: vi.fn(),
    mockUseCreateEditableNotarialGeneratedDocument: vi.fn(),
    mockMutateAsync: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: mockToastSuccess,
        error: mockToastError,
    },
}));

vi.mock('./useLegalWorkspace', () => ({
    useLegalCatalog: mockUseLegalCatalog,
    useNotarialTemplates: mockUseNotarialTemplates,
    useNotarialGeneratedDocuments: mockUseNotarialGeneratedDocuments,
    useLegalParties: mockUseLegalParties,
    useCreateEditableNotarialGeneratedDocument: mockUseCreateEditableNotarialGeneratedDocument,
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useDocumentGenerator', () => {
    beforeEach(() => {
        mockMutateAsync.mockReset();
        mockToastSuccess.mockReset();
        mockToastError.mockReset();
        vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
        vi.spyOn(window, 'open').mockReturnValue({
            opener: null,
            location: {
                replace: vi.fn(),
            },
        } as unknown as Window);

        mockUseLegalCatalog.mockReturnValue({
            data: {
                categories: [
                    {
                        code: 'affidavit_oath',
                        label: 'Affidavits / Oaths',
                    },
                ],
            },
        });

        mockUseNotarialTemplates.mockImplementation((params?: { template_status?: string; is_active?: boolean }) => {
            if (params?.template_status === 'ready') {
                return {
                    data: {
                        data: [],
                        meta: { total: 1 },
                    },
                };
            }

            return {
                data: {
                    data: [
                        {
                            id: 12,
                            label: 'Affidavit of Loss - TIN',
                            document_code: 'AFFIDAVIT_LOSS',
                            document_code_label: 'Affidavit of Loss',
                            document_category: 'affidavit_oath',
                            document_category_label: 'Affidavits / Oaths',
                            template_status: 'ready',
                            is_active: true,
                            source_file: {
                                filename: 'affidavit-of-loss-tin.docx',
                            },
                        },
                    ],
                    meta: { total: 1 },
                },
            };
        });

        mockUseNotarialGeneratedDocuments.mockReturnValue({
            data: {
                meta: { total: 4 },
            },
        });

        mockUseLegalParties.mockReturnValue({
            data: [],
        });

        mockUseCreateEditableNotarialGeneratedDocument.mockReturnValue({
            mutateAsync: mockMutateAsync,
            isPending: false,
        });
    });

    it('opens the editor in a new tab after creating a draft', async () => {
        mockMutateAsync.mockResolvedValue({
            id: 88,
        });

        const { result } = renderHook(() => useDocumentGenerator(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.handleCategorySelect('all');
            result.current.handleTemplateSelect(12);
            result.current.setPartySearch('Maria Santos');
        });

        await act(async () => {
            await result.current.handleGenerate();
        });

        expect(mockMutateAsync).toHaveBeenCalledWith({
            module: 'notarial',
            notarial_template_id: 12,
            notes: undefined,
            party_id: undefined,
            party_name: 'Maria Santos',
        });
        expect(mockToastSuccess).toHaveBeenCalledWith('Draft created.');
        expect(window.open).toHaveBeenCalledWith('', '_blank');
        expect(window.location.assign).not.toHaveBeenCalled();
    });
});
