import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    MAX_MULTI_UPLOAD_FILES,
} from '../../../lib/uploads';
import { UploadModal } from '../UploadModal';

const makeFile = (name: string, size = 4) =>
    new File([new Uint8Array(size)], name, { type: 'application/pdf' });

describe('UploadModal', () => {
    it('GREEN: renders nothing when closed and the title + dropzone when open', () => {
        const { rerender } = render(
            <UploadModal isOpen={false} onClose={vi.fn()} onUpload={vi.fn()} title="BL-001" />,
        );
        expect(screen.queryByText('BL-001')).not.toBeInTheDocument();

        rerender(
            <UploadModal isOpen onClose={vi.fn()} onUpload={vi.fn()} title="BL-001" />,
        );
        expect(screen.getByText(/BL-001/)).toBeInTheDocument();
        expect(screen.getByText('Click or drag & drop files')).toBeInTheDocument();
    });

    it('GREEN: backdrop click does NOT close (locks current behavior for the Radix migration)', () => {
        const onClose = vi.fn();
        render(
            <UploadModal isOpen onClose={onClose} onUpload={vi.fn()} title="BL-001" />,
        );

        // Radix renders the overlay in a portal; outside-clicks are suppressed by the modal.
        const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
        expect(overlay).not.toBeNull();

        fireEvent.pointerDown(overlay);
        fireEvent.click(overlay);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('GREEN: the header X button calls onClose', () => {
        const onClose = vi.fn();
        render(
            <UploadModal isOpen onClose={onClose} onUpload={vi.fn()} title="BL-001" />,
        );

        const buttons = screen.getAllByRole('button');
        const closeButton = buttons[0]; // header X is the first button
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('GREEN: selecting files enables Upload and fires onUpload with them', async () => {
        const onUpload = vi.fn().mockResolvedValue(undefined);
        render(
            <UploadModal isOpen onClose={vi.fn()} onUpload={onUpload} title="BL-001" />,
        );

        const file = makeFile('a.pdf');
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input).not.toBeNull();

        fireEvent.change(input, { target: { files: [file] } });

        const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
        expect(uploadButton).toBeEnabled();

        fireEvent.click(uploadButton);
        expect(onUpload).toHaveBeenCalledTimes(1);
        expect(onUpload).toHaveBeenCalledWith([file]);
    });

    it('GREEN: renders the errorMessage banner when provided', () => {
        render(
            <UploadModal
                isOpen
                onClose={vi.fn()}
                onUpload={vi.fn()}
                title="BL-001"
                errorMessage="Upload failed for BL-001"
            />,
        );

        expect(screen.getByText('Upload failed for BL-001')).toBeInTheDocument();
        // nothing selected -> upload stays disabled
        expect(screen.getByRole('button', { name: 'Upload Document' })).toBeDisabled();
    });

    it('GREEN: selecting more than the file cap shows the max-files error', () => {
        render(
            <UploadModal isOpen onClose={vi.fn()} onUpload={vi.fn()} title="BL-001" />,
        );

        const files = Array.from({ length: MAX_MULTI_UPLOAD_FILES + 1 }, (_, i) =>
            makeFile(`f${i}.pdf`),
        );
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(input, { target: { files } });

        expect(
            screen.getByText(`${MAX_MULTI_UPLOAD_FILES + 1} files selected`),
        ).toBeInTheDocument();
        // the max-files error is the banner ABOVE the list (screen-level), not inside the header
        expect(
            screen.getByText('You can upload up to 10 files at a time.'),
        ).toBeInTheDocument();
    });
});
