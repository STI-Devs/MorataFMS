import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { useTransactionSyncSubscription } from '../../../hooks/useTransactionSyncSubscription';
import { appRoutes } from '../../../lib/appRoutes';
import { useAuth } from '../../auth';
import { isEncoder } from '../../auth/utils/access';
import { trackingApi } from '../../tracking/api/trackingApi';
import { useDocumentPreview } from '../../tracking/hooks/useDocumentPreview';
import { useTransactionDetail } from '../../tracking/hooks/useTransactionDetail';
import type {
    ApiExportTransaction,
    ApiImportTransaction,
    DocumentableType,
} from '../../tracking/types';
import { useDocuments } from '../hooks/useDocuments';
import { useUploadDocument } from '../hooks/useUploadDocument';
import { mapDocument, type TransactionDoc } from '../utils/documentsDetail.utils';
import { DocumentRow } from './detail/DocumentRow';
import { DocumentsDetailHeader } from './detail/DocumentsDetailHeader';

type DocumentDetailLocationState = {
    backLabel?: string;
    backTo?: string;
};

export const DocumentsDetail = () => {
    const { ref } = useParams<{ ref: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadError, setUploadError] = useState<string | undefined>();

    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();
    const { data: txDetail, isLoading: txnLoading } = useTransactionDetail(ref, { scope: 'record' });

    const txnFound = !!txDetail;
    const isImport = txDetail?.isImport ?? true;
    const txnId = txDetail?.raw.id ?? 0;
    const documentableType: DocumentableType = isImport
        ? 'App\\Models\\ImportTransaction'
        : 'App\\Models\\ExportTransaction';

    const { data: apiDocuments = [], isLoading: docsLoading } = useDocuments(
        documentableType,
        txnId,
        txnFound,
    );

    const documents: TransactionDoc[] = apiDocuments.map((doc) => mapDocument(doc, isImport));

    const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument();
    const rawImport: ApiImportTransaction | null = txDetail?.isImport
        ? (txDetail.raw as ApiImportTransaction)
        : null;
    const rawExport: ApiExportTransaction | null = txDetail && !txDetail.isImport
        ? (txDetail.raw as ApiExportTransaction)
        : null;

    const handleUpload = async (files: File[]) => {
        setUploadError(undefined);
        await new Promise<void>((resolve, reject) => {
            uploadDocument(
                {
                    files,
                    type: 'others',
                    documentable_type: documentableType,
                    documentable_id: txnId,
                },
                {
                    onSuccess: () => {
                        setIsUploadOpen(false);
                        resolve();
                    },
                    onError: () => {
                        setUploadError('Upload failed. Please try again.');
                        reject(new Error('Upload failed. Please try again.'));
                    },
                },
            );
        });
    };

    const displayRef = ref ?? '';
    const displayClient = rawImport?.importer?.name ?? rawExport?.shipper?.name ?? '—';
    const displayDate = rawImport?.arrival_date ?? rawExport?.export_date ?? '—';
    const displayStatus = txDetail?.mapped.status ?? '—';
    const displayType: 'import' | 'export' = isImport ? 'import' : 'export';
    const locationState = location.state as DocumentDetailLocationState | null;
    const backTarget = locationState?.backTo ?? appRoutes.documents;
    const backLabel = locationState?.backLabel ?? 'Back to Documents';
    const canUpload = isEncoder(user);

    useTransactionSyncSubscription({
        type: txDetail ? (txDetail.isImport ? 'import' : 'export') : null,
        id: txDetail?.raw.id ?? null,
        reference: ref,
        enabled: !!txDetail && !!ref,
    });

    const backButton = (
        <button
            onClick={() => navigate(backTarget)}
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors group"
        >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
        </button>
    );

    if (txnLoading) {
        return (
            <div className="space-y-5 p-4">
                {backButton}
                <div className="flex items-center justify-center h-48 gap-3 text-text-muted">
                    <div className="w-5 h-5 rounded-full border-2 border-text-muted/30 border-t-text-muted animate-spin" />
                    <span className="text-sm font-semibold">Loading transaction…</span>
                </div>
            </div>
        );
    }

    if (!txnFound) {
        return (
            <div className="space-y-5 p-4">
                {backButton}
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
                    <Icon name="file-text" className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-semibold">
                        {ref ? `Transaction "${ref}" not found` : 'No transaction selected'}
                    </p>
                    <p className="text-xs">The reference may have been deleted or does not exist.</p>
                </div>
            </div>
        );
    }

    const resolvedStatus = txDetail?.raw.status?.toLowerCase() ?? '';
    const isFinalized = resolvedStatus === 'completed' || resolvedStatus === 'cancelled';

    if (!isFinalized) {
        return (
            <div className="space-y-5 p-4">
                {backButton}
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-primary">Transaction Still In Progress</p>
                        <p className="text-xs text-text-secondary mt-1 max-w-xs">
                            <span className="font-mono font-bold">{ref}</span> has not been cleared yet.
                            Documents for active transactions are managed from the Tracking view.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(`/tracking/${ref}`)}
                        className="flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        Go to Tracking
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-4">
            {backButton}

            <DocumentsDetailHeader
                displayRef={displayRef}
                displayClient={displayClient}
                displayDate={displayDate}
                displayStatus={displayStatus}
                displayType={displayType}
            />

            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-bold text-text-primary">
                            {docsLoading ? 'Loading…' : `${documents.length} Document${documents.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                    {canUpload ? (
                        <button
                            type="button"
                            onClick={() => { setUploadError(undefined); setIsUploadOpen(true); }}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Upload
                        </button>
                    ) : null}
                </div>

                <div
                    className="grid gap-4 px-6 py-3 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider bg-surface"
                    style={{ gridTemplateColumns: '40px 2.5fr 1fr 1.4fr 80px 90px' }}
                >
                    <span />
                    <span>File Name</span>
                    <span>Date</span>
                    <span>Uploaded By</span>
                    <span>Size</span>
                    <span className="text-center">Actions</span>
                </div>

                <div>
                    {docsLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-text-muted">
                            <div className="w-5 h-5 rounded-full border-2 border-text-muted/30 border-t-text-muted animate-spin" />
                            <span className="text-sm font-semibold">Loading documents…</span>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                            <Icon name="file-text" className="w-10 h-10 opacity-30" />
                            <p className="text-sm font-semibold">No documents yet</p>
                            <p className="text-xs">Upload the first document for this transaction.</p>
                        </div>
                    ) : (
                        documents.map((doc, i) => (
                            <DocumentRow
                                key={doc.id}
                                doc={doc}
                                isAlternate={i % 2 !== 0}
                                onDownload={(d) => trackingApi.downloadDocument(d.id, d.name)}
                                onPreview={(d) => {
                                    const apiDoc = apiDocuments.find((api) => api.id === d.id);
                                    if (apiDoc) handlePreviewDoc(apiDoc);
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {canUpload ? (
                <UploadModal
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    title={displayRef}
                    onUpload={handleUpload}
                    isLoading={isUploading}
                    errorMessage={uploadError}
                />
            ) : null}

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
                onDownload={previewFile ? () => {
                    const doc = apiDocuments.find((d) => d.filename === previewFile.name);
                    if (doc) trackingApi.downloadDocument(doc.id, doc.filename);
                } : undefined}
            />
        </div>
    );
};
