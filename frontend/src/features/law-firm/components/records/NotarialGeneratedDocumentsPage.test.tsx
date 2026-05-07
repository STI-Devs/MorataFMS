import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { NotarialGeneratedDocumentsPage } from './NotarialGeneratedDocumentsPage';

const {
    mockUseLegalCatalog,
    mockUseNotarialGeneratedDocuments,
    mockUseNotarialTemplates,
    mockDownloadFile,
} = vi.hoisted(() => ({
    mockUseLegalCatalog: vi.fn(),
    mockUseNotarialGeneratedDocuments: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockDownloadFile: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../api/lawFirmApi', () => ({
    lawFirmApi: {
        downloadFile: mockDownloadFile,
    },
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalCatalog: mockUseLegalCatalog,
    useNotarialGeneratedDocuments: mockUseNotarialGeneratedDocuments,
    useNotarialTemplates: mockUseNotarialTemplates,
}));

describe('NotarialGeneratedDocumentsPage', () => {
    beforeEach(() => {
        mockDownloadFile.mockReset();

        mockUseLegalCatalog.mockReturnValue({
            data: {
                notarial_act_types: [],
                categories: [
                    {
                        code: 'affidavit_oath',
                        label: 'Affidavits / Oaths',
                        description: 'Affidavit templates.',
                    },
                ],
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
                    per_page: 1,
                    total: 3,
                },
            },
        });

        mockUseNotarialGeneratedDocuments.mockReturnValue({
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
                        party_name: 'Maria Santos',
                        notes: 'Generated sample note',
                        generated_at: '2026-04-24T02:15:00.000Z',
                        generated_file: {
                            filename: 'maria-affidavit.docx',
                            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            size_bytes: 1024,
                            formatted_size: '1 KB',
                            download_url: 'https://example.test/maria-affidavit.docx',
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

    it('renders generated document outputs and sends compact filter changes through the generated-document hook', async () => {
        renderWithProviders(<NotarialGeneratedDocumentsPage />, {
            route: appRoutes.paralegalGeneratedDocuments,
            path: appRoutes.paralegalGeneratedDocuments,
        });

        const searchInput = screen.getByPlaceholderText('Search master, party, or file...');
        const categoryFilter = document.getElementById('generated-documents-category-filter') as HTMLSelectElement;
        const perPageFilter = document.getElementById('generated-documents-per-page') as HTMLSelectElement;

        fireEvent.change(searchInput, {
            target: { value: 'Maria' },
        });
        fireEvent.change(categoryFilter, {
            target: { value: 'affidavit_oath' },
        });
        fireEvent.change(perPageFilter, {
            target: { value: '50' },
        });

        expect(searchInput).toHaveValue('Maria');
        expect(categoryFilter).toHaveValue('affidavit_oath');
        expect(perPageFilter).toHaveValue('50');
        expect(screen.getByRole('heading', { name: 'Generated Documents' })).toBeInTheDocument();
        expect(screen.getAllByText('Affidavit of Loss').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Affidavits / Oaths').length).toBeGreaterThan(0);
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('maria-affidavit.docx')).toBeInTheDocument();
        expect(screen.queryByText(/pending upload/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/no linked book/i)).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
            'href',
            '/paralegal/notarial/generated-documents/1/edit',
        );

        fireEvent.click(screen.getByRole('button', { name: 'Download' }));

        expect(mockDownloadFile).toHaveBeenCalledWith(
            'https://example.test/maria-affidavit.docx',
            'maria-affidavit.docx',
        );

        await waitFor(() => {
            expect(mockUseNotarialGeneratedDocuments).toHaveBeenCalledWith(expect.objectContaining({
                search: 'Maria',
                document_category: 'affidavit_oath',
                per_page: 50,
            }));
        });
    });
});
