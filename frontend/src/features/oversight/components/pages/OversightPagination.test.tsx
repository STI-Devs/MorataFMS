import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OversightPagination } from './OversightPagination';

describe('OversightPagination', () => {
    it('shows the per-page select with 50/75/100 options and reports changes', async () => {
        const onPageChange = vi.fn();
        const onPerPageChange = vi.fn();

        render(
            <OversightPagination
                currentPage={2}
                totalPages={5}
                perPage={50}
                totalRecords={120}
                onPageChange={onPageChange}
                onPerPageChange={onPerPageChange}
            />,
        );

        expect(screen.getByText('Rows per page')).toBeInTheDocument();
        expect(screen.getByText('Showing 120 transactions')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('combobox'));

        await waitFor(() => {
            expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument();
        });
        expect(screen.getByRole('option', { name: '75' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('option', { name: '75' }));
        expect(onPerPageChange).toHaveBeenCalledWith(75);
        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('disables all navigation buttons when on the only page', () => {
        const onPageChange = vi.fn();

        render(
            <OversightPagination
                currentPage={1}
                totalPages={1}
                perPage={50}
                totalRecords={50}
                onPageChange={onPageChange}
                onPerPageChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
    });

    it('fires page navigation callbacks with the correct page numbers', () => {
        const onPageChange = vi.fn();

        render(
            <OversightPagination
                currentPage={2}
                totalPages={5}
                perPage={50}
                totalRecords={120}
                onPageChange={onPageChange}
                onPerPageChange={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(3);

        fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(1);

        fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(5);

        fireEvent.click(screen.getByRole('button', { name: 'First page' }));
        expect(onPageChange).toHaveBeenLastCalledWith(1);

        expect(onPageChange).toHaveBeenCalledTimes(4);
    });
});
