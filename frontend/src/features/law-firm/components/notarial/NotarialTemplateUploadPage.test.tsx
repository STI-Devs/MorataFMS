import { fireEvent, screen, waitFor } from '@testing-library/react';
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
    mockCreateTemplate,
    mockToastError,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseLegalCatalog: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseNotarialGeneratedDocuments: vi.fn(),
    mockUseCreateNotarialTemplate: vi.fn(),
    mockCreateTemplate: vi.fn(),
    mockToastError: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('sonner', () => ({
    toast: {
        error: mockToastError,
        success: vi.fn(),
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
}));

describe('NotarialTemplateUploadPage', () => {
    beforeEach(() => {
        mockCreateTemplate.mockReset();
        mockToastError.mockReset();

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
                data: [],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 100,
                    total: 0,
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
});
