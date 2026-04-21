import api from '../../../lib/axios';
import type {
    CreateLegacyBatchPayload,
    FileNode,
    LegacyBatch,
    LegacyBatchListResponse,
    LegacyBatchSummary,
    SignLegacyBatchUploadsResponse,
} from '../types/legacyBatch.types';

type LegacyBatchApiResource = {
    id: string;
    batch_name: string;
    root_folder: string;
    upload_date: string | null;
    status: LegacyBatchSummary['status'];
    status_label: string;
    file_count: number;
    uploaded_file_count: number;
    failed_file_count: number;
    pending_file_count: number;
    total_size_bytes: number;
    uploaded_by?: {
        id: number;
        name: string;
    };
    metadata: {
        year: number;
        department: string;
        notes: string | null;
        preserve_names: boolean;
        legacy_reference_only: boolean;
    };
    upload_summary: {
        expected: number;
        uploaded: number;
        failed: number;
        remaining: number;
    };
    can_resume: boolean;
};

type LegacyBatchDetailApiResource = LegacyBatchApiResource & {
    tree: FileNode | null;
    remaining_relative_paths: string[];
    started_at: string | null;
    completed_at: string | null;
    last_activity_at: string | null;
};

type LegacyBatchListApiResponse = {
    data: LegacyBatchApiResource[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number | null;
        to: number | null;
    };
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** unitIndex;

    return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const formatDisplayDate = (isoDate: string | null): string => {
    if (!isoDate) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(isoDate));
};

const mapSummary = (resource: LegacyBatchApiResource): LegacyBatchSummary => ({
    id: resource.id,
    batchName: resource.batch_name,
    rootFolder: resource.root_folder,
    uploadedBy: resource.uploaded_by?.name ?? 'Unknown user',
    uploadedById: resource.uploaded_by?.id,
    uploadDate: formatDisplayDate(resource.upload_date),
    status: resource.status,
    statusLabel: resource.status_label,
    fileCount: resource.file_count,
    uploadedFileCount: resource.uploaded_file_count,
    failedFileCount: resource.failed_file_count,
    pendingFileCount: resource.pending_file_count,
    totalSize: formatBytes(resource.total_size_bytes),
    totalSizeBytes: resource.total_size_bytes,
    metadata: {
        year: String(resource.metadata.year),
        department: resource.metadata.department,
        notes: resource.metadata.notes ?? '',
        preserveNames: resource.metadata.preserve_names,
        legacyReferenceOnly: resource.metadata.legacy_reference_only,
    },
    uploadSummary: resource.upload_summary,
    canResume: resource.can_resume,
});

const mapDetail = (resource: LegacyBatchDetailApiResource): LegacyBatch => ({
    ...mapSummary(resource),
    tree: resource.tree,
    remainingRelativePaths: resource.remaining_relative_paths,
    startedAt: resource.started_at,
    completedAt: resource.completed_at,
    lastActivityAt: resource.last_activity_at,
});

export const legacyBatchApi = {
    getLegacyBatches: async ({
        page = 1,
        perPage = 20,
    }: {
        page?: number;
        perPage?: number;
    } = {}): Promise<LegacyBatchListResponse> => {
        const response = await api.get<LegacyBatchListApiResponse>('/api/legacy-batches', {
            params: {
                page,
                per_page: perPage,
            },
        });

        return {
            items: response.data.data.map(mapSummary),
            pagination: {
                currentPage: response.data.meta.current_page,
                perPage: response.data.meta.per_page,
                total: response.data.meta.total,
                lastPage: response.data.meta.last_page,
                from: response.data.meta.from,
                to: response.data.meta.to,
            },
        };
    },

    getLegacyBatch: async (batchId: string): Promise<LegacyBatch> => {
        const response = await api.get<{ data: LegacyBatchDetailApiResource }>(`/api/legacy-batches/${batchId}`);
        return mapDetail(response.data.data);
    },

    createLegacyBatch: async (payload: CreateLegacyBatchPayload): Promise<LegacyBatch> => {
        const response = await api.post<{ data: LegacyBatchDetailApiResource }>('/api/legacy-batches', {
            batch_name: payload.batchName,
            root_folder: payload.rootFolder,
            year: Number(payload.year),
            department: payload.department,
            notes: payload.notes || null,
            files: payload.files.map((file) => ({
                relative_path: file.relativePath,
                size_bytes: file.sizeBytes,
                mime_type: file.mimeType,
                modified_at: file.modifiedAt,
            })),
        });

        return mapDetail(response.data.data);
    },

    signLegacyBatchUploads: async (
        batchId: string,
        relativePaths: string[],
    ): Promise<SignLegacyBatchUploadsResponse> => {
        const response = await api.post<{
            data: {
                batch_id: string;
                status: LegacyBatchSummary['status'];
                uploads: Array<{
                    relative_path: string;
                    upload_url: string;
                    headers: Record<string, string>;
                    method: 'PUT';
                }>;
            };
        }>(`/api/legacy-batches/${batchId}/files/sign`, {
            relative_paths: relativePaths,
        });

        return {
            batchId: response.data.data.batch_id,
            status: response.data.data.status,
            uploads: response.data.data.uploads.map((upload) => ({
                relativePath: upload.relative_path,
                uploadUrl: upload.upload_url,
                headers: upload.headers,
                method: upload.method,
            })),
        };
    },

    completeLegacyBatchUploads: async (batchId: string, relativePaths: string[]): Promise<LegacyBatchSummary> => {
        const response = await api.post<{ data: LegacyBatchApiResource }>(`/api/legacy-batches/${batchId}/files/complete`, {
            relative_paths: relativePaths,
        });

        return mapSummary(response.data.data);
    },

    finalizeLegacyBatch: async (batchId: string): Promise<LegacyBatch> => {
        const response = await api.post<{ data: LegacyBatchDetailApiResource }>(`/api/legacy-batches/${batchId}/finalize`);
        return mapDetail(response.data.data);
    },

    deleteLegacyBatch: async (batchId: string): Promise<void> => {
        await api.delete(`/api/legacy-batches/${batchId}`);
    },

    downloadLegacyBatchFile: async (batchId: string, fileId: string, filename: string): Promise<void> => {
        const response = await api.get(`/api/legacy-batches/${batchId}/files/${fileId}/download`, {
            responseType: 'blob',
        });

        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    },
};
