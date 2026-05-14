import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { NotarialGeneratedDocumentsPage } from './NotarialGeneratedDocumentsPage';

const {
    mockUseAuth,
    mockUseLegalCatalog,
    mockUseNotarialGeneratedDocuments,
    mockUseNotarialTemplates,
    mockUseDeleteNotarialGeneratedDocument,
    mockDownloadFile,
    mockDeleteGeneratedDocument,
    mockToastSuccess,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseLegalCatalog: vi.fn(),
    mockUseNotarialGeneratedDocuments: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseDeleteNotarialGeneratedDocument: vi.fn(),
    mockDownloadFile: vi.fn(),
    mockDeleteGeneratedDocument: vi.fn(),
    mockToastSuccess: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: mockToastSuccess,
    },
}));

vi.mock('../../../auth', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../../api/lawFirmApi', () => ({
    lawFirmApi: {
        downloadFile: mockDownloadFile,
    },
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useDeleteNotarialGeneratedDocument: mockUseDeleteNotarialGeneratedDocument,
    useLegalCatalog: mockUseLegalCatalog,
    useNotarialGeneratedDocuments: mockUseNotarialGeneratedDocuments,
    useNotarialTemplates: mockUseNotarialTemplates,
}));

describe('NotarialGeneratedDocumentsPage', () => {
    beforeEach(() => {
        mockDownloadFile.mockReset();
        mockDeleteGeneratedDocument.mockReset();
        mockToastSuccess.mockReset();
        vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
        vi.spyOn(window, 'open').mockImplementation(() => ({
            opener: null,
            document: {
                title: '',
            },
            location: {
                replace: vi.fn(),
            },
            close: vi.fn(),
        } as unknown as Window));
        vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:generated-document-preview');
        vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);

        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                role: 'admin',
            },
        });

        mockUseDeleteNotarialGeneratedDocument.mockReturnValue({
            mutateAsync: mockDeleteGeneratedDocument.mockResolvedValue(undefined),
            isPending: false,
        });

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
        expect(screen.getAllByText('Document').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Client / Party').length).toBeGreaterThan(0);
        expect(screen.getAllByText('File / Last Saved').length).toBeGreaterThan(0);
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getAllByText('Affidavit of Loss').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Affidavits / Oaths').length).toBeGreaterThan(0);
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('maria-affidavit.docx')).toBeInTheDocument();
        expect(screen.queryByText(/pending upload/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/no linked book/i)).not.toBeInTheDocument();
        const actionsButton = screen.getByRole('button', { name: 'Actions for Maria Santos' });
        fireEvent.click(actionsButton);

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

        expect(window.open).toHaveBeenCalledWith('', '_blank');
        expect(window.location.assign).not.toHaveBeenCalled();

        fireEvent.click(actionsButton);
        fireEvent.click(screen.getByRole('button', { name: 'Download' }));

        expect(mockDownloadFile).toHaveBeenCalledWith(
            'https://example.test/maria-affidavit.docx',
            'maria-affidavit.docx',
        );

        fireEvent.click(actionsButton);
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(screen.getByRole('heading', { name: 'Delete Generated Document' })).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete Document' }));

        await waitFor(() => {
            expect(mockDeleteGeneratedDocument).toHaveBeenCalledWith(1);
        });

        expect(mockToastSuccess).toHaveBeenCalledWith('Generated document deleted.');

        await waitFor(() => {
            expect(mockUseNotarialGeneratedDocuments).toHaveBeenCalledWith(expect.objectContaining({
                search: 'Maria',
                document_category: 'affidavit_oath',
                per_page: 50,
            }));
        });
    });
});
