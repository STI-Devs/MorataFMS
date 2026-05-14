import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { resetAuthProviderStateForTests } from './features/auth/context/authProviderState';
import { appRoutes } from './lib/appRoutes';
import { createTestQueryClient } from './test/renderWithProviders';

const { mockGetCurrentUser, mockLogin, mockLogout, mockGetGeneratedDocumentEditorConfig, mockDocEditor } = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockLogin: vi.fn(),
    mockLogout: vi.fn(),
    mockGetGeneratedDocumentEditorConfig: vi.fn(),
    mockDocEditor: vi.fn(),
}));

vi.mock('./features/auth/api/authApi', () => ({
    InvalidCurrentUserPayloadError: class InvalidCurrentUserPayloadError extends Error {
        public constructor(message = 'Invalid current user payload.') {
            super(message);
            this.name = 'InvalidCurrentUserPayloadError';
        }
    },
    authApi: {
        getCurrentUser: mockGetCurrentUser,
        login: mockLogin,
        logout: mockLogout,
    },
}));

vi.mock('./features/law-firm/api/lawFirmApi', () => ({
    lawFirmApi: {
        getGeneratedDocumentEditorConfig: mockGetGeneratedDocumentEditorConfig,
    },
}));

const authenticatedParalegal = {
    id: 7,
    email: 'paralegal@example.test',
    name: 'Paralegal User',
    job_title: 'Paralegal',
    role: 'paralegal',
    role_label: 'Paralegal',
    departments: ['legal'],
    multi_department: false,
    permissions: {
        access_brokerage_module: false,
        access_legal_module: true,
        manage_users: false,
        manage_clients: false,
        view_reports: false,
        view_audit_logs: false,
        manage_transaction_oversight: false,
        upload_archives: true,
        manage_notarial_templates: true,
    },
} as const;

function renderApp(route: string = appRoutes.landing) {
    return render(
        <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={[route]}>
                <App />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('App bootstrap routing', () => {
    beforeEach(() => {
        mockGetCurrentUser.mockReset();
        mockLogin.mockReset();
        mockLogout.mockReset();
        mockGetGeneratedDocumentEditorConfig.mockReset();
        mockDocEditor.mockReset();
        window.DocsAPI = {
            DocEditor: mockDocEditor,
        };
        resetAuthProviderStateForTests();
    });

    it('keeps routes hidden during auth bootstrap before showing service unavailable', async () => {
        let rejectBootstrap!: (error: Error) => void;

        mockGetCurrentUser.mockReturnValue(
            new Promise((_, reject) => {
                rejectBootstrap = reject;
            }),
        );

        renderApp();

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();

        rejectBootstrap(new Error('Backend unavailable'));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Service Unavailable' })).toBeInTheDocument();
        });

        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('opens the generated document editor as a standalone full-screen route', async () => {
        mockGetCurrentUser.mockResolvedValue(authenticatedParalegal);
        mockGetGeneratedDocumentEditorConfig.mockResolvedValue({
            document_server_url: 'http://onlyoffice.test',
            config: {
                documentType: 'word',
                document: {
                    title: 'ichihara-affidavit.docx',
                },
            },
        });

        renderApp('/paralegal/notarial/generated-documents/1/edit');

        await waitFor(() => {
            expect(mockDocEditor).toHaveBeenCalledWith('onlyoffice-generated-document-editor', {
                documentType: 'word',
                document: {
                    title: 'ichihara-affidavit.docx',
                },
            });
        });

        expect(screen.queryByRole('link', { name: 'Back to Generated Documents' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Draft #1' })).toBeInTheDocument();
        expect(screen.queryByText('F.M Morata')).not.toBeInTheDocument();
        expect(screen.queryByText('Main Menu')).not.toBeInTheDocument();
    });
});
