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

// ─── Archive types (legacy 2022–2025 files) ──────────────────────────────────
// Mirrors the S3 path: documents/{imports|exports}/{year}/{BL}/{stage}/{timestamp}_{filename}

export interface ArchiveDocument {
    id: number;
    type: TransactionType;           // 'import' | 'export' — from path segment
    bl_no: string;                   // Bill of Lading — from path segment
    month: number;                   // Archive period month (1-12)
    client: string;                  // Client name (importer/shipper)
    transaction_date: string;        // ISO date string (YYYY-MM-DD)
    stage: string;                   // e.g. 'boc', 'ppa', 'do', 'billing' — from path segment
    filename: string;                // original filename (stripped of timestamp prefix)
    formatted_size: string;          // e.g. '1.1 MB'
    uploaded_at: string;             // ISO timestamp
    uploader: { id: number; name: string } | null;
}

export interface ArchiveYear {
    year: number;
    imports: number;
    exports: number;
    documents: ArchiveDocument[];
}

// ─── Archive upload form ─────────────────────────────────────────────────────

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

// ─── Shared constants ────────────────────────────────────────────────────────

export const IMPORT_STAGES = [
    { key: 'boc', label: 'BOC Processing' },
    { key: 'ppa', label: 'PPA Processing' },
    { key: 'do', label: 'DO Request' },
    { key: 'port_charges', label: 'Port Charges' },
    { key: 'releasing', label: 'Releasing' },
    { key: 'billing', label: 'Billing' },
] as const;

export const EXPORT_STAGES = [
    { key: 'boc', label: 'BOC Processing' },
    { key: 'bl_generation', label: 'BL Generation' },
    { key: 'co', label: 'CO Processing' },
    { key: 'dccci', label: 'DCCCI Printing' },
    { key: 'billing', label: 'Billing' },
] as const;

export const ARCHIVE_YEARS = [2022, 2023, 2024, 2025] as const;

export const BLSC_OPTIONS = [
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'red', label: 'Red' },
] as const;
