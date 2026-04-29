import {
    LEGACY_MANIFEST_CHUNK_SIZE,
    LEGACY_SIGNED_UPLOAD_CHUNK_SIZE,
    type BatchMeta,
    type FolderSummary,
    type ProgressState,
    chunk,
    getLegacyUploadErrorMessage,
    normalizeRelativePath,
} from './legacyUpload.utils';
import type {
    CreateLegacyBatchPayload,
    LegacyBatch,
    SignLegacyBatchUploadsResponse,
} from '../types/legacyBatch.types';

type ManifestFile = CreateLegacyBatchPayload['files'][number];

type AsyncMutation<TPayload, TResult> = {
    mutateAsync: (payload: TPayload) => Promise<TResult>;
};

export interface RunLegacyUploadPipelineArgs {
    activeBatch: LegacyBatch | null;
    folderSummary: FolderSummary;
    selectedFiles: File[];
    meta: BatchMeta;
    cancelRequestedRef: React.MutableRefObject<boolean>;
    currentUploadControllerRef: React.MutableRefObject<AbortController | null>;
    setActiveBatch: (batch: LegacyBatch) => void;
    setProgress: React.Dispatch<React.SetStateAction<ProgressState>>;
    setIsCancellingUpload: (value: boolean) => void;
    setPhase: (phase: 'uploading' | 'complete' | 'failed' | 'interrupted') => void;
    setErrorMessage: (message: string) => void;
    onResumeCleared?: () => void;
    mutations: {
        createBatch: AsyncMutation<CreateLegacyBatchPayload, LegacyBatch>;
        appendManifest: AsyncMutation<{ batchId: string; files: ManifestFile[] }, unknown>;
        signUploads: AsyncMutation<{ batchId: string; relativePaths: string[] }, SignLegacyBatchUploadsResponse>;
        completeUploads: AsyncMutation<{ batchId: string; relativePaths: string[] }, unknown>;
        finalizeBatch: AsyncMutation<string, LegacyBatch>;
    };
}

