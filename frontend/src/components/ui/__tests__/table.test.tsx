import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../table';

describe('Table primitive', () => {
    const renderTable = (tableClassName?: string) =>
        render(
            <Table className={tableClassName}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Col A</TableHead>
                        <TableHead>Col B</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>a</TableCell>
                        <TableCell>b</TableCell>
                    </TableRow>
                </TableBody>
            </Table>,
        );

    it('GREEN: wraps the table in a horizontal scroll container', () => {
        const { container } = renderTable();

        const wrapper = container.querySelector('[data-slot="table-container"]');
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveClass('relative', 'w-full', 'overflow-x-auto');

        const table = container.querySelector('[data-slot="table"]');
        expect(table).not.toBeNull();
        expect(table?.tagName).toBe('TABLE');
    });

    it('GREEN: exposes table/row/columnheader roles', () => {
        renderTable();

        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Col A' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Col B' })).toBeInTheDocument();
        // one header row + one body row
        expect(screen.getAllByRole('row')).toHaveLength(2);
    });

    it('GREEN: a custom min-width lands on the inner <table>, not the scroll wrapper', () => {
        const { container } = renderTable('min-w-xl');

        const wrapper = container.querySelector('[data-slot="table-container"]');
        expect(wrapper).not.toHaveClass('min-w-xl');

        const table = container.querySelector('[data-slot="table"]');
        expect(table).toHaveClass('min-w-xl');
    });
});
