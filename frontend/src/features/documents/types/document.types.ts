export type FileExt = 'pdf' | 'docx' | 'jpg' | string;
export type TransactionType = 'import' | 'export';
export type ArchiveOrigin = 'direct_archive_upload' | 'archived_from_live';

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

// Mirrors the current S3 path contract: transaction-documents/{imports|exports}/{year}/{period}/{BL}/{type}_{filename}_{unique}

export interface ArchiveDocument {
    id: number;
    type: TransactionType;           // 'import' | 'export' — from path segment
    bl_no: string;                   // Bill of Lading — from path segment
    month: number;                   // Archive period month (1-12)
    client: string;                  // Client name (importer/shipper)
    selective_color?: 'green' | 'yellow' | 'orange' | 'red' | null; // Import only — BLSC
    destination_country?: string | null;                  // Export only — destination
    transaction_date: string;        // ISO date string (YYYY-MM-DD)
    transaction_id: number;          // Parent transaction ID (for document uploads)
    documentable_type: string;       // 'App\\Models\\ImportTransaction' | 'App\\Models\\ExportTransaction'
    stage: string;                   // e.g. 'boc', 'ppa', 'do', 'billing' — from path segment
    filename: string;                // original filename (stripped of timestamp prefix)
    formatted_size: string;          // e.g. '1.1 MB'
    size_bytes: number;              // raw byte count (for summing total storage)
    archive_origin: ArchiveOrigin | null;
    archived_at: string | null;
    uploaded_at: string;             // ISO timestamp
    not_applicable_stages?: string[];
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
export type AdminReviewReadinessFilter = 'ready' | 'missing_docs' | 'flagged' | 'all';

export interface AdminReviewQueueParams {
    page?: number;
    per_page?: number;
    search?: string;
    type?: AdminReviewTypeFilter;
    status?: AdminReviewStatusFilter;
    readiness?: AdminReviewReadinessFilter;
    assigned_user_id?: number;
}

export interface AdminReviewQueueItem {
    id: number;
    type: TransactionType;
    ref: string;
    bl_number: string | null;
    client: string | null;
    assigned_user: string | null;
    assigned_user_id: number | null;
    status: string;
    finalized_date: string | null;
    docs_count: number;
    docs_total: number;
    has_exceptions: boolean;
    archive_ready: boolean;
    readiness: Exclude<AdminReviewReadinessFilter, 'all'>;
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
    assigned_user_id: number | null;
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
    not_applicable: boolean;
    files: AdminReviewDocumentFile[];
}

export interface AdminReviewUploadedDocument {
    id: number;
    type_key: string;
    label: string;
    filename: string;
    size: string;
    uploaded_by: string | null;
    uploaded_at: string | null;
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
    readiness: Exclude<AdminReviewReadinessFilter, 'all'>;
}

export interface AdminReviewDetailResponse {
    transaction: AdminReviewDetailTransaction;
    required_documents: AdminReviewRequiredDocument[];
    uploaded_documents: AdminReviewUploadedDocument[];
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
        archived_at: string | null;
        archived_by_id: number | null;
        archive_origin: ArchiveOrigin | null;
    };
}


/** Per-stage file attachment used in the legacy upload form */
export interface StageUpload {
    files: File[];
    notApplicable?: boolean;
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

export interface ArchiveStageDefinition {
    key: string;
    label: string;
    optional?: boolean;
}

export const IMPORT_STAGES: readonly ArchiveStageDefinition[] = [
    { key: 'boc', label: 'BOC Processing' },
    { key: 'bonds', label: 'BONDS', optional: true },
    { key: 'ppa', label: 'PPA Processing', optional: true },
    { key: 'do', label: 'DO Request' },
    { key: 'port_charges', label: 'Port Charges', optional: true },
    { key: 'releasing', label: 'Releasing' },
    { key: 'billing', label: 'Billing' },
    { key: 'others', label: 'Others' },
] as const;

export const EXPORT_STAGES: readonly ArchiveStageDefinition[] = [
    { key: 'boc', label: 'BOC Processing' },
    { key: 'bl_generation', label: 'Bill of Lading' },
    { key: 'phytosanitary', label: 'Phytosanitary Certificates', optional: true },
    { key: 'co', label: 'CO Application', optional: true },
    { key: 'cil', label: 'CIL' },
    { key: 'dccci', label: 'DCCCI Printing', optional: true },
    { key: 'billing', label: 'Billing' },
    { key: 'others', label: 'Others' },
] as const;

export const REQUIRED_IMPORT_STAGES = IMPORT_STAGES.filter((stage) => stage.key !== 'others');
export const REQUIRED_EXPORT_STAGES = EXPORT_STAGES.filter((stage) => stage.key !== 'others');

export const getRequiredArchiveStages = (
    type: TransactionType,
    notApplicableStages: string[] = [],
) => {
    const requiredStages = type === 'import' ? REQUIRED_IMPORT_STAGES : REQUIRED_EXPORT_STAGES;

    return requiredStages.filter((stage) => !notApplicableStages.includes(stage.key));
};

// Dynamic: 2015 → current year, newest first. Auto-expands each year without code changes.
const _currentYear = new Date().getFullYear();
export const ARCHIVE_YEARS: number[] = Array.from(
    { length: _currentYear - 2015 + 1 },
    (_, i) => _currentYear - i
);

export const BLSC_OPTIONS = [
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'orange', label: 'Orange' },
    { value: 'red', label: 'Red' },
] as const;
