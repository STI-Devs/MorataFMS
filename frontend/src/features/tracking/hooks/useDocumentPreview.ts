import { useState } from 'react';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument } from '../types';

export const useDocumentPreview = () => {
    const [previewFile, setPreviewFile] = useState<{ file: string | File | null; name: string } | null>(null);

    const handlePreviewDoc = async (doc: ApiDocument) => {
        const ext = doc.filename.split('.').pop()?.toLowerCase() || '';
        const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

        if (isOffice) {
            await trackingApi.downloadDocument(doc.id, doc.filename);
            return;
        }

        const newTab = window.open('about:blank', '_blank');

        if (newTab) {
            newTab.opener = null;
        }

        try {
            const url = await trackingApi.getDocumentPreviewUrl(doc.id);
            if (newTab) {
                newTab.location.replace(url);
            } else {
                await trackingApi.downloadDocument(doc.id, doc.filename);
            }
        } catch (error) {
            console.error('Failed to preview document:', error);
            newTab?.close();
            await trackingApi.downloadDocument(doc.id, doc.filename);
        }
    };

    return {
        previewFile,
        setPreviewFile,
        handlePreviewDoc,
    };
};
