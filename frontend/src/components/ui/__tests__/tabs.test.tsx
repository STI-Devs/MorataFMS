import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';

describe('Tabs primitive', () => {
    const renderTabs = () =>
        render(
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">Tab A</TabsTrigger>
                    <TabsTrigger value="b">Tab B</TabsTrigger>
                    <TabsTrigger value="c">Tab C</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
                <TabsContent value="b">Content B</TabsContent>
                <TabsContent value="c">Content C</TabsContent>
            </Tabs>,
        );

    it('GREEN: exposes tablist/tab roles and switches content on click', async () => {
        renderTabs();

        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Tab A' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Tab B' })).toBeInTheDocument();

        // Radix Tabs unmounts inactive panels, so only the active content is in the DOM.
        expect(screen.getByText('Content A')).toBeInTheDocument();
        expect(screen.queryByText('Content B')).not.toBeInTheDocument();

        // Radix Tabs: arrow-key navigation activates the next tab (automatic activation mode).
        const tabA = screen.getByRole('tab', { name: 'Tab A' });
        tabA.focus();
        fireEvent.keyDown(tabA, { key: 'ArrowRight' });

        expect(await screen.findByText('Content B')).toBeInTheDocument();
        expect(screen.queryByText('Content A')).not.toBeInTheDocument();
    });

    it('RED now -> flips green in Phase 1 (TabsList overflow handling)', () => {
        renderTabs();

        const list = screen.getByRole('tablist');
        expect(list).toHaveClass('max-w-full');
        expect(list).toHaveClass('overflow-x-auto');
        expect(list).toHaveClass('no-scrollbar');
    });
});
