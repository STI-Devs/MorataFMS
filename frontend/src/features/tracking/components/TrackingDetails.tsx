import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument, DocumentableType, ExportTransaction, ImportTransaction } from '../types';
import { useTransactionDetail } from '../hooks/useTransactionDetail';
import { useAddDocumentToCache, useTransactionDocuments } from '../hooks/useTransactionDocuments';
import { useQueryClient } from '@tanstack/react-query';
import { EXPORT_STAGES, IMPORT_STAGES, getStageStatus, getStatusStyle } from '../utils/stageUtils';
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
    const [uploadError,        setUploadError]        = useState<string | null>(null);
    const [previewFile,        setPreviewFile]        = useState<{ file: File | string | null; name: string } | null>(null);

    // ── Handlers ───────────────────────────────────────────────────────
    const handleStageUploadClick = (index: number) => {
        setSelectedStageIndex(index);
        setUploadError(null);
        setIsUploadOpen(true);
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
            addDocToCache(docableType, txDetail.raw.id, doc);
            setIsUploadOpen(false);
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setUploadError(apiErr?.response?.data?.message ?? 'Upload failed. Please try again.');
        } finally {
            setUploadingStage(null);
        }
    };

    const handlePreviewDoc = async (doc: ApiDocument) => {
        try {
            const blobUrl = await trackingApi.getDocumentPreviewUrl(doc.id);
            setPreviewFile({ file: blobUrl, name: doc.filename });
        } catch {
            trackingApi.downloadDocument(doc.id, doc.filename);
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
    const s             = getStatusStyle(transaction.status);
    const stageStatuses = stages.map((_, i) => getStageStatus(i, transaction.status));
    const activeIndex   = stageStatuses.findIndex(s => s === 'active');
    const importTx      = isImport  ? (transaction as ImportTransaction)  : null;
    const exportTx      = !isImport ? (transaction as ExportTransaction)  : null;

    return (
        <div className="flex flex-col space-y-5 pb-6">

            <TrackingHeader
                transaction={transaction}
                isImport={isImport}
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
                            activeIndex={activeIndex}
                            onUploadClick={handleStageUploadClick}
                            onPreviewDoc={handlePreviewDoc}
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
            />

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['transaction-detail', referenceId] });
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
