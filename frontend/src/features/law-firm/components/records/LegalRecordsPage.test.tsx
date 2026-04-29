import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LegalRecordsPage } from './LegalRecordsPage';

const {
    mockUseLegalCatalog,
    mockUseLegalBooks,
    mockUseNotarialTemplateRecords,
    mockUseNotarialTemplates,
} = vi.hoisted(() => ({
    mockUseLegalCatalog: vi.fn(),
    mockUseLegalBooks: vi.fn(),
    mockUseNotarialTemplateRecords: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalCatalog: mockUseLegalCatalog,
    useLegalBooks: mockUseLegalBooks,
    useNotarialTemplateRecords: mockUseNotarialTemplateRecords,
    useNotarialTemplates: mockUseNotarialTemplates,
}));

describe('LegalRecordsPage', () => {
    beforeEach(() => {
        mockUseLegalCatalog.mockReturnValue({
            data: {
                notarial_act_types: [
                    { code: 'jurat', label: 'Jurat' },
                    { code: 'acknowledgment', label: 'Acknowledgment' },
                ],
                categories: [
                    {
                        code: 'affidavit_oath',
                        label: 'Affidavits / Oaths',
                        description: 'Affidavit templates.',
                    },
                ],
                document_types: [],
                grouped_document_types: [],
                template_field_types: [],
                legal_file_categories: [],
                legal_file_types: [],
                grouped_legal_file_types: [],
            },
        });

        mockUseLegalBooks.mockReturnValue({
            data: {
                data: [
                    {
                        id: 44,
                        book_number: 18,
                        year: 2026,
                        status: 'active',
                        generated_record_count: 8,
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
                data: [],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 1,
                    total: 3,
                },
            },
        });

        mockUseNotarialTemplateRecords.mockReturnValue({
            data: {
                data: [
                    {
                        id: 1,
                        template_code: 'affidavit-loss-master',
                        template_label: 'Affidavit of Loss',
                        document_code: 'AFFIDAVIT_LOSS',
                        document_code_label: 'Affidavit of Loss',
                        document_category: 'affidavit_oath',
                        document_category_label: 'Affidavits / Oaths',
                        notarial_act_type: 'jurat',
                        notarial_act_type_label: 'Jurat',
                        party_name: 'Maria Santos',
                        template_data: {},
                        notes: 'Generated sample note',
                        generated_at: '2026-04-24T02:15:00.000Z',
                        generated_file: {
                            filename: 'maria-affidavit.docx',
                            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            size_bytes: 1024,
                            formatted_size: '1 KB',
                            download_url: 'https://example.test/maria-affidavit.docx',
                        },
                        book: {
                            id: 44,
                            book_number: 18,
                            year: 2026,
                            status: 'active',
                        },
                        created_by: {
                            id: 10,
                            name: 'Paralegal User',
                        },
                        created_at: '2026-04-24T02:15:00.000Z',
                        updated_at: '2026-04-24T02:15:00.000Z',
                    },
                ],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 12,
                    total: 1,
                },
            },
        });
    });

    it('renders generated template records and sends filter changes through the template-record hook', async () => {
        renderWithProviders(<LegalRecordsPage />, {
            route: appRoutes.paralegalRecords,
            path: appRoutes.paralegalRecords,
        });

        const searchInput = screen.getByPlaceholderText('Search template, party, or file...');
        const categoryFilter = document.getElementById('generated-records-category-filter') as HTMLSelectElement;
        const bookFilter = document.getElementById('generated-records-book-filter') as HTMLSelectElement;
        const actTypeFilter = document.getElementById('generated-records-act-type-filter') as HTMLSelectElement;
        const perPageFilter = document.getElementById('generated-records-per-page') as HTMLSelectElement;

        fireEvent.change(searchInput, {
            target: { value: 'Maria' },
        });
        fireEvent.change(categoryFilter, {
            target: { value: 'affidavit_oath' },
        });
        fireEvent.change(bookFilter, {
            target: { value: '44' },
        });
        fireEvent.change(actTypeFilter, {
            target: { value: 'jurat' },
        });
        fireEvent.change(perPageFilter, {
            target: { value: '50' },
        });

        expect(searchInput).toHaveValue('Maria');
        expect(categoryFilter).toHaveValue('affidavit_oath');
        expect(bookFilter).toHaveValue('44');
        expect(actTypeFilter).toHaveValue('jurat');
        expect(perPageFilter).toHaveValue('50');
        expect(screen.getByText('Generated Notarial Records')).toBeInTheDocument();
        expect(screen.getAllByText('Affidavit of Loss')).toHaveLength(2);
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getAllByText('Book 18')).toHaveLength(2);
        expect(screen.getByText('maria-affidavit.docx')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('href', 'https://example.test/maria-affidavit.docx');
        expect(screen.queryByText(/pending upload/i)).not.toBeInTheDocument();

        await waitFor(() => {
            expect(mockUseNotarialTemplateRecords).toHaveBeenCalledWith(expect.objectContaining({
                search: 'Maria',
                document_category: 'affidavit_oath',
                notarial_act_type: 'jurat',
                book_id: 44,
                per_page: 50,
            }));
        });
    });
});
