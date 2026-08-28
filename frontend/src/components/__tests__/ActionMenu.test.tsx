import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionMenu } from '../ActionMenu';

describe('ActionMenu', () => {
    it('GREEN: opens on the trigger and shows only non-hidden items', () => {
        render(
            <ActionMenu
                items={[
                    { label: 'Edit', icon: 'edit', onClick: vi.fn() },
                    { label: 'Delete', icon: 'trash', variant: 'danger', onClick: vi.fn() },
                    { label: 'Secret', icon: 'x', hidden: true, onClick: vi.fn() },
                ]}
            />,
        );

        expect(screen.queryByText('Edit')).not.toBeInTheDocument();

        // Radix DropdownMenu opens on pointer down on the trigger.
        fireEvent.pointerDown(screen.getByTitle('Actions'));

        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.queryByText('Secret')).not.toBeInTheDocument();
    });

    it('GREEN: clicking an item fires its onClick and closes the menu', () => {
        const onEdit = vi.fn();
        render(
            <ActionMenu
                items={[{ label: 'Edit', icon: 'edit', onClick: onEdit }]}
            />,
        );

        fireEvent.pointerDown(screen.getByTitle('Actions'));
        fireEvent.click(screen.getByText('Edit'));

        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('GREEN: Escape closes the menu', () => {
        render(
            <ActionMenu
                items={[{ label: 'Edit', icon: 'edit', onClick: vi.fn() }]}
            />,
        );

        fireEvent.pointerDown(screen.getByTitle('Actions'));
        expect(screen.getByText('Edit')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
});
