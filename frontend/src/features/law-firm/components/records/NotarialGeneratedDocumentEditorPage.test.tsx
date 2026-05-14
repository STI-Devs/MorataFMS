import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { NotarialGeneratedDocumentEditorPage } from './NotarialGeneratedDocumentEditorPage';

const {
    mockUseNotarialGeneratedDocument,
    mockUseNotarialGeneratedDocumentEditorConfig,
    mockDocEditor,
} = vi.hoisted(() => ({
    mockUseNotarialGeneratedDocument: vi.fn(),
    mockUseNotarialGeneratedDocumentEditorConfig: vi.fn(),
    mockDocEditor: vi.fn(),
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useNotarialGeneratedDocument: mockUseNotarialGeneratedDocument,
    useNotarialGeneratedDocumentEditorConfig: mockUseNotarialGeneratedDocumentEditorConfig,
}));

describe('NotarialGeneratedDocumentEditorPage', () => {
    beforeEach(() => {
        mockDocEditor.mockReset();
        mockUseNotarialGeneratedDocument.mockReset();
        mockUseNotarialGeneratedDocumentEditorConfig.mockReset();
        window.DocsAPI = {
            DocEditor: mockDocEditor,
        };

        mockUseNotarialGeneratedDocument.mockReturnValue({
            data: {
                id: 1,
                generated_at: '2026-05-13T14:15:30.000Z',
                updated_at: '2026-05-13T14:15:30.000Z',
                generated_file: {
                    filename: 'maria-affidavit.docx',
                    formatted_size: '15 KB',
                },
            },
            isError: false,
            isFetching: false,
        });

        mockUseNotarialGeneratedDocumentEditorConfig.mockReturnValue({
            data: {
                document_server_url: 'http://onlyoffice.test',
                config: {
                    documentType: 'word',
                    document: {
                        title: 'maria-affidavit.docx',
                    },
                },
            },
            isLoading: false,
            isError: false,
        });
    });

    it('loads the onlyoffice editor with the backend config', async () => {
        renderWithProviders(<NotarialGeneratedDocumentEditorPage />, {
            route: '/paralegal/notarial/generated-documents/1/edit',
            path: appRoutes.paralegalGeneratedDocumentEditor,
        });

        expect(screen.getByRole('heading', { name: 'Draft #1' })).toBeInTheDocument();
        expect(screen.getByText(/App storage saved/i)).toBeInTheDocument();
        expect(screen.getByText('15 KB stored copy')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Back to Generated Documents/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Drag save status badge' })).toBeInTheDocument();
        expect(mockUseNotarialGeneratedDocument).toHaveBeenCalledWith(1, 'notarial');
        expect(mockUseNotarialGeneratedDocumentEditorConfig).toHaveBeenCalledWith(1, 'notarial');

        await waitFor(() => {
            expect(mockDocEditor).toHaveBeenCalledWith('onlyoffice-generated-document-editor', {
                documentType: 'word',
                document: {
                    title: 'maria-affidavit.docx',
                },
            });
        });
    });

    it('uses legal document endpoints on the legal editor route', () => {
        renderWithProviders(<NotarialGeneratedDocumentEditorPage />, {
            route: '/paralegal/legal-files/generated-documents/2/edit',
            path: appRoutes.paralegalLegalGeneratedDocumentEditor,
        });

        expect(mockUseNotarialGeneratedDocument).toHaveBeenCalledWith(2, 'legal');
        expect(mockUseNotarialGeneratedDocumentEditorConfig).toHaveBeenCalledWith(2, 'legal');
    });

    it('shows a clear error when the onlyoffice url points back to this app', async () => {
        window.DocsAPI = undefined;
        mockUseNotarialGeneratedDocumentEditorConfig.mockReturnValue({
            data: {
                document_server_url: window.location.origin,
                config: {
                    documentType: 'word',
                    document: {
                        title: 'maria-affidavit.docx',
                    },
                },
            },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<NotarialGeneratedDocumentEditorPage />, {
            route: '/paralegal/notarial/generated-documents/1/edit',
            path: appRoutes.paralegalGeneratedDocumentEditor,
        });

        await waitFor(() => {
            expect(screen.getByText('Unable to open the editor.')).toBeInTheDocument();
        });

        expect(screen.getByText(/ONLYOFFICE_DOCUMENT_SERVER_URL points to this app/i)).toBeInTheDocument();
        expect(mockDocEditor).not.toHaveBeenCalled();
    });
});
