import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Building2,
    Flag,
    Layers,
    Loader2,
    Ship,
    Sparkles,
    Truck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '../../../components/ui/sheet';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { trackingApi } from '../../tracking/api/trackingApi';
import { useAddDocumentToCache, useTransactionDocuments } from '../../tracking/hooks/useTransactionDocuments';
import { useDocumentPreview } from '../../tracking/hooks/useDocumentPreview';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import { StageRow } from '../../tracking/components/lists/StageRow';
import type { ApiDocument, ApiExportStages, ApiImportStages, DocumentableType } from '../../tracking/types';
import {
    getExportAccountingActionability,
    getImportAccountingActionability,
    getOperationalStageStatus,
    type StageDefinition,
} from '../../tracking/utils/stageUtils';

interface AccountingUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: number;
    reference: string;
    type: 'import' | 'export';
    clientName: string;
    vesselName: string | null;
    vesselUploadCount: number;
    entryMode?: 'single-transaction' | 'shared-vessel';
    transactionStages?: ApiImportStages | ApiExportStages;
}

type AccountingUploadScope = 'single' | 'vessel';

const ACCOUNTING_STAGES: StageDefinition[] = [
    { type: 'billing', title: 'Billing & Liquidation', description: 'Finalize billing and liquidate all charges.', icon: 'file-text', supportsNotApplicable: false },
];

