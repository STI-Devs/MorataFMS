export interface FileNode {
    id?: string;
    name: string;
    type: 'folder' | 'file';
    size?: string;
    modified?: string;
    status?: 'pending' | 'uploaded' | 'failed';
    children?: FileNode[];
}

export interface LegacyBatchMetadata {
    year: string;
    yearFrom: string;
    yearTo: string;
    department: string;
    notes: string;
    preserveNames: boolean;
    legacyReferenceOnly: boolean;
}

export interface LegacyBatchUploadSummary {
    expected: number;
    uploaded: number;
    failed: number;
    remaining: number;
}

export interface LegacyBatchPagination {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
    from: number | null;
    to: number | null;
}

export interface LegacyBatchSummary {
    id: string;
    batchName: string;
    rootFolder: string;
    uploadedBy: string;
    uploadedById?: number;
    uploadDate: string;
    status: 'draft' | 'uploading' | 'interrupted' | 'processing' | 'completed' | 'failed';
    statusLabel: string;
    fileCount: number;
    uploadedFileCount: number;
    failedFileCount: number;
    pendingFileCount: number;
    totalSize: string;
    totalSizeBytes: number;
    metadata: LegacyBatchMetadata;
    uploadSummary: LegacyBatchUploadSummary;
    canResume: boolean;
}

export interface LegacyBatch extends LegacyBatchSummary {
    tree: FileNode | null;
    remainingRelativePaths: string[];
    startedAt: string | null;
    completedAt: string | null;
    lastActivityAt: string | null;
}

export interface LegacyBatchListResponse {
    items: LegacyBatchSummary[];
    pagination: LegacyBatchPagination;
}

export interface LegacyBatchManifestFile {
    relativePath: string;
    sizeBytes: number;
    mimeType?: string;
    modifiedAt?: string;
}

export interface CreateLegacyBatchPayload {
    batchName: string;
    rootFolder: string;
    yearFrom: string;
    yearTo: string;
    department: string;
    notes?: string;
    expectedFileCount?: number;
    totalSizeBytes?: number;
    files: LegacyBatchManifestFile[];
}

export interface SignLegacyBatchUploadsResponse {
    batchId: string;
    status: LegacyBatchSummary['status'];
    uploads: Array<{
        relativePath: string;
        uploadUrl: string;
        headers: Record<string, string>;
        method: 'PUT';
    }>;
}
