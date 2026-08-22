import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Loader2, TriangleAlert, Upload } from 'lucide-react';

import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
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
import { mapDocument, toTitleCase, formatDate, type TransactionDoc } from '../../utils/documentsDetail.utils';
import { DocumentRow } from '../detail/DocumentRow';

export const DocumentDetailPane = ({
    ref,
}: {
    ref: string | null;
    onClose?: () => void;
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadError, setUploadError] = useState<string | undefined>();

    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();
    const { data: txDetail, isLoading: txnLoading } = useTransactionDetail(ref ?? undefined, {
        scope: 'record',
    });

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
    const rawExport: ApiExportTransaction | null =
        txDetail && !txDetail.isImport ? (txDetail.raw as ApiExportTransaction) : null;

    const displayRef = ref ?? '';
    const displayTitle = isImport
        ? (rawImport?.customs_ref_no || displayRef)
        : (rawExport?.bl_no || txDetail?.mapped.bl || displayRef);
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
            <div data-testid="detail-pane" className="flex h-full min-h-[24rem] items-center justify-center p-8">
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
            <div data-testid="detail-pane" className="flex items-center justify-center gap-3 p-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm font-semibold">Loading transaction…</span>
            </div>
        );
    }

    if (!txnFound) {
        return (
            <div data-testid="detail-pane" className="flex flex-col items-center justify-center gap-3 p-16 text-muted-foreground">
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
            <div data-testid="detail-pane" className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                    <TriangleAlert className="size-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">Transaction Still In Progress</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                        <span className="font-mono font-bold">{ref}</span> has not been cleared yet.
                        Documents for active transactions are managed from the Tracking view.
                    </p>
                </div>
                <Button size="sm" onClick={() => navigate(`/tracking/${ref}`)} className="cursor-pointer">
                    Go to Tracking
                    <ArrowRight className="ml-2 size-3.5" />
                </Button>
            </div>
        );
    }

    return (
        <div data-testid="detail-pane" className="flex flex-col h-full space-y-4 p-4 sm:p-6 overflow-y-auto">
            {/* Sheet Top Header */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            {displayTitle}
                        </h2>
                        <Badge variant="secondary" className="font-semibold text-xs">
                            {displayType === 'import' ? 'Import' : 'Export'}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        >
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {displayStatus}
                        </Badge>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    {isImport && rawImport?.bl_no ? (
                        <>
                            BL No.: <strong className="font-semibold text-foreground">{rawImport.bl_no}</strong> ·{' '}
                        </>
                    ) : null}
                    Client: <strong className="font-semibold text-foreground">{toTitleCase(displayClient)}</strong> · {formatDate(displayDate)}
                </p>
            </div>

            {/* Quick Actions Bar */}
            {canUpload && (
                <div className="flex items-center gap-2 pt-1">
                    <Button
                        size="sm"
                        onClick={() => {
                            setUploadError(undefined);
                            setIsUploadOpen(true);
                        }}
                        className="cursor-pointer"
                    >
                        <Upload className="mr-1.5 size-3.5" />
                        Upload
                    </Button>
                </div>
            )}

            <Separator />

            {/* Attached Documents List */}
            <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">
                        Attached Files ({docsLoading ? '…' : documents.length})
                    </h3>
                </div>

                {docsLoading ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                        <span className="text-sm font-semibold">Loading documents…</span>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                        <FileText className="size-8 opacity-30" />
                        <p className="text-xs font-semibold">No files attached to this transaction</p>
                        {canUpload && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setUploadError(undefined);
                                    setIsUploadOpen(true);
                                }}
                                className="mt-1 text-xs cursor-pointer"
                            >
                                <Upload className="mr-1.5 size-3" />
                                Upload First Document
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {documents.map((doc, i) => (
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
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {canUpload && (
                <UploadModal
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    title={`Upload to ${displayRef}`}
                    onUpload={handleUpload}
                    isLoading={isUploading}
                    errorMessage={uploadError}
                />
            )}

            {/* Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
                onDownload={
                    previewFile
                        ? () => {
                              const doc = apiDocuments.find((d) => d.filename === previewFile.name);
                              if (doc) trackingApi.downloadDocument(doc.id, doc.filename);
                          }
                        : undefined
                }
            />
        </div>
    );
};
