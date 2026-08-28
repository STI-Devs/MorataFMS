import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationModal } from '../ConfirmationModal';

describe('ConfirmationModal', () => {
    const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        title: 'Delete record?',
        message: 'This cannot be undone.',
    };

    it('GREEN: renders title + message; Cancel calls onClose, Confirm calls onConfirm', () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        render(<ConfirmationModal {...baseProps} onClose={onClose} onConfirm={onConfirm} />);

        expect(screen.getByText('Delete record?')).toBeInTheDocument();
        expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('GREEN: Confirm awaits onConfirm BEFORE closing (async-ordering lock for the AlertDialog migration)', async () => {
        const onClose = vi.fn();
        let resolveConfirm: (() => void) | undefined;
        const onConfirm = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveConfirm = resolve;
                }),
        );

        render(<ConfirmationModal {...baseProps} onClose={onClose} onConfirm={onConfirm} />);

        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
        // Processing... state, confirm disabled
        expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();

        await act(async () => {
            resolveConfirm?.();
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('GREEN: hideCancel renders only the confirm button', () => {
        render(<ConfirmationModal {...baseProps} hideCancel />);

        expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
});
