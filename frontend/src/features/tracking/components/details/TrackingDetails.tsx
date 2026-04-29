import { FilePreviewModal } from '../../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../../components/modals/UploadModal';
import { Icon } from '../../../../components/Icon';
import { appRoutes } from '../../../../lib/appRoutes';
import { trackingApi } from '../../api/trackingApi';
import { useTrackingDetails } from '../../hooks/useTrackingDetails';
import type { ExportTransaction, ImportTransaction } from '../../types';
import { trackingKeys } from '../../utils/queryKeys';
import { StageRow } from '../lists/StageRow';
import EditTransactionModal from '../modals/EditTransactionModal';
import { RemarkViewerModal } from '../modals/RemarkViewerModal';
import { CompletionBanner } from './CompletionBanner';
import { TrackingDetailsSkeleton } from './TrackingDetailsSkeleton';
import { FinalizedNotice, NotFoundNotice } from './TrackingDetailsGates';
import { TrackingHeader } from './TrackingHeader';
import { TransactionInfoCard } from './TransactionInfoCard';

export const TrackingDetails = () => {
    const tracking = useTrackingDetails();
    const {
        navigate,
        referenceId,
        queryClient,
        txLoading,
        recordLoading,
        docsLoading,
        txDetail,
        displayTxDetail,
        displayStages,
        displayStageDocuments,
        finalizedStatus,
        shouldShowFinalizedNotice,
        hasCompletionSnapshot,
        isEditModalOpen,
        setIsEditModalOpen,
        isRemarkModalOpen,
        setIsRemarkModalOpen,
        isUploadOpen,
        setIsUploadOpen,
        selectedStageIndex,
        uploadingStage,
        applicabilityStage,
        deletingDocId,
        uploadError,
        setUploadError,
        completionCountdown,
        completionRedirectTarget,
        previewFile,
        setPreviewFile,
        handlePreviewDoc,
        handleStageUploadClick,
        handleReplaceDoc,
        handleDeleteDoc,
        handleStageApplicabilityChange,
        handleUpload,
        getStatusStyle,
        getStageStatusFromDoc,
        getImportDisplayStatus,
        getExportDisplayStatus,
    } = tracking;

    if ((txLoading || recordLoading || docsLoading) && !hasCompletionSnapshot) {
        return <TrackingDetailsSkeleton />;
    }

    if (shouldShowFinalizedNotice && referenceId && completionCountdown === null) {
        return (
            <FinalizedNotice
                referenceId={referenceId}
                finalizedStatus={finalizedStatus}
                onBack={() => navigate(-1)}
                onOpenDocuments={() => navigate(appRoutes.documentDetail.replace(':ref', encodeURIComponent(referenceId)))}
            />
        );
    }

    if (!displayTxDetail) {
        return <NotFoundNotice referenceId={referenceId} onBack={() => navigate(-1)} />;
    }

    const { mapped: transaction, isImport } = displayTxDetail;

    const notApplicableStages = new Set(displayTxDetail.raw.not_applicable_stages ?? []);
    const uploadedStageTypes = displayStages
        .filter((_, index) => (displayStageDocuments[index]?.length ?? 0) > 0)
        .map((stage) => stage.type);
    const displayStatus = isImport
        ? getImportDisplayStatus(uploadedStageTypes)
        : getExportDisplayStatus(uploadedStageTypes);

    const s = getStatusStyle(displayStatus);

    const firstEmptyIdx = displayStages.findIndex((stage, i) => {
        const documents = displayStageDocuments[i] ?? [];
        return documents.length === 0 && !notApplicableStages.has(stage.type);
    });
    const stageStatuses = displayStages.map((stage, i) =>
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
    const importTx = isImport ? (transaction as ImportTransaction) : null;
    const exportTx = !isImport ? (transaction as ExportTransaction) : null;
    const openRemarksCount = transaction.open_remarks_count ?? 0;

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

            {openRemarksCount > 0 && (
                <button
                    type="button"
                    onClick={() => setIsRemarkModalOpen(true)}
                    className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-red-500/25 bg-red-50 px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500/45 hover:bg-red-50/80 dark:border-red-500/30 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                >
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:text-red-300">
                            <Icon name="flag" className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-black text-red-700 dark:text-red-200">
                                Action required: {openRemarksCount} open admin remark{openRemarksCount === 1 ? '' : 's'}
                            </span>
                            <span className="mt-1 block text-sm text-red-700/80 dark:text-red-200/75">
                                Review the admin notes before continuing document uploads or status updates.
                            </span>
                        </span>
                    </div>
                    <span className="hidden shrink-0 rounded-lg border border-red-500/25 bg-white/70 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors group-hover:bg-white dark:bg-red-950/30 dark:text-red-200 sm:inline-flex">
                        Review remarks
                    </span>
                </button>
            )}

            <TransactionInfoCard
                transaction={transaction}
                isImport={isImport}
                importTx={importTx}
                exportTx={exportTx}
                stages={displayStages}
                stageStatuses={stageStatuses}
                statusColor={s.color}
            />

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

            {completionCountdown !== null && (
                <CompletionBanner
                    countdown={completionCountdown}
                    label={completionRedirectTarget?.label ?? (txDetail?.isImport ? 'Import' : 'Export')}
                    onOpenDocuments={() =>
                        navigate(appRoutes.documentDetail.replace(':ref', encodeURIComponent(transaction.ref)))
                    }
                />
            )}

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
                    const allDocs = Object.values(displayStageDocuments).flat();
                    const doc = allDocs.find((d) => d.filename === previewFile.name);
                    if (doc) trackingApi.downloadDocument(doc.id, doc.filename);
                } : undefined}
            />

            <EditTransactionModal
                key={`${isImport ? 'import' : 'export'}-${displayTxDetail.raw?.id ?? 'new'}-${isEditModalOpen ? 'open' : 'closed'}`}
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
