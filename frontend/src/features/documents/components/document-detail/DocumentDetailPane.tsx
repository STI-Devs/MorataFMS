import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Loader2, TriangleAlert, Upload } from 'lucide-react';

import { Button } from '../../../../components/ui/button';
import { FilePreviewModal } from '../../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../../components/modals/UploadModal';
import { useTransactionSyncSubscription } from '../../../../hooks/useTransactionSyncSubscription';
import { useAuth } from '../../../auth';
import { isEncoder } from '../../../auth/utils/access';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { useDocumentPreview } from '../../../tracking/hooks/useDocumentPreview';
import { useTransactionDetail } from '../../../tracking/hooks/useTransactionDetail';
import type {
    ApiExportTransaction,
    ApiImportTransaction,
    DocumentableType,
} from '../../../tracking/types';
import { useDocuments } from '../../hooks/useDocuments';
import { useUploadDocument } from '../../hooks/useUploadDocument';
import { mapDocument, type TransactionDoc } from '../../utils/documentsDetail.utils';
import { DocumentRow } from '../detail/DocumentRow';
import { DocumentsDetailHeader } from '../detail/DocumentsDetailHeader';

export const DocumentDetailPane = ({ ref }: { ref: string | null }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadError, setUploadError] = useState<string | undefined>();

    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();
    const { data: txDetail, isLoading: txnLoading } = useTransactionDetail(ref ?? undefined, { scope: 'record' });

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

    const displayRef = ref ?? '';
    const displayClient = rawImport?.importer?.name ?? rawExport?.shipper?.name ?? '—';
    const displayDate = rawImport?.arrival_date ?? rawExport?.export_date ?? '—';
    const displayStatus = txDetail?.mapped.status ?? '—';
    const displayType: 'import' | 'export' = isImport ? 'import' : 'export';
    const canUpload = isEncoder(user);

    useTransactionSyncSubscription({
        type: txDetail ? (txDetail.isImport ? 'import' : 'export') : null,
        id: txDetail?.raw.id ?? null,
        reference: ref,
        enabled: !!txDetail && !!ref,
    });

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

    if (!ref) {
        return (
            <div className="flex h-full min-h-[24rem] items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                    <FileText className="mx-auto size-10 opacity-30" />
                    <p className="mt-3 text-sm font-semibold">Select a document to view details</p>
                    <p className="mt-1 text-xs">Click a row to preview its files and transaction info.</p>
                </div>
            </div>
        );
    }

    if (txnLoading) {
        return (
            <div className="flex items-center justify-center gap-3 p-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm font-semibold">Loading transaction…</span>
            </div>
        );
    }

    if (!txnFound) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-muted-foreground">
                <FileText className="size-10 opacity-30" />
                <p className="text-sm font-semibold">
                    {ref ? `Transaction "${ref}" not found` : 'No transaction selected'}
                </p>
                <p className="text-xs">The reference may have been deleted or does not exist.</p>
            </div>
        );
    }

    const resolvedStatus = txDetail?.raw.status?.toLowerCase() ?? '';
    const isFinalized = resolvedStatus === 'completed' || resolvedStatus === 'cancelled';

    if (!isFinalized) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning">
                    <TriangleAlert className="size-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">Transaction Still In Progress</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                        <span className="font-mono font-bold">{ref}</span> has not been cleared yet.
                        Documents for active transactions are managed from the Tracking view.
                    </p>
                </div>
                <Button size="sm" onClick={() => navigate(`/tracking/${ref}`)}>
                    Go to Tracking
                    <ArrowRight className="ml-2 size-3.5" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <DocumentsDetailHeader
                displayRef={displayRef}
                displayClient={displayClient}
                displayDate={displayDate}
                displayStatus={displayStatus}
                displayType={displayType}
            />

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">
                            {docsLoading ? 'Loading…' : `${documents.length} Document${documents.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                    {canUpload ? (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                setUploadError(undefined);
                                setIsUploadOpen(true);
                            }}
                        >
                            <Upload className="mr-1.5 size-3.5" />
                            Upload
                        </Button>
                    ) : null}
                </div>

                <div className="grid gap-4 border-b border-border bg-muted/40 px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
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
                        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" />
                            <span className="text-sm font-semibold">Loading documents…</span>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                            <FileText className="size-10 opacity-30" />
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
