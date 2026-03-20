import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument, DocumentableType, ExportTransaction, ImportTransaction } from '../types';
import { useTransactionDetail } from '../hooks/useTransactionDetail';
import { useAddDocumentToCache, useTransactionDocuments } from '../hooks/useTransactionDocuments';
import { useDocumentPreview } from '../hooks/useDocumentPreview';
import { useQueryClient } from '@tanstack/react-query';
import { trackingKeys } from '../utils/queryKeys';
import { EXPORT_STAGES, IMPORT_STAGES, getStageStatusFromDoc, getStatusStyle, getImportDisplayStatus, getExportDisplayStatus } from '../utils/stageUtils';
import { TrackingDetailsSkeleton } from './TrackingDetailsSkeleton';
import { TrackingHeader } from './TrackingHeader';
import { TransactionInfoCard } from './TransactionInfoCard';
import { StageRow } from './StageRow';
import EditTransactionModal from './EditTransactionModal';
import { RemarkViewerModal } from './RemarkViewerModal';


export const TrackingDetails = () => {
    const navigate       = useNavigate();
    const { referenceId } = useParams();
    const queryClient    = useQueryClient();
    const addDocToCache  = useAddDocumentToCache();

    // ── Data fetching ──────────────────────────────────────────────────
    const { data: txDetail, isLoading: txLoading } = useTransactionDetail(referenceId);

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

    // ── UI state ───────────────────────────────────────────────────────
    const [isEditModalOpen,    setIsEditModalOpen]    = useState(false);
    const [isRemarkModalOpen,  setIsRemarkModalOpen]  = useState(false);
    const [isUploadOpen,       setIsUploadOpen]       = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [uploadingStage,     setUploadingStage]     = useState<number | null>(null);
    const [deletingDocId,      setDeletingDocId]      = useState<number | null>(null);
    const [replacingDoc,       setReplacingDoc]       = useState<ApiDocument | null>(null);
    const [uploadError,        setUploadError]        = useState<string | null>(null);

    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();

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

    const handleUpload = async (file: File) => {
        if (selectedStageIndex === null || !txDetail || !docableType) return;

        setUploadingStage(selectedStageIndex);
        setUploadError(null);

        try {
            const doc = await trackingApi.uploadDocument({
                file,
                type:              stages[selectedStageIndex].type,
                documentable_type: docableType,
                documentable_id:   txDetail.raw.id,
            });

            // If replacing, delete old doc silently after new one is saved
            if (replacingDoc) {
                await trackingApi.deleteDocument(replacingDoc.id);
                // Update cache: remove old, add new
                queryClient.setQueryData<ApiDocument[]>(
                    trackingKeys.documents.list(docableType, txDetail.raw.id),
                    (prev = []) => [doc, ...prev.filter(d => d.id !== replacingDoc.id && d.type !== doc.type)],
                );
            } else {
                addDocToCache(docableType, txDetail.raw.id, doc);
            }

            // Refresh transaction so status badge reflects backend recalculation
            queryClient.invalidateQueries({ queryKey: trackingKeys.detail(referenceId) });

            setIsUploadOpen(false);
            setReplacingDoc(null);
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setUploadError(apiErr?.response?.data?.message ?? 'Upload failed. Please try again.');
        } finally {
            setUploadingStage(null);
        }
    };

    // ── Loading / error gates ──────────────────────────────────────────
    if (txLoading || docsLoading) return <TrackingDetailsSkeleton />;

    if (!txDetail) {
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
    const { mapped: transaction, isImport } = txDetail;

    // Derive the badge label from uploaded doc types — instant reactivity,
    // and matches exactly what the backend saves after the enum migration.
    const uploadedDocTypes = Object.values(stageDocuments).map(d => d.type);
    const displayStatus    = isImport
        ? getImportDisplayStatus(uploadedDocTypes)
        : getExportDisplayStatus(uploadedDocTypes);

    const s = getStatusStyle(displayStatus);

    // Derive stage statuses from document presence (document-driven, not status-string-driven)
    const firstEmptyIdx  = stages.findIndex((_, i) => !stageDocuments[i]);
    const stageStatuses  = stages.map((_, i) =>
        getStageStatusFromDoc(!!stageDocuments[i], i === firstEmptyIdx),
    );
    const activeIndex    = stageStatuses.findIndex(s => s === 'active');
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
                stages={stages}
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
                    {stages.map((stage, i) => (
                        <StageRow
                            key={i}
                            stage={stage}
                            index={i}
                            isLast={i === stages.length - 1}
                            stageStatus={stageStatuses[i]}
                            doc={stageDocuments[i]}
                            isUploading={uploadingStage === i}
                            isDeleting={deletingDocId === stageDocuments[i]?.id}
                            activeIndex={activeIndex}
                            onUploadClick={handleStageUploadClick}
                            onPreviewDoc={handlePreviewDoc}
                            onDeleteDoc={handleDeleteDoc}
                            onReplaceDoc={handleReplaceDoc}
                        />
                    ))}
                </div>
            </div>

            {/* ── Modals ────────────────────────────────────────────── */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => { setIsUploadOpen(false); setUploadError(null); }}
                onUpload={handleUpload}
                title={selectedStageIndex !== null ? stages[selectedStageIndex].title : ''}
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
                    const allDocs = Object.values(stageDocuments).flat();
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
                transaction={txDetail.raw ?? null}
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

