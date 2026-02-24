export type DocType =
    | 'Bill of Lading'
    | 'Commercial Invoice'
    | 'Packing List'
    | 'Customs Declaration'
    | 'Certificate of Origin'
    | 'Inspection Report'
    | 'Import Manifest'
    | 'Export License'
    | 'Shipping Instructions';

export type FileExt = 'pdf' | 'docx' | 'jpg';
export type TransactionType = 'import' | 'export';

export interface TransactionDocument {
    id: number;
    name: string;
    docType: DocType;
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

export interface ArchiveDocument {
    id: number;
    name: string;
    docType: DocType;
    type: TransactionType;
    client: string;
    refNo: string;       // optional ref — may be blank for old files
    fileDate: string;    // date on the physical document
    uploadDate: string;
    uploader: { name: string; initials: string; color: string };
    size: string;
    ext: FileExt;
}

export interface ArchiveYear {
    year: number;
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
    { key: 'docs_prep', label: 'Docs Preparation' },
    { key: 'co', label: 'CO Processing' },
    { key: 'cil', label: 'CIL Processing' },
    { key: 'bl', label: 'BL Processing' },
] as const;

export const ARCHIVE_YEARS = [2022, 2023, 2024, 2025] as const;

export const BLSC_OPTIONS = [
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'red', label: 'Red' },
] as const;
