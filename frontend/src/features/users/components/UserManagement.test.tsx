import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types/user.types';
import { UserManagement } from './UserManagement';

const {
    mockUseAuth,
    mockUseUsers,
    mockUseCreateUser,
    mockUseUpdateUser,
    mockUseDeactivateUser,
    mockUseActivateUser,
    mockUseDeleteUser,
    mockDeactivateUser,
    mockDeleteUser,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseUsers: vi.fn(),
    mockUseCreateUser: vi.fn(),
    mockUseUpdateUser: vi.fn(),
    mockUseDeactivateUser: vi.fn(),
    mockUseActivateUser: vi.fn(),
    mockUseDeleteUser: vi.fn(),
    mockDeactivateUser: vi.fn(),
    mockDeleteUser: vi.fn(),
}));

vi.mock('../../auth/hooks/useAuth', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../hooks/useUsers', () => ({
    useUsers: mockUseUsers,
    useCreateUser: mockUseCreateUser,
    useUpdateUser: mockUseUpdateUser,
    useDeactivateUser: mockUseDeactivateUser,
    useActivateUser: mockUseActivateUser,
    useDeleteUser: mockUseDeleteUser,
}));

const targetUser: User = {
    id: 2,
    name: 'Support Encoder',
    email: 'support.encoder@morata.com',
    job_title: 'Encoder',
    role: 'encoder',
    role_label: 'Encoder',
    is_active: true,
    departments: ['brokerage'],
    multi_department: false,
    permissions: {
        access_brokerage_module: true,
        access_legal_module: false,
        manage_users: false,
        manage_clients: false,
        view_reports: false,
        view_audit_logs: false,
        manage_transaction_oversight: false,
        upload_archives: false,
        view_notarial_books: false,
        manage_notarial_books: false,
        manage_notarial_templates: false,
    },
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
};

describe('UserManagement', () => {
    beforeEach(() => {
        mockDeactivateUser.mockReset();
        mockDeleteUser.mockReset();
        mockDeactivateUser.mockResolvedValue({ message: 'User deactivated successfully.' });
        mockDeleteUser.mockResolvedValue({ message: 'User deleted successfully.' });

        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                role: 'admin',
            },
        });

        mockUseUsers.mockReturnValue({
            data: [targetUser],
            isLoading: false,
            isError: false,
        });

        mockUseCreateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseUpdateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseDeactivateUser.mockReturnValue({ mutateAsync: mockDeactivateUser, isPending: false });
        mockUseActivateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseDeleteUser.mockReturnValue({ mutateAsync: mockDeleteUser, isPending: false });
    });

    it('soft-deletes a user from the admin table through the styled confirmation modal', async () => {
        render(<UserManagement />);

        fireEvent.click(screen.getByTitle('Delete User'));

        expect(screen.getByText('Delete user?')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete Support Encoder?')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Delete user' }));

        await waitFor(() => {
            expect(mockDeleteUser).toHaveBeenCalledWith(2);
        });

        expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument();
    });

    it('does not delete a user when the styled confirmation modal is cancelled', () => {
        render(<UserManagement />);

        fireEvent.click(screen.getByTitle('Delete User'));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(mockDeleteUser).not.toHaveBeenCalled();
        expect(screen.queryByText('Delete user?')).not.toBeInTheDocument();
    });

    it('deactivates a user through the styled confirmation modal', async () => {
        render(<UserManagement />);

        fireEvent.click(screen.getByTitle('Deactivate User'));

        expect(screen.getByText('Deactivate user?')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to deactivate Support Encoder?')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

        await waitFor(() => {
            expect(mockDeactivateUser).toHaveBeenCalledWith(2);
        });
    });
});
