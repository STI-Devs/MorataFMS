import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CountryFormModal } from './CountryFormModal';

describe('CountryFormModal', () => {
    it('submits normalized payload when creating a country', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <CountryFormModal
                isOpen
                onClose={vi.fn()}
                onSubmit={onSubmit}
                mode="create"
            />,
        );

        fireEvent.change(screen.getByLabelText('Country Name *'), {
            target: { value: 'Philippines' },
        });
        fireEvent.change(screen.getByLabelText('Country Code'), {
            target: { value: 'ph' },
        });
        fireEvent.change(screen.getByLabelText('Country Usage *'), {
            target: { value: 'export_destination' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Add Country' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Philippines',
                code: 'PH',
                type: 'export_destination',
            });
        });
    });

    it('prefills the form when editing a country', () => {
        render(
            <CountryFormModal
                isOpen
                onClose={vi.fn()}
                onSubmit={vi.fn()}
                mode="edit"
                country={{
                    id: 4,
                    name: 'Japan',
                    code: 'JP',
                    type: 'both',
                    type_label: 'Both',
                    is_active: true,
                    created_at: '2026-04-15T00:00:00Z',
                    updated_at: '2026-04-15T00:00:00Z',
                }}
            />,
        );

        expect(screen.getByLabelText('Country Name *')).toHaveValue('Japan');
        expect(screen.getByLabelText('Country Code')).toHaveValue('JP');
        expect(screen.getByLabelText('Country Usage *')).toHaveValue('both');
    });
});
