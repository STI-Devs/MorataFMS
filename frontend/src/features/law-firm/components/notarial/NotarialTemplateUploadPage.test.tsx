import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { NotarialTemplateUploadPage } from './NotarialTemplateUploadPage';

const {
    mockUseAuth,
    mockUseLegalCatalog,
    mockUseLegalBooks,
    mockUseNotarialTemplates,
    mockUseNotarialTemplateRecords,
    mockUseCreateNotarialTemplate,
    mockCreateTemplate,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseLegalCatalog: vi.fn(),
    mockUseLegalBooks: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseNotarialTemplateRecords: vi.fn(),
    mockUseCreateNotarialTemplate: vi.fn(),
    mockCreateTemplate: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../../auth', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalCatalog: mockUseLegalCatalog,
    useLegalBooks: mockUseLegalBooks,
    useNotarialTemplates: mockUseNotarialTemplates,
    useNotarialTemplateRecords: mockUseNotarialTemplateRecords,
    useCreateNotarialTemplate: mockUseCreateNotarialTemplate,
}));

describe('NotarialTemplateUploadPage', () => {
    beforeEach(() => {
        mockCreateTemplate.mockReset();

        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                role: 'admin',
                permissions: {
                    manage_notarial_templates: true,
                },
            },
        });

        mockUseLegalCatalog.mockReturnValue({
            data: {
                notarial_act_types: [
                    { code: 'jurat', label: 'Jurat' },
                    { code: 'acknowledgment', label: 'Acknowledgment' },
                ],
                template_field_types: [
                    { code: 'text', label: 'Text' },
                    { code: 'textarea', label: 'Long Text' },
                    { code: 'select', label: 'Select' },
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

        mockUseLegalBooks.mockReturnValue({
            data: {
                data: [],
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

        mockUseNotarialTemplateRecords.mockReturnValue({
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

    it('keeps master Word upload on a separate admin page', async () => {
        renderWithProviders(<NotarialTemplateUploadPage />, {
            route: appRoutes.paralegalTemplateUpload,
            path: appRoutes.paralegalTemplateUpload,
        });

        expect(screen.getByRole('heading', { name: 'Template Upload' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Upload Word Template' })).toBeInTheDocument();

        fireEvent.change(document.getElementById('template-code') as HTMLInputElement, {
            target: { value: 'affidavit-loss-standard' },
        });
        fireEvent.change(document.getElementById('template-label') as HTMLInputElement, {
            target: { value: 'Affidavit of Loss' },
        });
        fireEvent.change(document.getElementById('template-document-code') as HTMLSelectElement, {
            target: { value: 'AFFIDAVIT_LOSS' },
        });
        fireEvent.change(document.getElementById('template-notarial-act') as HTMLSelectElement, {
            target: { value: 'jurat' },
        });
        fireEvent.change(screen.getByPlaceholderText('party_name'), {
            target: { value: 'affiant_name' },
        });
        fireEvent.change(screen.getByPlaceholderText('Party Name'), {
            target: { value: 'Affiant Name' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Save Template' }));

        await waitFor(() => {
            expect(mockCreateTemplate).toHaveBeenCalledWith({
                code: 'affidavit-loss-standard',
                label: 'Affidavit of Loss',
                document_code: 'AFFIDAVIT_LOSS',
                default_notarial_act_type: 'jurat',
                description: undefined,
                field_schema: [
                    {
                        name: 'affiant_name',
                        label: 'Affiant Name',
                        type: 'text',
                        required: true,
                        placeholder: undefined,
                        help_text: undefined,
                        options: undefined,
                    },
                ],
                is_active: true,
                file: null,
            });
        });
    });
});
