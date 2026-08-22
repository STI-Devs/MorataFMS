import { FilePreviewModal } from '../../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../../components/modals/UploadModal';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../../components/ui/card';
import { Flag } from 'lucide-react';
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
                onOpenDocuments={() =>
                    navigate(`${appRoutes.documents}?ref=${encodeURIComponent(referenceId)}`)
                }
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
        <div className="flex flex-col space-y-4 pb-8">
            {/* Header */}
            <TrackingHeader
                transaction={{ ...transaction, status: displayStatus }}
                onBack={() => navigate(-1)}
                onRemarksClick={() => setIsRemarkModalOpen(true)}
                onEditClick={() => setIsEditModalOpen(true)}
                statusColor={s.color}
                statusBg={s.bg}
            />

            {/* Admin Remarks Notice Banner */}
            {openRemarksCount > 0 && (
                <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsRemarkModalOpen(true)}
                    className="h-auto w-full items-center justify-between gap-4 rounded-xl border border-destructive/30 p-4 text-left shadow-2xs cursor-pointer"
                >
                    <span className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                            <Flag className="size-4" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold">
                                Action required: {openRemarksCount} open admin remark
                                {openRemarksCount === 1 ? '' : 's'}
                            </span>
                            <span className="mt-0.5 block text-xs text-white/80">
                                Review the admin notes before continuing document uploads or status updates.
                            </span>
                        </span>
                    </span>
                    <span className="hidden shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold shadow-2xs sm:inline-flex">
                        Review remarks
                    </span>
                </Button>
            )}

            {/* Metric KPI Cards (4-Card Grid) */}
            <TransactionInfoCard
                transaction={transaction}
                isImport={isImport}
                importTx={importTx}
                exportTx={exportTx}
                stages={displayStages}
                stageStatuses={stageStatuses}
                statusColor={s.color}
            />

            {/* Processing Stages Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <div>
                        <CardTitle className="text-lg font-bold">Processing Stages</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Manage customs milestones, required document attachments, and stage clearances.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-semibold">
                        {isImport ? 'Import' : 'Export'} Workflow
                    </Badge>
                </CardHeader>

                <CardContent className="p-0 divide-y">
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
                </CardContent>
            </Card>

            {/* Completion Banner */}
            {completionCountdown !== null && (
                <CompletionBanner
                    countdown={completionCountdown}
                    label={
                        completionRedirectTarget?.label ??
                        (txDetail?.isImport ? 'Import' : 'Export')
                    }
                    onOpenDocuments={() =>
                        navigate(
                            `${appRoutes.documents}?ref=${encodeURIComponent(transaction.ref)}`,
                        )
                    }
                />
            )}

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => {
                    setIsUploadOpen(false);
                    setUploadError(null);
                }}
                onUpload={handleUpload}
                title={
                    selectedStageIndex !== null ? displayStages[selectedStageIndex].title : ''
                }
                isLoading={uploadingStage !== null}
                errorMessage={uploadError ?? undefined}
            />

            {/* Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
                onDownload={
                    previewFile
                        ? () => {
                              const allDocs = Object.values(displayStageDocuments).flat();
                              const doc = allDocs.find((d) => d.filename === previewFile.name);
                              if (doc) trackingApi.downloadDocument(doc.id, doc.filename);
                          }
                        : undefined
                }
            />

            {/* Edit Modal */}
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

            {/* Remark Viewer Modal */}
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
