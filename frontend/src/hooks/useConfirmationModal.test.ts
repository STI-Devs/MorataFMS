import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConfirmationModal } from './useConfirmationModal';

describe('useConfirmationModal', () => {
    it('GREEN: openModal sets the props and isOpen; closeModal clears it', () => {
        const { result } = renderHook(() => useConfirmationModal());

        expect(result.current.isOpen).toBe(false);

        act(() => {
            result.current.openModal({
                title: 'Archive?',
                message: 'Move to records?',
                confirmText: 'Archive',
                confirmButtonClass: 'bg-emerald-600',
                onConfirm: vi.fn(),
            });
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.modalProps.title).toBe('Archive?');
        expect(result.current.modalProps.message).toBe('Move to records?');
        expect(result.current.modalProps.confirmText).toBe('Archive');
        expect(result.current.modalProps.confirmButtonClass).toBe('bg-emerald-600');
        expect(result.current.modalProps.onConfirm).toBeTypeOf('function');

        act(() => {
            result.current.closeModal();
        });

        expect(result.current.isOpen).toBe(false);
    });

    it('GREEN: handleConfirm invokes the configured onConfirm', async () => {
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() => useConfirmationModal());

        act(() => {
            result.current.openModal({ title: 'X', message: 'Y', onConfirm });
        });

        await act(async () => {
            await result.current.modalProps.onConfirm();
        });

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
