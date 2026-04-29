import React, { useEffect, useMemo, useRef, useState } from 'react';
// Note: derived-state pattern below avoids react-hooks/set-state-in-effect by
// hydrating from the resume query during render with an identity guard,
// per https://react.dev/learn/you-might-not-need-an-effect.

import type { LegacyBatch } from '../types/legacyBatch.types';
import {
    DEFAULT_META,
    LEGACY_LARGE_BATCH_WARNING_FILE_COUNT,
    buildEmptySummary,
    buildPreflightReport,
    buildSummaryFromFiles,
    buildTreeFromFiles,
    getMissingMetadataFields,
    getRootFolderName,
    shouldIgnoreLegacyFile,
    validateLegacyFiles,
    type BatchMeta,
    type FolderSummary,
    type PreflightReport,
    type ProgressState,
    type RejectedLegacyFile,
    type UploadPhase,
} from '../utils/legacyUpload.utils';
import { buildPreviewBatch } from '../utils/legacyPreviewBatch.utils';
import { runLegacyUploadPipeline } from '../utils/legacyUploadPipeline';
import { useLegacyBatch } from './useLegacyBatch';
import { useLegacyBatchMutations } from './useLegacyBatchMutations';

export interface UseLegacyUploadOrchestratorArgs {
    resumeBatchId?: string | null;
    onResumeCleared?: () => void;
}

export interface UseLegacyUploadOrchestratorResult {
    phase: UploadPhase;
    isDragging: boolean;
    setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
    selectedFiles: File[];
    rejectedFiles: RejectedLegacyFile[];
    folderSummary: FolderSummary | null;
    meta: BatchMeta;
    setMeta: React.Dispatch<React.SetStateAction<BatchMeta>>;
    progress: ProgressState;
    activeBatch: LegacyBatch | null;
    viewingBatch: LegacyBatch | null;
    setViewingBatch: React.Dispatch<React.SetStateAction<LegacyBatch | null>>;
    errorMessage: string;
    isCancellingUpload: boolean;
    resumeBatch: LegacyBatch | undefined;
    preflight: PreflightReport | null;
    folderInputRef: React.RefObject<HTMLInputElement | null>;
    resumeRootMismatch: boolean;
    hasRejectedFiles: boolean;
    hasUploadableFiles: boolean;
    isUploadReady: boolean;
    isLargeBatch: boolean;
    handleFolderInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (event: React.DragEvent) => void;
    handleReset: () => void;
    performUpload: () => Promise<void>;
    handleCancelUpload: () => void;
    showBrowser: () => void;
}

