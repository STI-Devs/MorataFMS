import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LegalDocumentsPage } from './LegalDocumentsPage';

const {
    mockUseAuth,
    mockUseLegalCatalog,
    mockUseLegalBooks,
    mockUseLegalParties,
    mockUseNotarialTemplates,
    mockUseNotarialTemplateRecords,
    mockUseCreateNotarialTemplate,
    mockUseGenerateNotarialTemplateRecord,
    mockCreateTemplate,
    mockGenerateRecord,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseLegalCatalog: vi.fn(),
    mockUseLegalBooks: vi.fn(),
    mockUseLegalParties: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseNotarialTemplateRecords: vi.fn(),
    mockUseCreateNotarialTemplate: vi.fn(),
    mockUseGenerateNotarialTemplateRecord: vi.fn(),
    mockCreateTemplate: vi.fn(),
    mockGenerateRecord: vi.fn(),
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
    useLegalParties: mockUseLegalParties,
    useNotarialTemplates: mockUseNotarialTemplates,
    useNotarialTemplateRecords: mockUseNotarialTemplateRecords,
    useCreateNotarialTemplate: mockUseCreateNotarialTemplate,
    useGenerateNotarialTemplateRecord: mockUseGenerateNotarialTemplateRecord,
}));

describe('LegalDocumentsPage', () => {
    beforeEach(() => {
        mockCreateTemplate.mockReset();
        mockGenerateRecord.mockReset();

        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                role: 'admin',
                permissions: {
                    manage_notarial_books: true,
                },
            },
        });

        mockUseLegalParties.mockReturnValue({
            data: [
                {
                    id: 10,
                    name: 'Maria Santos',
                    principal_address: 'Tagum City',
                    created_at: null,
                    updated_at: null,
                },
            ],
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
                ],
                categories: [
                    {
                        code: 'affidavit_oath',
                        label: 'Affidavits / Oaths',
                        description: 'Affidavits and sworn statements.',
                    },
                ],
                document_types: [
                    {
                        code: 'AFFIDAVIT_LOSS',
                        label: 'Affidavit of Loss',
                        category: 'affidavit_oath',
                        default_notarial_act_type: 'jurat',
                    },
                    {
                        code: 'SPECIAL_POWER_OF_ATTORNEY',
                        label: 'Special Power of Attorney',
                        category: 'power_of_attorney',
                        default_notarial_act_type: 'acknowledgment',
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
                data: [
                    {
                        id: 18,
                        book_number: 2,
                        year: 2026,
                        status: 'active',
                        generated_record_count: 4,
                        page_scan_count: 2,
                        legacy_file_count: 1,
                        notes: null,
                        scan_file: null,
                        opened_at: null,
                        closed_at: null,
                        created_at: null,
                        updated_at: null,
                    },
                ],
            },
        });

        mockUseNotarialTemplates.mockReturnValue({
            data: {
                data: [
                    {
                        id: 1,
                        code: 'affidavit-loss-master',
                        label: 'Affidavit of Loss',
                        document_code: 'AFFIDAVIT_LOSS',
                        document_code_label: 'Affidavit of Loss',
                        document_category: 'affidavit_oath',
                        document_category_label: 'Affidavits / Oaths',
                        default_notarial_act_type: 'jurat',
                        default_notarial_act_type_label: 'Jurat',
                        description: 'Used for lost government IDs.',
                        field_schema: [
                            { name: 'affiant_name', label: 'Affiant Name', type: 'text', required: true },
                            { name: 'lost_item', label: 'Lost Item', type: 'text', required: true },
                            { name: 'principal_address', label: 'Address', type: 'text', required: false },
                        ],
                        is_active: true,
                        template_status: 'ready',
                        source_file: {
                            filename: 'affidavit-of-loss.docx',
                            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            size_bytes: 2048,
                            formatted_size: '2 KB',
                            download_url: 'https://example.test/template.docx',
                        },
                        created_at: null,
                        updated_at: null,
                    },
                    {
                        id: 2,
                        code: 'spa-master',
                        label: 'Special Power of Attorney',
                        document_code: 'SPECIAL_POWER_OF_ATTORNEY',
                        document_code_label: 'Special Power of Attorney',
                        document_category: 'power_of_attorney',
                        document_category_label: 'Power of Attorney',
                        default_notarial_act_type: 'acknowledgment',
                        default_notarial_act_type_label: 'Acknowledgment',
                        description: null,
                        field_schema: [
                            { name: 'principal_name', label: 'Principal Name', type: 'text', required: true },
                        ],
                        is_active: true,
                        template_status: 'missing_file',
                        source_file: null,
                        created_at: null,
                        updated_at: null,
                    },
                ],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 100,
                    total: 2,
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
                    total: 7,
                },
            },
        });

        mockUseCreateNotarialTemplate.mockReturnValue({
            mutateAsync: mockCreateTemplate.mockResolvedValue({ id: 99 }),
            isPending: false,
        });

        mockUseGenerateNotarialTemplateRecord.mockReturnValue({
            mutateAsync: mockGenerateRecord.mockResolvedValue({ id: 100 }),
            isPending: false,
        });
    });

    it('generates a Word document from the selected template instead of saving a register entry', async () => {
        renderWithProviders(<LegalDocumentsPage />, {
            route: appRoutes.paralegalNotarial,
            path: appRoutes.paralegalNotarial,
        });

        expect(screen.getByRole('heading', { name: 'Template Generator' })).toBeInTheDocument();
        expect(screen.getByText('Notarial Selector')).toBeInTheDocument();
        expect(screen.getByText('Fill-Up Form')).toBeInTheDocument();
        expect(screen.queryByText('Register a Word Template')).not.toBeInTheDocument();
        expect(screen.queryByText('Notarial Register Entry')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /save register entry/i })).not.toBeInTheDocument();

        fireEvent.change(document.getElementById('generated-party-name') as HTMLInputElement, {
            target: { value: 'Maria Santos' },
        });
        fireEvent.change(document.getElementById('generated-book-id') as HTMLSelectElement, {
            target: { value: '18' },
        });
        fireEvent.change(document.getElementById('template-field-affiant_name') as HTMLInputElement, {
            target: { value: 'Maria Santos' },
        });
        fireEvent.change(document.getElementById('template-field-lost_item') as HTMLInputElement, {
            target: { value: 'Passport' },
        });
        fireEvent.change(document.getElementById('template-field-principal_address') as HTMLInputElement, {
            target: { value: 'Tagum City' },
        });
        fireEvent.change(document.getElementById('generated-notes') as HTMLTextAreaElement, {
            target: { value: 'Generated while legal is out.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Generate Word Document' }));

        await waitFor(() => {
            expect(mockGenerateRecord).toHaveBeenCalledWith({
                notarial_template_id: 1,
                notarial_book_id: 18,
                party_name: 'Maria Santos',
                notes: 'Generated while legal is out.',
                template_data: {
                    affiant_name: 'Maria Santos',
                    lost_item: 'Passport',
                    principal_address: 'Tagum City',
                },
            });
        });

        const payload = mockGenerateRecord.mock.calls[0][0] as Record<string, unknown>;
        expect(payload).not.toHaveProperty('doc_number');
        expect(payload).not.toHaveProperty('page_number');
        expect(payload).not.toHaveProperty('client_id');
    });
});
