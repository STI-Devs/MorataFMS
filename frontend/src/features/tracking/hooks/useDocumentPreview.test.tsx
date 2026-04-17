import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocumentPreview } from './useDocumentPreview';

const {
    mockDownloadDocument,
    mockPreviewDocument,
    mockCreateObjectURL,
    mockRevokeObjectURL,
} = vi.hoisted(() => ({
    mockDownloadDocument: vi.fn(),
    mockPreviewDocument: vi.fn(async () => new Blob(['preview'], { type: 'application/pdf' })),
    mockCreateObjectURL: vi.fn(() => 'blob:preview-url'),
    mockRevokeObjectURL: vi.fn(),
}));

vi.mock('../api/trackingApi', () => ({
    trackingApi: {
        downloadDocument: mockDownloadDocument,
        previewDocument: mockPreviewDocument,
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
        mockPreviewDocument.mockClear();
        mockCreateObjectURL.mockClear();
        mockRevokeObjectURL.mockClear();
        vi.stubGlobal('URL', {
            createObjectURL: mockCreateObjectURL,
            revokeObjectURL: mockRevokeObjectURL,
        });
    });

    it('downloads office documents instead of sending them to a third-party preview', async () => {
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
        const { result } = renderHook(() => useDocumentPreview());

        await result.current.handlePreviewDoc({
            ...baseDocument,
            filename: 'manifest.docx',
        });

        expect(mockDownloadDocument).toHaveBeenCalledWith(baseDocument.id, 'manifest.docx');
        expect(mockPreviewDocument).not.toHaveBeenCalled();
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('opens browser-safe previews through an authenticated blob URL', async () => {
        const pendingTab = {
            opener: 'initial-opener',
            document: { title: '' },
            location: { replace: vi.fn() },
            close: vi.fn(),
        };

        vi.spyOn(window, 'open').mockReturnValue(pendingTab as unknown as Window);
        vi.spyOn(window, 'setTimeout').mockImplementation(((callback: TimerHandler) => {
            if (typeof callback === 'function') {
                callback();
            }

            return 1;
        }) as typeof window.setTimeout);

        const { result } = renderHook(() => useDocumentPreview());

        await result.current.handlePreviewDoc(baseDocument);

        expect(mockPreviewDocument).toHaveBeenCalledWith(baseDocument.id);
        expect(mockDownloadDocument).not.toHaveBeenCalled();
        expect(pendingTab.opener).toBeNull();
        expect(pendingTab.document.title).toBe(baseDocument.filename);
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(pendingTab.location.replace).toHaveBeenCalledWith('blob:preview-url');
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:preview-url');
        expect(window.open).toHaveBeenCalledWith('', '_blank');
    });
});
