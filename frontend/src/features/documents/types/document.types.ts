export type FileExt = 'pdf' | 'docx' | 'jpg' | string;
export type TransactionType = 'import' | 'export';

export interface TransactionDocument {
    id: number;
    name: string;
    stage: string;
    uploadDate: string;
    uploader: { name: string; initials: string; color: string };
    size: string;
    ext: FileExt;
}

export interface DocumentTransaction {
    id: number;
    type: TransactionType;
    ref: string;
    client: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    date: string;
    documents: TransactionDocument[];
}

// Mirrors the S3 path: documents/{imports|exports}/{year}/{BL}/{stage}/{timestamp}_{filename}

export interface ArchiveDocument {
    id: number;
    type: TransactionType;           // 'import' | 'export' — from path segment
    bl_no: string;                   // Bill of Lading — from path segment
    month: number;                   // Archive period month (1-12)
    client: string;                  // Client name (importer/shipper)
    selective_color?: 'green' | 'yellow' | 'red' | null; // Import only — BLSC
    destination_country?: string | null;                  // Export only — destination
    transaction_date: string;        // ISO date string (YYYY-MM-DD)
    transaction_id: number;          // Parent transaction ID (for document uploads)
    documentable_type: string;       // 'App\\Models\\ImportTransaction' | 'App\\Models\\ExportTransaction'
    stage: string;                   // e.g. 'boc', 'ppa', 'do', 'billing' — from path segment
    filename: string;                // original filename (stripped of timestamp prefix)
    formatted_size: string;          // e.g. '1.1 MB'
    size_bytes: number;              // raw byte count (for summing total storage)
    uploaded_at: string;             // ISO timestamp
    uploader: { id: number; name: string } | null;
}

export interface ArchiveYear {
    year: number;
    imports: number;
    exports: number;
    documents: ArchiveDocument[];
}

export interface DocumentTransactionListRow {
    id: number;
    type: TransactionType;
    ref: string;
    bl_no: string;
    client: string;
    date: string;
    date_label: string;
    port: string;
    vessel: string;
    status: string;
    documents_count: number;
}

export interface DocumentTransactionCounts {
    completed: number;
    imports: number;
    exports: number;
    cancelled: number;
}

export interface DocumentTransactionListResponse {
    data: DocumentTransactionListRow[];
    counts: DocumentTransactionCounts;
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export type AdminReviewTypeFilter = TransactionType | 'all';
export type AdminReviewStatusFilter = 'completed' | 'cancelled' | 'all';

export interface AdminReviewQueueParams {
    page?: number;
    per_page?: number;
    search?: string;
    type?: AdminReviewTypeFilter;
    status?: AdminReviewStatusFilter;
}

export interface AdminReviewQueueItem {
    id: number;
    type: TransactionType;
    ref: string;
    bl_number: string | null;
    client: string | null;
    assigned_user: string | null;
    status: string;
    finalized_date: string | null;
    docs_count: number;
    docs_total: number;
    has_exceptions: boolean;
}

export interface AdminReviewQueueResponse {
    data: AdminReviewQueueItem[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface AdminReviewDetailTransaction {
    id: number;
    type: TransactionType;
    ref: string;
    bl_number: string | null;
    client: string | null;
    assigned_user: string | null;
    status: string;
    finalized_date: string | null;
}

export interface AdminReviewDocumentFile {
    id: number;
    filename: string;
    size: string;
    uploaded_by: string | null;
    uploaded_at: string | null;
}

export interface AdminReviewRequiredDocument {
    type_key: string;
    label: string;
    uploaded: boolean;
    file: AdminReviewDocumentFile | null;
}

export interface AdminReviewRemark {
    id: number;
    body: string;
    author: string;
    resolved: boolean;
    created_at: string | null;
}

export interface AdminReviewSummary {
    total_uploaded: number;
    required_completed: number;
    required_total: number;
    missing_count: number;
    flagged_count: number;
    archive_ready: boolean;
}

export interface AdminReviewDetailResponse {
    transaction: AdminReviewDetailTransaction;
    required_documents: AdminReviewRequiredDocument[];
    remarks: AdminReviewRemark[];
    summary: AdminReviewSummary;
}

export interface AdminReviewStats {
    completed_count: number;
    cancelled_count: number;
    missing_docs_count: number;
    archive_ready_count: number;
}

export interface AdminReviewArchiveResponse {
    message: string;
    data: {
        id: number;
        type: TransactionType;
        is_archive: boolean;
    };
}


/** Per-stage file attachment used in the legacy upload form */
export interface StageUpload {
    file: File | null;
}

/** Top-level form state for ArchiveLegacyUploadPage */
export interface ArchiveFormState {
    type: TransactionType;
    year: number;
    blsc: string;
    refNo: string;
    bl: string;
    vessel: string;
    client: string;
    fileDate: string;
}


export const IMPORT_STAGES = [
    { key: 'boc', label: 'BOC Processing' },
    { key: 'ppa', label: 'PPA Processing' },
    { key: 'do', label: 'DO Request' },
    { key: 'port_charges', label: 'Port Charges' },
    { key: 'releasing', label: 'Releasing' },
    { key: 'billing', label: 'Billing' },
    { key: 'others', label: 'Others' },
] as const;

export const EXPORT_STAGES = [
    { key: 'boc', label: 'BOC Processing' },
    { key: 'bl_generation', label: 'BL Generation' },
    { key: 'co', label: 'CO Processing' },
    { key: 'dccci', label: 'DCCCI Printing' },
    { key: 'billing', label: 'Billing' },
    { key: 'others', label: 'Others' },
] as const;

export const REQUIRED_IMPORT_STAGES = IMPORT_STAGES.filter((stage) => stage.key !== 'others');
export const REQUIRED_EXPORT_STAGES = EXPORT_STAGES.filter((stage) => stage.key !== 'others');

export const getRequiredArchiveStages = (type: TransactionType) =>
    type === 'import' ? REQUIRED_IMPORT_STAGES : REQUIRED_EXPORT_STAGES;

// Dynamic: 2015 → current year, newest first. Auto-expands each year without code changes.
const _currentYear = new Date().getFullYear();
export const ARCHIVE_YEARS: number[] = Array.from(
    { length: _currentYear - 2015 + 1 },
    (_, i) => _currentYear - i
);

export const BLSC_OPTIONS = [
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'red', label: 'Red' },
] as const;
