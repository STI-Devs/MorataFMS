import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { resetAuthProviderStateForTests } from './authProviderState';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth.types';
import { createTestQueryClient } from '../../../test/renderWithProviders';

const { mockGetCurrentUser, mockLogin, mockLogout } = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockLogin: vi.fn(),
    mockLogout: vi.fn(),
}));

vi.mock('../api/authApi', () => ({
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

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

const authenticatedUser: User = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    job_title: 'Administrator',
    role: 'admin',
    role_label: 'Admin',
    departments: ['brokerage', 'legal'],
    multi_department: true,
    permissions: {
        access_brokerage_module: true,
        access_legal_module: true,
        manage_users: true,
        manage_clients: true,
        view_reports: true,
        view_audit_logs: true,
        manage_transaction_oversight: true,
        upload_archives: true,
        manage_notarial_books: true,
        manage_notarial_entries: true,
    },
};

function AuthProbe() {
    const { isLoading, isAuthenticated, login, logout, user } = useAuth();

    return (
        <div>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="authenticated">{String(isAuthenticated)}</span>
            <span data-testid="name">{user?.name ?? 'none'}</span>
            <button
                type="button"
                onClick={() => void login({ email: authenticatedUser.email, password: 'password' })}
            >
                Login
            </button>
            <button type="button" onClick={() => void logout()}>
                Logout
            </button>
        </div>
    );
}

function renderAuthProvider() {
    const queryClient = createTestQueryClient();

    render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        </QueryClientProvider>,
    );

    return queryClient;
}

describe('AuthProvider', () => {
    beforeEach(() => {
        mockGetCurrentUser.mockReset();
        mockLogin.mockReset();
        mockLogout.mockReset();
        resetAuthProviderStateForTests();
    });

    it('restores the authenticated user from the backend during auth bootstrap', async () => {
        mockGetCurrentUser.mockResolvedValue(authenticatedUser);

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('name')).toHaveTextContent(authenticatedUser.name);
    });

    it('treats unauthenticated bootstrap responses as a guest session', async () => {
        mockGetCurrentUser.mockRejectedValue({
            response: {
                status: 401,
            },
        });

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('name')).toHaveTextContent('none');
    });

    it('treats invalid current user payloads as a guest session', async () => {
        mockGetCurrentUser.mockRejectedValue(
            Object.assign(new Error('Invalid current user payload.'), {
                name: 'InvalidCurrentUserPayloadError',
            }),
        );

        renderAuthProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    it('sets the authenticated user after a successful login', async () => {
        mockGetCurrentUser.mockResolvedValue(null);
        mockLogin.mockResolvedValue({
            user: authenticatedUser,
        });

        const queryClient = renderAuthProvider();
        const clearSpy = vi.spyOn(queryClient, 'clear');

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        });

        expect(screen.getByTestId('name')).toHaveTextContent(authenticatedUser.name);
        expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it('clears auth state when logout fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        mockGetCurrentUser.mockResolvedValue(authenticatedUser);
        mockLogout.mockRejectedValue(new Error('Network failure'));

        const queryClient = renderAuthProvider();
        const clearSpy = vi.spyOn(queryClient, 'clear');

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        });

        fireEvent.click(screen.getByText('Logout'));

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('name')).toHaveTextContent('none');
        expect(clearSpy).toHaveBeenCalledTimes(1);

        consoleErrorSpy.mockRestore();
    });

    it('clears cached queries when an authenticated session becomes unauthorized', async () => {
        mockGetCurrentUser.mockResolvedValue(authenticatedUser);

        const queryClient = renderAuthProvider();
        const clearSpy = vi.spyOn(queryClient, 'clear');

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        });

        window.dispatchEvent(new Event('auth:unauthorized'));

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        });

        expect(clearSpy).toHaveBeenCalledTimes(1);
    });
});
