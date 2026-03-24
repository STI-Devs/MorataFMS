import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocumentPreview } from './useDocumentPreview';

const { mockDownloadDocument, mockGetDocumentPreviewUrl } = vi.hoisted(() => ({
    mockDownloadDocument: vi.fn(),
    mockGetDocumentPreviewUrl: vi.fn(),
}));

vi.mock('../api/trackingApi', () => ({
    trackingApi: {
        downloadDocument: mockDownloadDocument,
        getDocumentPreviewUrl: mockGetDocumentPreviewUrl,
    },
}));

const baseDocument = {
    id: 10,
    type: 'invoice',
    filename: 'shipment.pdf',
    size_bytes: 1024,
    formatted_size: '1 KB',
    version: 1,
    download_url: '/api/documents/10/download',
    uploaded_by: null,
    created_at: '2026-03-24T00:00:00Z',
    updated_at: '2026-03-24T00:00:00Z',
};

describe('useDocumentPreview', () => {
    beforeEach(() => {
        mockDownloadDocument.mockReset();
        mockGetDocumentPreviewUrl.mockReset();
    });

    it('downloads office documents instead of sending them to a third-party preview', async () => {
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
        const { result } = renderHook(() => useDocumentPreview());

        await result.current.handlePreviewDoc({
            ...baseDocument,
            filename: 'manifest.docx',
        });

        expect(mockDownloadDocument).toHaveBeenCalledWith(baseDocument.id, 'manifest.docx');
        expect(mockGetDocumentPreviewUrl).not.toHaveBeenCalled();
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('opens browser-safe previews in a detached tab', async () => {
        const replace = vi.fn();
        const newTab = {
            opener: 'initial-opener',
            location: { replace },
            close: vi.fn(),
        };

        vi.spyOn(window, 'open').mockReturnValue(newTab as unknown as Window);
        mockGetDocumentPreviewUrl.mockResolvedValue('https://example.com/preview.pdf');

        const { result } = renderHook(() => useDocumentPreview());

        await result.current.handlePreviewDoc(baseDocument);

        expect(mockGetDocumentPreviewUrl).toHaveBeenCalledWith(baseDocument.id);
        expect(mockDownloadDocument).not.toHaveBeenCalled();
        expect(newTab.opener).toBeNull();
        expect(replace).toHaveBeenCalledWith('https://example.com/preview.pdf');
    });

    it('falls back to download when preview loading fails', async () => {
        const close = vi.fn();
        const newTab = {
            opener: 'initial-opener',
            location: { replace: vi.fn() },
            close,
        };

        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(window, 'open').mockReturnValue(newTab as unknown as Window);
        mockGetDocumentPreviewUrl.mockRejectedValue(new Error('preview failed'));

        const { result } = renderHook(() => useDocumentPreview());

        await result.current.handlePreviewDoc(baseDocument);

        expect(close).toHaveBeenCalledTimes(1);
        expect(mockDownloadDocument).toHaveBeenCalledWith(baseDocument.id, baseDocument.filename);
    });
});
