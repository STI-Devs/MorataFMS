import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { resetAuthProviderStateForTests } from './authProviderState';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth.types';

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

describe('AuthProvider', () => {
    beforeEach(() => {
        mockGetCurrentUser.mockReset();
        mockLogin.mockReset();
        mockLogout.mockReset();
        resetAuthProviderStateForTests();
    });

    it('restores the authenticated user from the backend during auth bootstrap', async () => {
        mockGetCurrentUser.mockResolvedValue(authenticatedUser);

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

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

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

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

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

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

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        });

        expect(screen.getByTestId('name')).toHaveTextContent(authenticatedUser.name);
    });

    it('clears auth state when logout fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        mockGetCurrentUser.mockResolvedValue(authenticatedUser);
        mockLogout.mockRejectedValue(new Error('Network failure'));

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        });

        fireEvent.click(screen.getByText('Logout'));

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('name')).toHaveTextContent('none');

        consoleErrorSpy.mockRestore();
    });
});
