import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { useTransactionSyncSubscription } from '../../../hooks/useTransactionSyncSubscription';
import { appRoutes } from '../../../lib/appRoutes';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument, DocumentableType, ExportTransaction, ImportTransaction } from '../types';
import { useTransactionDetail } from '../hooks/useTransactionDetail';
import { useAddDocumentToCache, useTransactionDocuments } from '../hooks/useTransactionDocuments';
import { useDocumentPreview } from '../hooks/useDocumentPreview';
import { useQueryClient } from '@tanstack/react-query';
import { trackingKeys } from '../utils/queryKeys';
import { EXPORT_STAGES, IMPORT_STAGES, getStageStatusFromDoc, getStatusStyle, getImportDisplayStatus, getExportDisplayStatus } from '../utils/stageUtils';
import type { TransactionDetailResult } from '../utils/transactionDetail';
import { TrackingDetailsSkeleton } from './TrackingDetailsSkeleton';
import { TrackingHeader } from './TrackingHeader';
import { TransactionInfoCard } from './TransactionInfoCard';
import { StageRow } from './StageRow';
import EditTransactionModal from './EditTransactionModal';
import { RemarkViewerModal } from './RemarkViewerModal';

type CompletionRedirectTarget = {
    label: 'Import' | 'Export';
    route: string;
};

type StageDocumentsByIndex = Record<number, ApiDocument[]>;

type CompletionSnapshot = {
    txDetail: TransactionDetailResult;
    stageDocuments: StageDocumentsByIndex;
};