export const AccountingUploadModal = ({
    isOpen,
    onClose,
    transactionId,
    reference,
    type,
    clientName,
    vesselName,
    vesselUploadCount,
    entryMode = 'single-transaction',
    transactionStages,
}: AccountingUploadModalProps) => {
    const queryClient = useQueryClient();
    const addDocToCache = useAddDocumentToCache();
    
    const isImport = type === 'import';
    const docableType: DocumentableType = isImport ? 'App\\Models\\ImportTransaction' : 'App\\Models\\ExportTransaction';

    const { byStageIndex: stageDocuments, isLoading: docsLoading } = useTransactionDocuments(
        isOpen ? { documentable_type: docableType, documentable_id: transactionId } : null,
        ACCOUNTING_STAGES
    );

    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [uploadingStage, setUploadingStage] = useState<number | null>(null);
    const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
    const [replacingDoc, setReplacingDoc] = useState<ApiDocument | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadScope, setUploadScope] = useState<AccountingUploadScope>('single');

    const accountingActionability = isImport
        ? getImportAccountingActionability(transactionStages)
        : getExportAccountingActionability(transactionStages);

    const canUseVesselUpload = !!vesselName && vesselUploadCount > 1;
    const isSharedEntry = entryMode === 'shared-vessel' && canUseVesselUpload;

    const handleStageUploadClick = (index: number) => {
        setSelectedStageIndex(index);
        setReplacingDoc(null);
        setUploadError(null);
        setUploadScope(isSharedEntry || canUseVesselUpload ? 'vessel' : 'single');
        setIsUploadOpen(true);
    };

    const handleReplaceDoc = (index: number, oldDoc: ApiDocument) => {
        setSelectedStageIndex(index);
        setReplacingDoc(oldDoc);
        setUploadError(null);
        setUploadScope('single');
        setIsUploadOpen(true);
    };

    const handleDeleteDoc = async (doc: ApiDocument) => {
        setDeletingDocId(doc.id);
        try {
            await trackingApi.deleteDocument(doc.id);
            queryClient.setQueryData<ApiDocument[]>(
                trackingKeys.documents.list(docableType, transactionId),
                (prev = []) => prev.filter(d => d.id !== doc.id),
            );
            queryClient.invalidateQueries({ queryKey: isImport ? trackingKeys.imports.list() : trackingKeys.exports.list() });
        } finally {
            setDeletingDocId(null);
        }
    };

    const handleUpload = async (files: File[]) => {
        if (selectedStageIndex === null) return;

        setUploadingStage(selectedStageIndex);
        setUploadError(null);

        try {
            if (uploadScope === 'vessel' && canUseVesselUpload && !replacingDoc) {
                const result = await trackingApi.uploadVesselBillingDocuments({
                    files,
                    documentable_type: docableType,
                    documentable_id: transactionId,
                });

                await queryClient.invalidateQueries({
                    queryKey: trackingKeys.documents.list(docableType, transactionId),
                });
                queryClient.invalidateQueries({ queryKey: isImport ? trackingKeys.imports.list() : trackingKeys.exports.list() });
                setIsUploadOpen(false);
                toast.success(
                    `Uploaded billing files to ${result.affected_transactions_count} transactions for ${result.vessel_name}.`,
                );

                return;
            }

            const uploadedDocuments = await trackingApi.uploadDocuments({
                files,
                type: ACCOUNTING_STAGES[selectedStageIndex].type,
                documentable_type: docableType,
                documentable_id: transactionId,
            });

            if (uploadedDocuments.length === 0) return;

            if (replacingDoc) {
                await trackingApi.deleteDocument(replacingDoc.id);
                queryClient.setQueryData<ApiDocument[]>(
                    trackingKeys.documents.list(docableType, transactionId),
                    (prev = []) => [
                        ...uploadedDocuments,
                        ...prev.filter(d => d.id !== replacingDoc.id),
                    ]
                );
            } else {
                uploadedDocuments.forEach(doc => addDocToCache(docableType, transactionId, doc));
            }

            queryClient.invalidateQueries({ queryKey: isImport ? trackingKeys.imports.list() : trackingKeys.exports.list() });
            setIsUploadOpen(false);
            setReplacingDoc(null);
            toast.success('Documents uploaded successfully.');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setUploadError(apiErr?.response?.data?.message ?? 'Upload failed. Please try again.');
        } finally {
            setUploadingStage(null);
        }
    };

    const completedStagesCount = ACCOUNTING_STAGES.filter((_, i) => {
        const docs = stageDocuments[i] ?? [];
        return docs.length > 0;
    }).length;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-xl p-0 gap-0 flex flex-col bg-background border-l border-border/80"
                >
                    <SheetHeader className="p-6 border-b border-border/80 bg-muted/20 space-y-2 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                                {reference}
                            </SheetTitle>
                            <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 font-semibold gap-1 ${
                                    isImport
                                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}
                            >
                                {isImport ? <Truck className="size-3" /> : <Flag className="size-3" />}
                                {isImport ? 'Import Shipment' : 'Export Shipment'}
                            </Badge>
                        </div>

                        <div className="space-y-0.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{clientName}</span>
                            </div>
                            {vesselName && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Ship className="size-3.5 text-muted-foreground shrink-0" />
                                    <span>Vessel: <strong className="font-semibold text-foreground/90">{vesselName}</strong></span>
                                </div>
                            )}
                        </div>

                        <SheetDescription className="text-xs text-muted-foreground pt-1">
                            Finalize customer billing invoices and liquidation documents.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {docsLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-2 text-muted-foreground">
                                <Loader2 className="size-8 animate-spin text-primary opacity-60" />
                                <span className="text-xs font-medium">Loading accounting documents...</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {canUseVesselUpload && (
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="size-4 text-primary shrink-0" />
                                                <p className="text-xs font-bold text-foreground">
                                                    Shared Vessel Upload Available
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold">
                                                {vesselUploadCount} Ready BLs
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {vesselName} has {vesselUploadCount} billing-ready transactions that can use the same Billing & Liquidation files.
                                        </p>
                                    </div>
                                )}

                                <Card className="p-0 overflow-hidden shadow-2xs border-border/80">
                                    <div className="px-5 py-3.5 border-b border-border/80 bg-muted/40 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layers className="size-4 text-primary" />
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Required Uploads
                                            </h3>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold">
                                            {completedStagesCount} of {ACCOUNTING_STAGES.length} Complete
                                        </Badge>
                                    </div>

                                    <div className="divide-y divide-border/60 bg-card">
                                        {ACCOUNTING_STAGES.map((stage, i) => {
                                            const docs = stageDocuments[i] ?? [];
                                            const isActionable = accountingActionability.billing;
                                            const stageStatus = getOperationalStageStatus(docs.length > 0, isActionable);

                                            return (
                                                <StageRow
                                                    key={stage.type}
                                                    stage={stage}
                                                    index={i}
                                                    isLast={i === ACCOUNTING_STAGES.length - 1}
                                                    stageStatus={stageStatus}
                                                    docs={docs}
                                                    isNotApplicable={false}
                                                    isUploading={uploadingStage === i}
                                                    isApplicabilityUpdating={false}
                                                    deletingDocId={deletingDocId}
                                                    uploadDisabledReason={
                                                        !docs.length && !isActionable
                                                            ? 'Waiting for earlier stages to be completed first.'
                                                            : null
                                                    }
                                                    onUploadClick={handleStageUploadClick}
                                                    onPreviewDoc={handlePreviewDoc}
                                                    onDeleteDoc={handleDeleteDoc}
                                                    onReplaceDoc={handleReplaceDoc}
                                                    onNotApplicableChange={() => {}}
                                                />
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>

                    <UploadModal
                        isOpen={isUploadOpen}
                        onClose={() => {
                            setIsUploadOpen(false);
                            setUploadError(null);
                            setUploadScope('single');
                        }}
                        onUpload={handleUpload}
                        title={selectedStageIndex !== null ? ACCOUNTING_STAGES[selectedStageIndex].title : ''}
                        isLoading={uploadingStage !== null}
                        errorMessage={uploadError ?? undefined}
                        submitLabel={
                            uploadScope === 'vessel' && canUseVesselUpload && !replacingDoc
                                ? `Apply to ${vesselUploadCount} Ready BLs`
                                : undefined
                        }
                        contextContent={
                            !replacingDoc && canUseVesselUpload && !isSharedEntry ? (
                                <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Upload Scope
                                    </p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => setUploadScope('single')}
                                            className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                                                uploadScope === 'single'
                                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                                    : 'border-border bg-card text-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <p className="text-xs font-bold">This Transaction</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                                                Attach the files only to {reference}.
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUploadScope('vessel')}
                                            className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                                                uploadScope === 'vessel'
                                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                                    : 'border-border bg-card text-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <p className="text-xs font-bold">Apply To Entire Vessel</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                                                Apply the same billing files to all {vesselUploadCount} billing-ready BLs for {vesselName}.
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            ) : !replacingDoc && isSharedEntry ? (
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                        Shared Upload Scope
                                    </p>
                                    <p className="text-xs font-semibold text-foreground">
                                        This upload will apply to all {vesselUploadCount} billing-ready BLs for {vesselName}.
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Shared uploads from this vessel group cover every ready BL under this vessel header.
                                    </p>
                                </div>
                            ) : null
                        }
                    />

                    <FilePreviewModal
                        isOpen={!!previewFile}
                        onClose={() => setPreviewFile(null)}
                        file={previewFile?.file ?? null}
                        fileName={previewFile?.name ?? ''}
                        onDownload={
                            previewFile
                                ? () => {
                                      const allDocs = Object.values(stageDocuments).flat();
                                      const doc = allDocs.find((d) => d.filename === previewFile.name);
                                      if (doc) trackingApi.downloadDocument(doc.id, doc.filename);
                                  }
                                : undefined
                        }
                    />
                </SheetContent>
            </Sheet>
        </>
    );
};
