import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

const defaultProps = {
    currentPage: 3,
    totalPages: 20,
    perPage: 10,
    onPageChange: vi.fn(),
    onPerPageChange: vi.fn(),
};

describe('Pagination', () => {
    it('GREEN: renders prev/next, page numbers with ellipses, and fires page change', () => {
        const onPageChange = vi.fn();
        render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

        expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
        expect(screen.getByText('of 20 pages')).toBeInTheDocument();

        // windowing for currentPage=3, totalPages=20 → 1 2 3 4 … 20 (one ellipsis, rendered as "...")
        expect(screen.getAllByText('...')).toHaveLength(1);
        expect(screen.getByRole('button', { name: '3' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: '4' }));
        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('GREEN: disables prev at first page and next at last page', () => {
        const { rerender } = render(
            <Pagination {...defaultProps} currentPage={1} />,
        );
        expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

        rerender(<Pagination {...defaultProps} currentPage={20} />);
        expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('RED now -> flips green in Phase 1 (non-compact stacks on mobile)', () => {
        const { container } = render(<Pagination {...defaultProps} />);
        const root = container.firstChild as HTMLElement;

        expect(root).toHaveClass('flex-col');
        expect(root).toHaveClass('sm:flex-row');
        expect(root).toHaveClass('sm:items-center');
    });

    it('GREEN: compact variant already stacks on mobile (must not regress)', () => {
        const { container } = render(<Pagination {...defaultProps} compact />);
        const root = container.firstChild as HTMLElement;

        expect(root).toHaveClass('flex-col');
        expect(root).toHaveClass('sm:flex-row');
    });

    it('GREEN: per-page select calls onPerPageChange', () => {
        const onPerPageChange = vi.fn();
        render(<Pagination {...defaultProps} onPerPageChange={onPerPageChange} />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: '25' } });
        expect(onPerPageChange).toHaveBeenCalledWith(25);
    });
});
