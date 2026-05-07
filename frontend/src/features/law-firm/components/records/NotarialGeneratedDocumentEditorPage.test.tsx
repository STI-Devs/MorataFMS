import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { NotarialGeneratedDocumentEditorPage } from './NotarialGeneratedDocumentEditorPage';

const {
    mockUseNotarialGeneratedDocumentEditorConfig,
    mockDocEditor,
} = vi.hoisted(() => ({
    mockUseNotarialGeneratedDocumentEditorConfig: vi.fn(),
    mockDocEditor: vi.fn(),
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useNotarialGeneratedDocumentEditorConfig: mockUseNotarialGeneratedDocumentEditorConfig,
}));

describe('NotarialGeneratedDocumentEditorPage', () => {
    beforeEach(() => {
        mockDocEditor.mockReset();
        window.DocsAPI = {
            DocEditor: mockDocEditor,
        };

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