export function useLegacyUploadOrchestrator({
    resumeBatchId,
    onResumeCleared,
}: UseLegacyUploadOrchestratorArgs): UseLegacyUploadOrchestratorResult {
    const [phase, setPhase] = useState<UploadPhase>('empty');
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [rejectedFiles, setRejectedFiles] = useState<RejectedLegacyFile[]>([]);
    const [folderSummary, setFolderSummary] = useState<FolderSummary | null>(null);
    const [meta, setMeta] = useState<BatchMeta>(DEFAULT_META);
    const [progress, setProgress] = useState<ProgressState>({
        total: 0,
        done: 0,
        failed: 0,
        currentItem: '',
        status: 'Waiting for upload',
    });
    const [activeBatch, setActiveBatch] = useState<LegacyBatch | null>(null);
    const [viewingBatch, setViewingBatch] = useState<LegacyBatch | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCancellingUpload, setIsCancellingUpload] = useState(false);

    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const cancelRequestedRef = useRef(false);
    const currentUploadControllerRef = useRef<AbortController | null>(null);
    const mutations = useLegacyBatchMutations();
    const { data: resumeBatch } = useLegacyBatch(resumeBatchId, Boolean(resumeBatchId));

    useEffect(() => {
        return () => {
            cancelRequestedRef.current = true;
            currentUploadControllerRef.current?.abort();
        };
    }, []);

    // Hydrate from resume query during render with an identity guard so the
    // sync happens in a single render pass, satisfying react-hooks/set-state-in-effect.
    const [hydratedResumeBatchId, setHydratedResumeBatchId] = useState<string | null>(null);
    if (
        resumeBatchId
        && resumeBatch
        && resumeBatch.id !== hydratedResumeBatchId
        && activeBatch?.id !== resumeBatch.id
    ) {
        setHydratedResumeBatchId(resumeBatch.id);
        setActiveBatch(resumeBatch);
        setMeta({
            batchName: resumeBatch.batchName,
            yearFrom: resumeBatch.metadata.yearFrom,
            yearTo: resumeBatch.metadata.yearTo,
            useYearRange: resumeBatch.metadata.yearFrom !== resumeBatch.metadata.yearTo,
            department: resumeBatch.metadata.department,
            notes: resumeBatch.metadata.notes,
        });
        setPhase('empty');
        setErrorMessage('');
    }

    const localTree = useMemo(() => {
        if (!folderSummary || selectedFiles.length === 0) {
            return null;
        }

        return buildTreeFromFiles(selectedFiles, folderSummary.rootName);
    }, [folderSummary, selectedFiles]);

    const previewBatch = useMemo<LegacyBatch | null>(
        () => buildPreviewBatch({ activeBatch, folderSummary, localTree, meta, selectedFiles }),
        [activeBatch, folderSummary, localTree, meta, selectedFiles],
    );

    const preflight = useMemo(() => {
        if (!folderSummary) {
            return null;
        }

        return buildPreflightReport(folderSummary, Boolean(activeBatch?.canResume));
    }, [activeBatch?.canResume, folderSummary]);

    const missingMetadataFields = getMissingMetadataFields(meta);
    const resumeRootMismatch = Boolean(activeBatch && folderSummary && activeBatch.rootFolder !== folderSummary.rootName);
    const hasRejectedFiles = rejectedFiles.length > 0;
    const hasUploadableFiles = selectedFiles.length > 0;
    const isMetadataComplete = missingMetadataFields.length === 0 && !resumeRootMismatch;
    const isUploadReady = isMetadataComplete && hasUploadableFiles && !hasRejectedFiles;
    const isLargeBatch = (folderSummary?.fileCount ?? 0) >= LEGACY_LARGE_BATCH_WARNING_FILE_COUNT;

    const selectFiles = (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        const validationResult = validateLegacyFiles(files);
        const summarySourceFiles = validationResult.validFiles.length > 0
            ? validationResult.validFiles
            : files.filter((file) => !shouldIgnoreLegacyFile(file.webkitRelativePath || file.name));
        const summary = summarySourceFiles.length > 0
            ? buildSummaryFromFiles(summarySourceFiles)
            : buildEmptySummary(getRootFolderName(files));

        setSelectedFiles(validationResult.validFiles);
        setRejectedFiles(validationResult.rejectedFiles);
        setFolderSummary(summary);
        setPhase('selected');
        setErrorMessage('');
    };

    const handleFolderInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        selectFiles(Array.from(event.target.files ?? []));
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        selectFiles(Array.from(event.dataTransfer.files ?? []));
    };

    const handleReset = () => {
        setSelectedFiles([]);
        setRejectedFiles([]);
        setFolderSummary(null);
        setMeta(DEFAULT_META);
        setProgress({
            total: 0,
            done: 0,
            failed: 0,
            currentItem: '',
            status: 'Waiting for upload',
        });
        cancelRequestedRef.current = false;
        currentUploadControllerRef.current?.abort();
        currentUploadControllerRef.current = null;
        setIsCancellingUpload(false);
        setActiveBatch(null);
        setViewingBatch(null);
        setErrorMessage('');
        setPhase('empty');
        onResumeCleared?.();

        if (folderInputRef.current) {
            folderInputRef.current.value = '';
        }
    };

    const performUpload = async () => {
        if (!folderSummary || selectedFiles.length === 0) {
            return;
        }

        await runLegacyUploadPipeline({
            activeBatch,
            folderSummary,
            selectedFiles,
            meta,
            cancelRequestedRef,
            currentUploadControllerRef,
            setActiveBatch,
            setProgress,
            setIsCancellingUpload,
            setPhase,
            setErrorMessage,
            onResumeCleared,
            mutations: {
                createBatch: mutations.createBatch,
                appendManifest: mutations.appendManifest,
                signUploads: mutations.signUploads,
                completeUploads: mutations.completeUploads,
                finalizeBatch: mutations.finalizeBatch,
            },
        });
    };

    const handleCancelUpload = () => {
        cancelRequestedRef.current = true;
        setIsCancellingUpload(true);
        setProgress((current) => ({
            ...current,
            status: 'Stopping upload',
            currentItem: 'Waiting for the current request to stop safely...',
        }));
        currentUploadControllerRef.current?.abort();
    };

    const showBrowser = () => {
        if (activeBatch?.tree) {
            setViewingBatch(activeBatch);
            return;
        }

        if (previewBatch) {
            setViewingBatch(previewBatch);
        }
    };

    return {
        phase,
        isDragging,
        setIsDragging,
        selectedFiles,
        rejectedFiles,
        folderSummary,
        meta,
        setMeta,
        progress,
        activeBatch,
        viewingBatch,
        setViewingBatch,
        errorMessage,
        isCancellingUpload,
        resumeBatch,
        preflight,
        folderInputRef,
        resumeRootMismatch,
        hasRejectedFiles,
        hasUploadableFiles,
        isUploadReady,
        isLargeBatch,
        handleFolderInput,
        handleDrop,
        handleReset,
        performUpload,
        handleCancelUpload,
        showBrowser,
    };
}
