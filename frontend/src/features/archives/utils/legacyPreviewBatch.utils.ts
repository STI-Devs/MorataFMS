import {
    type BatchMeta,
    type FolderSummary,
    buildCoverageYearLabel,
    formatBytes,
    normalizeRelativePath,
} from './legacyUpload.utils';
import type {
    FileNode,
    LegacyBatch,
    LegacyBatchMetadata,
    LegacyBatchSummary,
} from '../types/legacyBatch.types';

interface BuildPreviewBatchArgs {
    activeBatch: LegacyBatch | null;
    folderSummary: FolderSummary | null;
    localTree: FileNode | null;
    meta: BatchMeta;
    selectedFiles: File[];
}

export function buildPreviewBatch({
    activeBatch,
    folderSummary,
    localTree,
    meta,
    selectedFiles,
}: BuildPreviewBatchArgs): LegacyBatch | null {
    if (!folderSummary || !localTree) {
        return activeBatch;
    }

    const metadata: LegacyBatchMetadata = {
        year: buildCoverageYearLabel(meta.yearFrom, meta.yearTo),
        yearFrom: meta.yearFrom,
        yearTo: meta.yearTo,
        department: meta.department,
        notes: meta.notes,
        preserveNames: true,
        legacyReferenceOnly: true,
    };

    const summary: LegacyBatchSummary = activeBatch ?? {
        id: 'local-preview',
        batchName: meta.batchName || folderSummary.rootName,
        rootFolder: folderSummary.rootName,
        uploadedBy: 'Current User',
        uploadDate: new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(folderSummary.selectedAt),
        status: 'draft',
        statusLabel: 'Draft',
        fileCount: folderSummary.fileCount,
        uploadedFileCount: 0,
        failedFileCount: 0,
        pendingFileCount: folderSummary.fileCount,
        totalSize: formatBytes(folderSummary.totalBytes),
        totalSizeBytes: folderSummary.totalBytes,
        metadata,
        uploadSummary: {
            expected: folderSummary.fileCount,
            uploaded: 0,
            failed: 0,
            remaining: folderSummary.fileCount,
        },
        canResume: true,
    };

    return {
        ...summary,
        batchName: meta.batchName || summary.batchName,
        metadata,
        tree: localTree,
        remainingRelativePaths: Array.from(
            new Set(
                selectedFiles.map((file) =>
                    normalizeRelativePath(file.webkitRelativePath || `${folderSummary.rootName}/${file.name}`),
                ),
            ),
        ),
        startedAt: activeBatch?.startedAt ?? null,
        completedAt: activeBatch?.completedAt ?? null,
        lastActivityAt: activeBatch?.lastActivityAt ?? null,
    };
}
