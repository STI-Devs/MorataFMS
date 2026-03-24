import { useState } from 'react';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument } from '../types';

export const useDocumentPreview = () => {
    const [previewFile, setPreviewFile] = useState<{ file: string | File | null; name: string } | null>(null);

    const handlePreviewDoc = async (doc: ApiDocument) => {
        const ext = doc.filename.split('.').pop()?.toLowerCase() || '';
        const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

        // Open a blank tab immediately inside the user-gesture so the browser
        // doesn't treat the later window.open() as a popup. The loading waits
        // in the new tab instead of blocking the current UI.
        const newTab = window.open('about:blank', '_blank');

        try {
            const url = await trackingApi.getDocumentPreviewUrl(doc.id);
            const isBlobUrl = url.startsWith('blob:');

            if (isOffice && !isBlobUrl) {
                // Remote office files open in Google Docs Viewer in a new tab
                const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
                if (newTab) newTab.location.href = googleDocsUrl;
            } else {
                // Images, PDFs, local blob fallback, and unsupported files open raw in a new tab
                if (newTab) newTab.location.href = url;
            }
        } catch (error) {
            console.error('Failed to preview document:', error);
            // Close the blank tab on failure and fall back to a download
            newTab?.close();
            trackingApi.downloadDocument(doc.id, doc.filename);
        }
    };

    return {
        previewFile,
        setPreviewFile,
        handlePreviewDoc,
    };
};
