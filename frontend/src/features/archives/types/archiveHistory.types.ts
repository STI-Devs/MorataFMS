import type { ArchiveDocument, TransactionType } from '../../documents/types/document.types';

export type ArchiveFolderHistoryCompletion = 'all' | 'complete' | 'incomplete';

export type ArchiveFolderHistoryParams = {
    year: number;
    month: number;
    type: TransactionType;
    mine?: boolean;
    page?: number;
    per_page?: number;
    search?: string;
    completion?: ArchiveFolderHistoryCompletion;
};

export type ArchiveFolderHistoryRow = {
    bl_no: string;
    type: TransactionType;
    transaction_id: number;
    documentable_type: string;
    client: string;
    transaction_date: string;
    not_applicable_stages: string[];
    required_stages: string[];
    uploaded_stage_count: number;
    required_stage_count: number;
    is_complete: boolean;
    latest_uploaded_at: string | null;
    latest_uploader: { id: number; name: string } | null;
    documents: ArchiveDocument[];
};

export type ArchiveFolderHistorySummary = {
    total_bl_records: number;
    complete_bl_records: number;
    incomplete_bl_records: number;
    total_files: number;
    latest_uploaded_at: string | null;
};

export type ArchiveFolderHistoryMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type ArchiveFolderHistoryResponse = {
    data: ArchiveFolderHistoryRow[];
    summary: ArchiveFolderHistorySummary;
    meta: ArchiveFolderHistoryMeta;
};

export type ArchiveZipExportStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'expired';

export type ArchiveZipExport = {
    id: string;
    scope: 'folder' | 'year';
    scope_label: string;
    year: number;
    month: number | null;
    type: TransactionType | null;
    mine: boolean;
    status: ArchiveZipExportStatus;
    status_label: string;
    filename: string;
    file_size_bytes: number;
    file_count: number;
    bl_count: number;
    error_message: string | null;
    requested_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    expires_at: string | null;
    can_download: boolean;
    requested_by?: { id: number; name: string } | null;
};

export type ArchiveZipExportListParams = {
    mine?: boolean;
    status?: ArchiveZipExportStatus;
    page?: number;
    per_page?: number;
};

export type ArchiveZipExportCreateParams = {
    scope?: 'folder';
    year: number;
    month: number;
    type: TransactionType;
    mine?: boolean;
};

export type ArchiveZipExportListResponse = {
    data: ArchiveZipExport[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};
