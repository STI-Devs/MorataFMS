import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocationOfGoodsFormModal } from './LocationOfGoodsFormModal';

describe('LocationOfGoodsFormModal', () => {
    it('submits normalized payload when creating a location of goods', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <LocationOfGoodsFormModal
                isOpen
                onClose={vi.fn()}
                onSubmit={onSubmit}
                mode="create"
            />,
        );

        fireEvent.change(screen.getByLabelText('Location Name *'), {
            target: { value: 'MICP Container Yard' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Add Location' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'MICP Container Yard',
            });
        });
    });

    it('prefills the form when editing a location of goods', () => {
        render(
            <LocationOfGoodsFormModal
                isOpen
                onClose={vi.fn()}
                onSubmit={vi.fn()}
                mode="edit"
                locationOfGoods={{
                    id: 1,
                    name: 'DICT',
                    is_active: true,
                    created_at: '2026-04-15T00:00:00Z',
                    updated_at: '2026-04-15T00:00:00Z',
                }}
            />,
        );

        expect(screen.getByLabelText('Location Name *')).toHaveValue('DICT');
    });
});
