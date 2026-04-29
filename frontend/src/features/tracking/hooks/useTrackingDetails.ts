import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useTransactionSyncSubscription } from '../../../hooks/useTransactionSyncSubscription';
import { appRoutes } from '../../../lib/appRoutes';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument, DocumentableType } from '../types';
import { trackingKeys } from '../utils/queryKeys';
import {
    EXPORT_STAGES,
    IMPORT_STAGES,
    getExportDisplayStatus,
    getImportDisplayStatus,
    getStageStatusFromDoc,
    getStatusStyle,
} from '../utils/stageUtils';
import type { TransactionDetailResult } from '../utils/transactionDetail';
import { useDocumentPreview } from './useDocumentPreview';
import { useTransactionDetail } from './useTransactionDetail';
import { useAddDocumentToCache, useTransactionDocuments } from './useTransactionDocuments';

type CompletionRedirectTarget = {
    label: 'Import' | 'Export';
    route: string;
};

type StageDocumentsByIndex = Record<number, ApiDocument[]>;

type CompletionSnapshot = {
    txDetail: TransactionDetailResult;
    stageDocuments: StageDocumentsByIndex;
};

export function useTrackingDetails() {
    const navigate = useNavigate();
    const { referenceId } = useParams();
    const queryClient = useQueryClient();
    const addDocToCache = useAddDocumentToCache();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [uploadingStage, setUploadingStage] = useState<number | null>(null);
    const [applicabilityStage, setApplicabilityStage] = useState<string | null>(null);
    const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
    const [replacingDoc, setReplacingDoc] = useState<ApiDocument | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [completionCountdown, setCompletionCountdown] = useState<number | null>(null);
    const [completionRedirectTarget, setCompletionRedirectTarget] = useState<CompletionRedirectTarget | null>(null);
    const [completionSnapshot, setCompletionSnapshot] = useState<CompletionSnapshot | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { data: txDetail, isLoading: txLoading } = useTransactionDetail(referenceId);
    const hasCompletionSnapshot = completionCountdown !== null && completionSnapshot !== null;
    const shouldResolveRecordFallback = !!referenceId && !txLoading && !txDetail && !hasCompletionSnapshot;
    const { data: recordDetail, isLoading: recordLoading } = useTransactionDetail(referenceId, {
        scope: 'record',
        enabled: shouldResolveRecordFallback,
    });

    const stages = txDetail?.isImport ? IMPORT_STAGES : EXPORT_STAGES;
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

    useEffect(() => {
        if (completionCountdown === null || !completionRedirectTarget) return;
        if (completionCountdown <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            navigate(completionRedirectTarget.route);
            return;
        }
        countdownRef.current = setInterval(() => {
            setCompletionCountdown((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [completionCountdown, completionRedirectTarget, navigate]);

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
            queryClient.setQueryData<ApiDocument[]>(
                trackingKeys.documents.list(docableType, txDetail.raw.id),
                (prev = []) => prev.filter((d) => d.id !== doc.id),
            );
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

    return {
        // routing & nav
        navigate,
        referenceId,
        queryClient,
        // loading state
        txLoading,
        recordLoading,
        docsLoading,
        // detail data
        txDetail,
        displayTxDetail,
        displayStages,
        displayStageDocuments,
        finalizedStatus,
        shouldShowFinalizedNotice,
        hasCompletionSnapshot,
        // modal state
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
        // completion state
        completionCountdown,
        completionRedirectTarget,
        // preview
        previewFile,
        setPreviewFile,
        handlePreviewDoc,
        // handlers
        handleStageUploadClick,
        handleReplaceDoc,
        handleDeleteDoc,
        handleStageApplicabilityChange,
        handleUpload,
        // status helpers (proxied for convenience)
        getStatusStyle,
        getStageStatusFromDoc,
        getImportDisplayStatus,
        getExportDisplayStatus,
    };
}
