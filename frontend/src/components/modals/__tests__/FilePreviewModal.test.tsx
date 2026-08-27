import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilePreviewModal } from '../FilePreviewModal';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('FilePreviewModal', () => {
    const stubBlobUrl = () =>
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

    it('GREEN: renders nothing when closed, and an image preview when open', () => {
        const { rerender } = render(
            <FilePreviewModal isOpen={false} onClose={vi.fn()} file={null} />,
        );
        expect(screen.queryByRole('img')).not.toBeInTheDocument();

        stubBlobUrl();
        const img = new File([new Uint8Array(4)], 'photo.png', { type: 'image/png' });
        rerender(
            <FilePreviewModal isOpen onClose={vi.fn()} file={img} fileName="photo.png" />,
        );

        expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument();
    });

    it('GREEN: the X button calls onClose (backdrop outside-close is Radix default, browser-verified)', () => {
        stubBlobUrl();
        const onClose = vi.fn();
        render(
            <FilePreviewModal
                isOpen
                onClose={onClose}
                file={new File([new Uint8Array(4)], 'a.png', { type: 'image/png' })}
                fileName="a.png"
            />,
        );

        fireEvent.click(screen.getAllByRole('button').at(-1) as HTMLElement);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('GREEN: the download button calls onDownload', () => {
        stubBlobUrl();
        const onDownload = vi.fn();
        render(
            <FilePreviewModal
                isOpen
                onClose={vi.fn()}
                onDownload={onDownload}
                file={new File([new Uint8Array(4)], 'a.png', { type: 'image/png' })}
                fileName="a.png"
            />,
        );

        fireEvent.click(screen.getByTitle('Download file'));
        expect(onDownload).toHaveBeenCalledTimes(1);
    });

    it('GREEN: a local office file shows the unsupported fallback with Download', () => {
        stubBlobUrl();
        const onDownload = vi.fn();
        const { container } = render(
            <FilePreviewModal
                isOpen
                onClose={vi.fn()}
                onDownload={onDownload}
                file={new File([new Uint8Array(4)], 'report.docx')}
                fileName="report.docx"
            />,
        );

        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByText('Preview not available')).toBeInTheDocument();
        expect(screen.getByText('Download to view')).toBeInTheDocument();
    });

    it('GREEN: a remote PDF renders an iframe viewer', () => {
        render(
            <FilePreviewModal
                isOpen
                onClose={vi.fn()}
                file="https://example.com/file.pdf"
                fileName="file.pdf"
            />,
        );

        const iframe = document.querySelector('iframe[title="Document Preview"]');
        expect(iframe).not.toBeNull();
    });
});
