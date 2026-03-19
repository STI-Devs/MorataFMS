import { useState } from 'react';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument } from '../types';

export const useDocumentPreview = () => {
    const [previewFile, setPreviewFile] = useState<{ file: string | File | null; name: string } | null>(null);

    const handlePreviewDoc = async (doc: ApiDocument) => {
        try {
            const url = await trackingApi.getDocumentPreviewUrl(doc.id);
            const ext = doc.filename.split('.').pop()?.toLowerCase() || '';
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
            const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
            const isBlobUrl = url.startsWith('blob:');

            if (isImage) {
                // Images open in the native lightbox modal
                setPreviewFile({ file: url, name: doc.filename });
            } else if (isOffice && !isBlobUrl) {
                // Remote office files open in Google Docs Viewer in a new tab
                const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
                window.open(googleDocsUrl, '_blank');
            } else {
                // PDFs, local blob fallback, and unsupported files open raw in a new tab
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Failed to preview document:', error);
            // Fallback: trigger a download if preview generation fails completely
            trackingApi.downloadDocument(doc.id, doc.filename);
        }
    };

    return {
        previewFile,
        setPreviewFile,
        handlePreviewDoc,
    };
};
