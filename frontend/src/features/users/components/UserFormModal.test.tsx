import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserFormModal } from './UserFormModal';

describe('UserFormModal', () => {
    it('submits password confirmation when creating a user', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserFormModal
                isOpen
                onClose={vi.fn()}
                onSubmit={onSubmit}
                mode="create"
            />,
        );

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Ichihara' },
        });
        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'ichihara@morata.com' },
        });
        fireEvent.change(screen.getByLabelText('Job Title'), {
            target: { value: 'Developer' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText('Confirm Password'), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Ichihara',
                email: 'ichihara@morata.com',
                job_title: 'Developer',
                password: 'password123',
                password_confirmation: 'password123',
                role: 'encoder',
            });
        });
    });

    it('shows a local error and blocks submit when passwords do not match', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserFormModal
                isOpen
                onClose={vi.fn()}
                onSubmit={onSubmit}
                mode="create"
            />,
        );

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Ichihara' },
        });
        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'ichihara@morata.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText('Confirm Password'), {
            target: { value: 'password124' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

        await waitFor(() => {
            expect(screen.getByText('Password confirmation does not match.')).toBeInTheDocument();
        });

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
