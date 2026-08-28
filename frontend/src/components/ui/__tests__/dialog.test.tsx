import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '../dialog';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '../sheet';

describe('Dialog primitive', () => {
    it('GREEN: opens on trigger and closes on Escape', () => {
        render(
            <Dialog>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Hello</DialogTitle>
                </DialogContent>
            </Dialog>,
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Open' }));

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveTextContent('Hello');

        fireEvent.keyDown(dialog, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('GREEN: the built-in close button unmounts the dialog', () => {
        render(
            <Dialog>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Hello</DialogTitle>
                </DialogContent>
            </Dialog>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('RED now -> flips green in Phase 1 (height guard on DialogContent)', () => {
        render(
            <Dialog open>
                <DialogContent>
                    <DialogTitle>t</DialogTitle>
                </DialogContent>
            </Dialog>,
        );

        const content = screen.getByRole('dialog');
        expect(content).toHaveClass('max-h-[calc(100svh-2rem)]');
        expect(content).toHaveClass('overflow-y-auto');
        expect(content).toHaveClass('overscroll-contain');
    });
});

describe('Sheet primitive', () => {
    it('GREEN: right-side SheetContent uses the mobile-drawer sizing convention', () => {
        render(
            <Sheet>
                <SheetTrigger>Open</SheetTrigger>
                <SheetContent side="right">
                    <SheetTitle>Menu</SheetTitle>
                </SheetContent>
            </Sheet>,
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Open' }));

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveClass('w-3/4');
        expect(dialog).toHaveClass('sm:max-w-sm');
        expect(dialog).toHaveTextContent('Menu');
    });
});
