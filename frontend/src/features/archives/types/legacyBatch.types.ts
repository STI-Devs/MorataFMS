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

export type LegacyBatchModule = 'brokerage' | 'notarial' | 'legal';

export interface LegacyBatchUploadSummary {
    expected: number;
    uploaded: number;
    failed: number;
    remaining: number;
}

export type LegacyBatchZipExportStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'expired';

export interface LegacyBatchZipExport {
    id: string;
    legacyBatchId: string | null;
    legacyBatch?: {
        id: string;
        batchName: string;
        rootFolder: string;
        module: LegacyBatchModule;
        moduleLabel: string;
    } | null;
    status: LegacyBatchZipExportStatus;
    statusLabel: string;
    filename: string;
    fileSizeBytes: number;
    fileCount: number;
    errorMessage: string | null;
    requestedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    expiresAt: string | null;
    canDownload: boolean;
    requestedBy?: {
        id: number;
        name: string;
    } | null;
}

export interface LegacyBatchZipExportListParams {
    module?: LegacyBatchModule;
    status?: LegacyBatchZipExportStatus;
    page?: number;
    per_page?: number;
}

export interface LegacyBatchZipExportListResponse {
    data: LegacyBatchZipExport[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number | null;
        to: number | null;
    };
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
    module: LegacyBatchModule;
    moduleLabel: string;
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
    canRequestZip: boolean;
    zipExport: LegacyBatchZipExport | null;
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
    module?: LegacyBatchModule;
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