export async function runLegacyUploadPipeline(args: RunLegacyUploadPipelineArgs): Promise<void> {
    const {
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
        mutations: { createBatch, appendManifest, signUploads, completeUploads, finalizeBatch },
    } = args;

    cancelRequestedRef.current = false;
    setIsCancellingUpload(false);

    const filesByPath = new Map(
        selectedFiles.map((file) => [
            normalizeRelativePath(file.webkitRelativePath || `${folderSummary.rootName}/${file.name}`),
            file,
        ]),
    );
    const manifestFiles: ManifestFile[] = Array.from(filesByPath.entries()).map(([relativePath, file]) => ({
        relativePath,
        sizeBytes: file.size,
        mimeType: file.type || undefined,
        modifiedAt: new Date(file.lastModified).toISOString(),
    }));
    const manifestChunks = chunk(manifestFiles, LEGACY_MANIFEST_CHUNK_SIZE);
    const isResumeUpload = Boolean(activeBatch);

    setPhase('uploading');
    setErrorMessage('');

    try {
        let batch = activeBatch;

        if (!batch) {
            const [initialManifestChunk, ...remainingManifestChunks] = manifestChunks;

            batch = await createBatch.mutateAsync({
                batchName: meta.batchName,
                rootFolder: folderSummary.rootName,
                yearFrom: meta.yearFrom,
                yearTo: meta.yearTo,
                department: meta.department,
                notes: meta.notes,
                expectedFileCount: folderSummary.fileCount,
                totalSizeBytes: folderSummary.totalBytes,
                files: initialManifestChunk,
            });
            setActiveBatch(batch);

            if (remainingManifestChunks.length > 0) {
                for (const [chunkIndex, manifestChunk] of remainingManifestChunks.entries()) {
                    setProgress((current) => ({
                        ...current,
                        total: folderSummary.fileCount,
                        status: `Registering manifest ${chunkIndex + 2} of ${manifestChunks.length}`,
                        currentItem: `Recording ${manifestChunk.length} files before upload begins...`,
                    }));

                    await appendManifest.mutateAsync({
                        batchId: batch.id,
                        files: manifestChunk,
                    });
                }
            }
        }

        const uploadTargets = isResumeUpload && batch.remainingRelativePaths.length > 0
            ? batch.remainingRelativePaths
            : Array.from(filesByPath.keys());

        const matchedTargets = uploadTargets.filter((relativePath) => filesByPath.has(relativePath));

        if (matchedTargets.length === 0) {
            throw new Error('The selected folder does not contain the remaining files for this batch. Please choose the same root folder used when the batch was created.');
        }

        let done = batch.uploadSummary.uploaded;
        let failed = 0;

        setProgress({
            total: batch.uploadSummary.expected,
            done,
            failed,
            currentItem: 'Preparing signed upload links...',
            status: isResumeUpload ? 'Resuming batch upload' : 'Uploading batch',
        });

        for (const group of chunk(matchedTargets, LEGACY_SIGNED_UPLOAD_CHUNK_SIZE)) {
            if (cancelRequestedRef.current) {
                break;
            }

            const signed = await signUploads.mutateAsync({
                batchId: batch.id,
                relativePaths: group,
            });

            const successfulPaths: string[] = [];

            for (const upload of signed.uploads) {
                if (cancelRequestedRef.current) {
                    break;
                }

                const file = filesByPath.get(upload.relativePath);

                if (!file) {
                    failed += 1;
                    setProgress((current) => ({
                        ...current,
                        failed,
                        currentItem: `Skipping ${upload.relativePath} because it is missing from the selected folder.`,
                    }));
                    continue;
                }

                setProgress((current) => ({
                    ...current,
                    currentItem: `Uploading ${upload.relativePath}...`,
                }));

                try {
                    const uploadController = new AbortController();
                    currentUploadControllerRef.current = uploadController;
                    const response = await fetch(upload.uploadUrl, {
                        method: upload.method,
                        headers: upload.headers,
                        body: file,
                        signal: uploadController.signal,
                    });
                    currentUploadControllerRef.current = null;

                    if (!response.ok) {
                        throw new Error(`Upload failed with status ${response.status}.`);
                    }

                    successfulPaths.push(upload.relativePath);
                    done += 1;
                    setProgress((current) => ({
                        ...current,
                        done,
                        currentItem: `Uploaded ${upload.relativePath}`,
                    }));
                } catch (error) {
                    currentUploadControllerRef.current = null;

                    if (cancelRequestedRef.current || (error instanceof DOMException && error.name === 'AbortError')) {
                        setProgress((current) => ({
                            ...current,
                            status: 'Stopping upload',
                            currentItem: 'Preserving uploaded files before exit...',
                        }));
                        break;
                    }

                    failed += 1;
                    setProgress((current) => ({
                        ...current,
                        failed,
                        currentItem: `Failed to upload ${upload.relativePath}`,
                    }));
                }
            }

            if (successfulPaths.length > 0) {
                await completeUploads.mutateAsync({
                    batchId: batch.id,
                    relativePaths: successfulPaths,
                });
            }
        }

        const finalizedBatch = await finalizeBatch.mutateAsync(batch.id);
        const wasCancelled = cancelRequestedRef.current;
        setActiveBatch(finalizedBatch);
        setIsCancellingUpload(false);
        cancelRequestedRef.current = false;

        if (finalizedBatch.status === 'completed') {
            setPhase('complete');
            setProgress((current) => ({ ...current, status: 'Completed', currentItem: '' }));
            onResumeCleared?.();
            return;
        }

        setPhase(finalizedBatch.status === 'interrupted' ? 'interrupted' : 'failed');
        setErrorMessage(
            finalizedBatch.status === 'interrupted'
                ? wasCancelled
                    ? 'Upload stopped. The batch state has been preserved and you can resume from the remaining files.'
                    : 'Some files still need to be uploaded. The batch state has been preserved and you can resume from the remaining files.'
                : 'The batch could not be finalized. Review the selected folder and try again.',
        );
    } catch (error) {
        setIsCancellingUpload(false);
        currentUploadControllerRef.current = null;
        cancelRequestedRef.current = false;
        setPhase('failed');
        setErrorMessage(getLegacyUploadErrorMessage(error));
    }
}