export const TrackingDetails = () => {
    const navigate       = useNavigate();
    const { referenceId } = useParams();
    const queryClient    = useQueryClient();
    const addDocToCache  = useAddDocumentToCache();

    // ── UI state ───────────────────────────────────────────────────────
    const [isEditModalOpen,    setIsEditModalOpen]    = useState(false);
    const [isRemarkModalOpen,  setIsRemarkModalOpen]  = useState(false);
    const [isUploadOpen,       setIsUploadOpen]       = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [uploadingStage,     setUploadingStage]     = useState<number | null>(null);
    const [applicabilityStage, setApplicabilityStage] = useState<string | null>(null);
    const [deletingDocId,      setDeletingDocId]      = useState<number | null>(null);
    const [replacingDoc,       setReplacingDoc]       = useState<ApiDocument | null>(null);
    const [uploadError,        setUploadError]        = useState<string | null>(null);
    const [completionCountdown, setCompletionCountdown] = useState<number | null>(null);
    const [completionRedirectTarget, setCompletionRedirectTarget] = useState<CompletionRedirectTarget | null>(null);
    const [completionSnapshot, setCompletionSnapshot] = useState<CompletionSnapshot | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Data fetching ──────────────────────────────────────────────────
    const { data: txDetail, isLoading: txLoading } = useTransactionDetail(referenceId);
    const hasCompletionSnapshot = completionCountdown !== null && completionSnapshot !== null;
    const shouldResolveRecordFallback = !!referenceId && !txLoading && !txDetail && !hasCompletionSnapshot;
    const { data: recordDetail, isLoading: recordLoading } = useTransactionDetail(referenceId, {
        scope: 'record',
        enabled: shouldResolveRecordFallback,
    });

    const stages      = txDetail?.isImport ? IMPORT_STAGES : EXPORT_STAGES;
    const docableType: DocumentableType | undefined = txDetail
        ? txDetail.isImport
            ? 'App\\Models\\ImportTransaction'
            : 'App\\Models\\ExportTransaction'
        : undefined;

    const { byStageIndex: stageDocuments, isLoading: docsLoading } = useTransactionDocuments(
        txDetail ? { documentable_type: docableType!, documentable_id: txDetail.raw.id } : null,
        stages,
    );

    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();
    const finalizedStatus = recordDetail?.raw.status;
    const finalizedStatusKey = finalizedStatus?.toLowerCase();
    const shouldShowFinalizedNotice = finalizedStatusKey === 'completed' || finalizedStatusKey === 'cancelled';
    const displayTxDetail = hasCompletionSnapshot ? completionSnapshot.txDetail : txDetail;
    const displayStages = displayTxDetail?.isImport ? IMPORT_STAGES : EXPORT_STAGES;
    const displayStageDocuments = hasCompletionSnapshot ? completionSnapshot.stageDocuments : stageDocuments;

    useTransactionSyncSubscription({
        type: txDetail ? (txDetail.isImport ? 'import' : 'export') : null,
        id: txDetail?.raw.id ?? null,
        reference: referenceId,
        enabled: !!txDetail && !!referenceId,
    });

    // ── Completion countdown effect ─────────────────────────────────────
    useEffect(() => {
        if (completionCountdown === null || !completionRedirectTarget) return;
        if (completionCountdown <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            navigate(completionRedirectTarget.route);
            return;
        }
        countdownRef.current = setInterval(() => {
            setCompletionCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [completionCountdown, completionRedirectTarget, navigate]);

    // ── Handlers ───────────────────────────────────────────────────────
    const handleStageUploadClick = (index: number) => {
        setSelectedStageIndex(index);
        setReplacingDoc(null);
        setUploadError(null);
        setIsUploadOpen(true);
    };

    const handleReplaceDoc = (index: number, oldDoc: ApiDocument) => {
        setSelectedStageIndex(index);
        setReplacingDoc(oldDoc);
        setUploadError(null);
        setIsUploadOpen(true);
    };

    const handleDeleteDoc = async (doc: ApiDocument) => {
        if (!txDetail || !docableType) return;
        setDeletingDocId(doc.id);
        try {
            await trackingApi.deleteDocument(doc.id);
            // Remove from local cache immediately
            queryClient.setQueryData<ApiDocument[]>(
                trackingKeys.documents.list(docableType, txDetail.raw.id),
                (prev = []) => prev.filter(d => d.id !== doc.id),
            );
            // Refresh transaction so status badge updates
            queryClient.invalidateQueries({ queryKey: trackingKeys.detail(referenceId) });
        } finally {
            setDeletingDocId(null);
        }
    };

    const handleStageApplicabilityChange = async (stageType: string, notApplicable: boolean) => {
        if (!txDetail) {
            return;
        }

        setApplicabilityStage(stageType);

        try {
            if (txDetail.isImport) {
                await trackingApi.updateImportStageApplicability(txDetail.raw.id, {
                    stage: stageType,
                    not_applicable: notApplicable,
                });
            } else {
                await trackingApi.updateExportStageApplicability(txDetail.raw.id, {
                    stage: stageType,
                    not_applicable: notApplicable,
                });
            }

            await queryClient.invalidateQueries({ queryKey: trackingKeys.detail(referenceId) });
            toast.success(
                notApplicable
                    ? `${stages.find((stage) => stage.type === stageType)?.title ?? 'Stage'} marked as not applicable.`
                    : `${stages.find((stage) => stage.type === stageType)?.title ?? 'Stage'} restored to required.`,
            );
        } catch (error: unknown) {
            const message = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(message ?? 'Failed to update the stage setting.');
        } finally {
            setApplicabilityStage(null);
        }
    };

    const handleUpload = async (files: File[]) => {
        if (selectedStageIndex === null || !txDetail || !docableType) {
            return;
        }

        setUploadingStage(selectedStageIndex);
        setUploadError(null);

        try {
            const uploadedDocuments = await trackingApi.uploadDocuments({
                files,
                type: stages[selectedStageIndex].type,
                documentable_type: docableType,
                documentable_id: txDetail.raw.id,
            });

            if (uploadedDocuments.length === 0) {
                return;
            }

            if (replacingDoc) {
                await trackingApi.deleteDocument(replacingDoc.id);
                queryClient.setQueryData<ApiDocument[]>(
                    trackingKeys.documents.list(docableType, txDetail.raw.id),
                    (previousDocuments = []) => [
                        ...uploadedDocuments,
                        ...previousDocuments.filter((document) => document.id !== replacingDoc.id),
                    ],
                );
            } else {
                uploadedDocuments.forEach((document) => {
                    addDocToCache(docableType, txDetail.raw.id, document);
                });
            }

            queryClient.invalidateQueries({ queryKey: trackingKeys.detail(referenceId) });

            const nextStageDocuments: StageDocumentsByIndex = Object.entries(stageDocuments).reduce<StageDocumentsByIndex>(
                (carry, [index, documents]) => {
                    carry[Number(index)] = [...documents];
                    return carry;
                },
                {},
            );
            nextStageDocuments[selectedStageIndex] = replacingDoc
                ? [...uploadedDocuments, ...(nextStageDocuments[selectedStageIndex] ?? []).filter((document) => document.id !== replacingDoc.id)]
                : [...uploadedDocuments, ...(nextStageDocuments[selectedStageIndex] ?? [])];

            const uploadedTypes = new Set(
                stages
                    .filter((stage, index) => {
                        const documents = nextStageDocuments[index] ?? [];
                        return documents.length > 0 || (txDetail.raw.not_applicable_stages ?? []).includes(stage.type);
                    })
                    .map((stage) => stage.type),
            );
            const allComplete = stages.every((stage) => uploadedTypes.has(stage.type));
            if (allComplete) {
                setCompletionSnapshot({
                    txDetail,
                    stageDocuments: nextStageDocuments,
                });
                setCompletionRedirectTarget(
                    txDetail.isImport
                        ? { label: 'Import', route: appRoutes.imports }
                        : { label: 'Export', route: appRoutes.exports },
                );
                setCompletionCountdown(15);
            }

            setIsUploadOpen(false);
            setReplacingDoc(null);
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setUploadError(apiErr?.response?.data?.message ?? 'Upload failed. Please try again.');
            throw err;
        } finally {
            setUploadingStage(null);
        }
    };

    // ── Loading / error gates ──────────────────────────────────────────
    if ((txLoading || recordLoading || docsLoading) && !hasCompletionSnapshot) return <TrackingDetailsSkeleton />;

    if (shouldShowFinalizedNotice && referenceId && completionCountdown === null) {
        return (
            <div className="text-center py-16 max-w-xl mx-auto">
                <Icon name="file-text" className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary">Tracking Has Ended</h3>
                <p className="text-text-secondary mt-1">
                    Transaction <span className="font-bold">{referenceId}</span> is already
                    <span className="font-bold"> {finalizedStatus ?? 'finalized'}</span>.
                </p>
                <p className="text-text-secondary mt-2 mb-6">
                    Live tracking is only available for active transactions. Review the finalized file in Documents.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => navigate(appRoutes.documentDetail.replace(':ref', encodeURIComponent(referenceId)))}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                        Open Documents
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-surface-secondary text-text-primary rounded-xl font-bold hover:bg-hover transition-colors border border-border"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!displayTxDetail) {
        return (
            <div className="text-center py-16">
                <Icon name="alert-circle" className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary">Transaction Not Found</h3>
                <p className="text-text-secondary mt-1 mb-6">
                    The transaction with reference <span className="font-bold">{referenceId}</span> could not be found.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // ── Derived values ─────────────────────────────────────────────────
    const { mapped: transaction, isImport } = displayTxDetail;

    // Derive the badge label from uploaded doc types — instant reactivity,
    // and matches exactly what the backend saves after the enum migration.
    const notApplicableStages = new Set(displayTxDetail.raw.not_applicable_stages ?? []);
    const uploadedStageTypes = displayStages
        .filter((_, index) => (displayStageDocuments[index]?.length ?? 0) > 0)
        .map((stage) => stage.type);
    const displayStatus    = isImport
        ? getImportDisplayStatus(uploadedStageTypes)
        : getExportDisplayStatus(uploadedStageTypes);

    const s = getStatusStyle(displayStatus);

    // Derive stage statuses from document presence (document-driven, not status-string-driven)
    const firstEmptyIdx  = displayStages.findIndex((stage, i) => {
        const documents = displayStageDocuments[i] ?? [];
        return documents.length === 0 && !notApplicableStages.has(stage.type);
    });
    const stageStatuses  = displayStages.map((stage, i) =>
        getStageStatusFromDoc(
            (displayStageDocuments[i]?.length ?? 0) > 0 || notApplicableStages.has(stage.type),
            i === firstEmptyIdx,
        ),
    );
    const stageUploadDisabledReasons = displayStages.map((stage, i) => {
        const hasDocuments = (displayStageDocuments[i]?.length ?? 0) > 0;

        if (hasDocuments || notApplicableStages.has(stage.type) || stageStatuses[i] === 'active') {
            return null;
        }

        return 'Complete the earlier required stages before uploading this document.';
    });
    const importTx       = isImport  ? (transaction as ImportTransaction)  : null;
    const exportTx       = !isImport ? (transaction as ExportTransaction)  : null;

    return (
        <div className="flex flex-col space-y-5 pb-6">

            <TrackingHeader
                transaction={{ ...transaction, status: displayStatus }}
                onBack={() => navigate(-1)}
                onRemarksClick={() => setIsRemarkModalOpen(true)}
                onEditClick={() => setIsEditModalOpen(true)}
                statusColor={s.color}
                statusBg={s.bg}
            />

            <TransactionInfoCard
                transaction={transaction}
                isImport={isImport}
                importTx={importTx}
                exportTx={exportTx}
                stages={displayStages}
                stageStatuses={stageStatuses}
                statusColor={s.color}
            />

            {/* ── Vertical Stepper ──────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text-primary">Processing Stages</h2>
                    <span className="text-[10px] font-bold text-text-muted bg-surface-secondary border border-border px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {isImport ? 'Import' : 'Export'} workflow
                    </span>
                </div>
                <div className="divide-y divide-border/60">
                    {displayStages.map((stage, i) => (
                        <StageRow
                            key={i}
                            stage={stage}
                            index={i}
                            isLast={i === displayStages.length - 1}
                            stageStatus={stageStatuses[i]}
                            docs={displayStageDocuments[i] ?? []}
                            isNotApplicable={notApplicableStages.has(stage.type)}
                            isUploading={uploadingStage === i}
                            isApplicabilityUpdating={applicabilityStage === stage.type}
                            deletingDocId={deletingDocId}
                            uploadDisabledReason={stageUploadDisabledReasons[i]}
                            onUploadClick={handleStageUploadClick}
                            onPreviewDoc={handlePreviewDoc}
                            onDeleteDoc={handleDeleteDoc}
                            onReplaceDoc={handleReplaceDoc}
                            onNotApplicableChange={handleStageApplicabilityChange}
                        />
                    ))}
                </div>
            </div>

            {/* ── Completion Banner ─────────────────────────────────── */}
            {completionCountdown !== null && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                    <div className="flex items-center gap-4 bg-emerald-950 border border-emerald-500/40 rounded-2xl px-5 py-4 shadow-2xl shadow-emerald-900/40">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-emerald-300">All stages complete!</p>
                            <p className="text-xs text-emerald-400/70 mt-0.5">
                                Returning to {completionRedirectTarget?.label ?? (txDetail?.isImport ? 'Import' : 'Export')} List in{' '}
                                <span className="font-bold text-emerald-300">{completionCountdown}s</span>
                                …
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(appRoutes.documentDetail.replace(':ref', encodeURIComponent(transaction.ref)))}
                            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                        >
                            Open Documents
                        </button>
                    </div>
                </div>
            )}

            {/* ── Modals ────────────────────────────────────────────── */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => { setIsUploadOpen(false); setUploadError(null); }}
                onUpload={handleUpload}
                title={selectedStageIndex !== null ? displayStages[selectedStageIndex].title : ''}
                isLoading={uploadingStage !== null}
                errorMessage={uploadError ?? undefined}
            />

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
                onDownload={previewFile ? () => {
                    // find the doc matching the current preview name and download it
                    const allDocs = Object.values(displayStageDocuments).flat();
                    const doc = allDocs.find(d => d.filename === previewFile.name);
                    if (doc) trackingApi.downloadDocument(doc.id, doc.filename);
                } : undefined}
            />

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: trackingKeys.detail(referenceId) });
                }}
                type={isImport ? 'import' : 'export'}
                transaction={displayTxDetail.raw ?? null}
            />

            {isRemarkModalOpen && (
                <RemarkViewerModal
                    isOpen={isRemarkModalOpen}
                    onClose={() => setIsRemarkModalOpen(false)}
                    transactionType={isImport ? 'import' : 'export'}
                    transactionId={transaction.id}
                    transactionLabel={`${isImport ? 'Import' : 'Export'} — ${transaction.ref}`}
                />
            )}
        </div>
    );
};

