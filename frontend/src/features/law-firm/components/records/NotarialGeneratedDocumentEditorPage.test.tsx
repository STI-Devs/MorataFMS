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
        expect(mockUseNotarialGeneratedDocument).toHaveBeenCalledWith(1);

        await waitFor(() => {
            expect(mockDocEditor).toHaveBeenCalledWith('onlyoffice-generated-document-editor', {
                documentType: 'word',
                document: {
                    title: 'maria-affidavit.docx',
                },
            });
        });
    });
});
