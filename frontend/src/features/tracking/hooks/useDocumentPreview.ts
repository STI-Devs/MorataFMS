import { useState } from 'react';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument } from '../types';

export const useDocumentPreview = () => {
    const [previewFile, setPreviewFile] = useState<{ file: string | File | null; name: string } | null>(null);

    const handlePreviewDoc = async (doc: ApiDocument) => {
        const ext = doc.filename.split('.').pop()?.toLowerCase() || '';
        const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv'].includes(ext);

        if (isOffice) {
            await trackingApi.downloadDocument(doc.id, doc.filename);
            return;
        }

        const pendingTab = window.open('', '_blank');

        if (pendingTab) {
            pendingTab.opener = null;
            pendingTab.document.title = doc.filename;
        }

        try {
            const previewBlob = await trackingApi.previewDocument(doc.id);
            const previewUrl = window.URL.createObjectURL(previewBlob);

            if (pendingTab) {
                pendingTab.location.replace(previewUrl);
            } else {
                const newTab = window.open(previewUrl, '_blank', 'noopener');

                if (newTab) {
                    newTab.opener = null;
                }
            }

            window.setTimeout(() => {
                window.URL.revokeObjectURL(previewUrl);
            }, 60_000);
        } catch (error) {
            pendingTab?.close();
            throw error;
        }
    };

    return {
        previewFile,
        setPreviewFile,
        handlePreviewDoc,
    };
};
