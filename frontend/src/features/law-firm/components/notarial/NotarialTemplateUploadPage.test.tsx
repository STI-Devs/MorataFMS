import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { NotarialTemplateUploadPage } from './NotarialTemplateUploadPage';

const {
    mockUseAuth,
    mockUseLegalCatalog,
    mockUseNotarialTemplates,
    mockUseNotarialGeneratedDocuments,
    mockUseCreateNotarialTemplate,
    mockUseUpdateNotarialTemplate,
    mockUseDeleteNotarialTemplate,
    mockCreateTemplate,
    mockUpdateTemplate,
    mockDeleteTemplate,
    mockToastError,
    mockToastSuccess,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseLegalCatalog: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseNotarialGeneratedDocuments: vi.fn(),
    mockUseCreateNotarialTemplate: vi.fn(),
    mockUseUpdateNotarialTemplate: vi.fn(),
    mockUseDeleteNotarialTemplate: vi.fn(),
    mockCreateTemplate: vi.fn(),
    mockUpdateTemplate: vi.fn(),
    mockDeleteTemplate: vi.fn(),
    mockToastError: vi.fn(),
    mockToastSuccess: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        error: mockToastError,
        success: mockToastSuccess,
    },
}));

vi.mock('../../../auth', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalCatalog: mockUseLegalCatalog,
    useNotarialTemplates: mockUseNotarialTemplates,
    useNotarialGeneratedDocuments: mockUseNotarialGeneratedDocuments,
    useCreateNotarialTemplate: mockUseCreateNotarialTemplate,
    useUpdateNotarialTemplate: mockUseUpdateNotarialTemplate,
    useDeleteNotarialTemplate: mockUseDeleteNotarialTemplate,
}));

describe('NotarialTemplateUploadPage', () => {
    beforeEach(() => {
        mockCreateTemplate.mockReset();
        mockUpdateTemplate.mockReset();
        mockDeleteTemplate.mockReset();
        mockToastError.mockReset();
        mockToastSuccess.mockReset();

        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                role: 'admin',
                permissions: {
                    view_notarial_books: true,
                    manage_notarial_templates: true,
                    manage_notarial_books: true,
                },
            },
        });

        mockUseLegalCatalog.mockReturnValue({
            data: {
                notarial_act_types: [
                    { code: 'jurat', label: 'Jurat' },
                    { code: 'acknowledgment', label: 'Acknowledgment' },
                ],
                categories: [],
                document_types: [
                    {
                        code: 'AFFIDAVIT_LOSS',
                        label: 'Affidavit of Loss',
                        category: 'affidavit_oath',
                        default_notarial_act_type: 'jurat',
                    },
                ],
                grouped_document_types: [],
                legal_file_categories: [],
                legal_file_types: [],
                grouped_legal_file_types: [],
            },
        });

        mockUseNotarialTemplates.mockReturnValue({
            data: {
                data: [
                    {
                        id: 44,
                        code: 'affidavit-loss-standard',
                        label: 'Affidavit of Loss - Standard',
                        document_code: 'AFFIDAVIT_LOSS',
                        document_code_label: 'Affidavit of Loss',
                        document_category: 'affidavit_oath',
                        document_category_label: 'Affidavits / Oaths',
                        description: null,
                        is_active: true,
                        template_status: 'ready',
                        source_file: {
                            filename: 'affidavit-loss-standard.docx',
                            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            size_bytes: 1024,
                            formatted_size: '1 KB',
                            download_url: 'https://example.test/template.docx',
                        },
                        created_at: '2026-04-24T02:15:00.000Z',
                        updated_at: '2026-04-24T02:15:00.000Z',
                    },
                ],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 100,
                    total: 1,
                },
            },
        });

        mockUseNotarialGeneratedDocuments.mockReturnValue({
            data: {
                data: [],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 1,
                    total: 0,
                },
            },
        });

        mockUseCreateNotarialTemplate.mockReturnValue({
            mutateAsync: mockCreateTemplate.mockResolvedValue({ id: 99 }),
            isPending: false,
        });

        mockUseUpdateNotarialTemplate.mockReturnValue({
            mutateAsync: mockUpdateTemplate.mockResolvedValue({ id: 44 }),
            isPending: false,
        });

        mockUseDeleteNotarialTemplate.mockReturnValue({
            mutateAsync: mockDeleteTemplate.mockResolvedValue(undefined),
            isPending: false,
        });
    });

    it('saves a docx document master for direct editing', async () => {
        renderWithProviders(<NotarialTemplateUploadPage />, {
            route: appRoutes.paralegalMasterSetup,
            path: appRoutes.paralegalMasterSetup,
        });

        expect(screen.getByRole('heading', { name: 'Document Masters' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /add document master/i })).toBeInTheDocument();
        expect(screen.queryByText('Optional Fill-Up Fields')).not.toBeInTheDocument();
        expect(screen.queryByText('Narrative Clauses')).not.toBeInTheDocument();
        expect(screen.queryByText('Act Override')).not.toBeInTheDocument();
        expect(screen.getByText('affidavit-loss-standard.docx')).toBeInTheDocument();

        fireEvent.change(document.getElementById('template-variant-name') as HTMLInputElement, {
            target: { value: 'Standard' },
        });
        fireEvent.change(document.getElementById('template-document-code') as HTMLSelectElement, {
            target: { value: 'AFFIDAVIT_LOSS' },
        });

        fireEvent.click(screen.getByRole('button', { name: /save (document )?master/i }));

        await waitFor(() => {
            expect(mockCreateTemplate).toHaveBeenCalledWith({
                code: 'affidavit_loss-standard',
                label: 'Affidavit of Loss - Standard',
                document_code: 'AFFIDAVIT_LOSS',
                description: undefined,
                is_active: true,
                file: null,
            });
        });
    });

    it('blocks save when required master metadata is missing', async () => {
        renderWithProviders(<NotarialTemplateUploadPage />, {
            route: appRoutes.paralegalMasterSetup,
            path: appRoutes.paralegalMasterSetup,
        });

        fireEvent.click(screen.getByRole('button', { name: /save (document )?master/i }));

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith('Document type is required.');
        });

        expect(mockCreateTemplate).not.toHaveBeenCalled();
    });

    it('lets admin users delete a document master from the deployed masters list', async () => {
        renderWithProviders(<NotarialTemplateUploadPage />, {
            route: appRoutes.paralegalMasterSetup,
            path: appRoutes.paralegalMasterSetup,
        });

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(screen.getByRole('heading', { name: 'Delete "Affidavit of Loss - Standard"' })).toBeInTheDocument();
        expect(screen.getByText(/If generated records already use this master/i)).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete Master' }));

        await waitFor(() => {
            expect(mockDeleteTemplate).toHaveBeenCalledWith(44);
        });

        expect(mockToastSuccess).toHaveBeenCalledWith('Document master deleted.');
    });

    it('archives an active document master so generated records can keep their history', async () => {
        renderWithProviders(<NotarialTemplateUploadPage />, {
            route: appRoutes.paralegalMasterSetup,
            path: appRoutes.paralegalMasterSetup,
        });

        fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

        await waitFor(() => {
            expect(mockUpdateTemplate).toHaveBeenCalledWith({
                templateId: 44,
                data: { is_active: false },
            });
        });

        expect(mockToastSuccess).toHaveBeenCalledWith('Document master archived. Existing generated documents remain available.');
    });
});
