import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../select';

describe('Select primitive', () => {
    it('GREEN: exposes a combobox that opens options and fires onValueChange', async () => {
        const onValueChange = vi.fn();
        render(
            <Select onValueChange={onValueChange}>
                <SelectTrigger aria-label="Pick one">
                    <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="a">Alpha</SelectItem>
                    <SelectItem value="b">Beta</SelectItem>
                </SelectContent>
            </Select>,
        );

        const trigger = screen.getByRole('combobox');
        expect(trigger).toBeInTheDocument();

        // Radix Select opens on keyboard interaction when the trigger is focused.
        trigger.focus();
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });

        const option = await screen.findByRole('option', { name: 'Alpha' });
        expect(option).toBeInTheDocument();

        fireEvent.click(option);
        expect(onValueChange).toHaveBeenCalledWith('a');
        expect(trigger).toHaveTextContent('Alpha');
    });
});
