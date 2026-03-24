import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth.types';

const { mockGetCurrentUser, mockLogin, mockLogout } = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockLogin: vi.fn(),
    mockLogout: vi.fn(),
}));

vi.mock('../api/authApi', () => ({
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
    const { isLoading, isAuthenticated, user } = useAuth();

    return (
        <div>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="authenticated">{String(isAuthenticated)}</span>
            <span data-testid="name">{user?.name ?? 'none'}</span>
        </div>
    );
}

describe('AuthProvider', () => {
    it('restores the authenticated user from the backend session on mount', async () => {
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
});
