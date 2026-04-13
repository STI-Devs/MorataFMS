import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StageUploadRow } from './StageUploadRow';

describe('StageUploadRow', () => {
    it('appends newly selected files instead of replacing existing ones', () => {
        const onChange = vi.fn();

        render(
            <StageUploadRow
                stageKey="boc"
                label="BOC Processing"
                upload={{
                    files: [
                        new File(['first'], 'existing.pdf', { type: 'application/pdf' }),
                    ],
                    notApplicable: false,
                }}
                onChange={onChange}
            />,
        );

        const input = document.getElementById('stage-file-boc') as HTMLInputElement;
        const nextFile = new File(['second'], 'new.pdf', { type: 'application/pdf' });

        fireEvent.change(input, {
            target: {
                files: [nextFile],
            },
        });

        expect(onChange).toHaveBeenCalledWith({
            files: [
                expect.objectContaining({ name: 'existing.pdf' }),
                expect.objectContaining({ name: 'new.pdf' }),
            ],
            notApplicable: false,
        });
    });
});
