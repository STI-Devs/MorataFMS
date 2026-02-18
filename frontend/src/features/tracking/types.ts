export interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

export interface ImportTransaction {
    id: number;
    ref: string;
    bl: string;
    status: string;
    color: string;
    importer: string;
    date: string;
}

export interface ExportTransaction {
    id: number;
    ref: string;
    bl: string;
    status: string;
    color: string;
    shipper: string;
    vessel: string;
    departureDate: string;
    portOfDestination: string;
}

export interface TransactionStats {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
}

export interface FileData {
    id: number;
    name: string;
    date: string;
    uploadDate: string;
    uploader: { name: string; initials: string; role: string; color: string };
    size: string;
    type: 'pdf' | 'docx' | 'jpg';
    iconColor: string;
}

export interface EncodeFormData {
    ref: string;
    bl: string;
    party: string;       // importer (import) or shipper (export)
    status?: string;     // import only
    blsc?: string;       // import only (selective color)
    extra?: string;      // arrival date (import) or vessel (export)
}

// --- API Response Types (matching backend resources) ---

export interface ApiImportTransaction {
    id: number;
    customs_ref_no: string;
    bl_no: string;
    selective_color: string;
    importer: { id: number; name: string } | null;
    origin_country?: { id: number; name: string; code: string };
    arrival_date: string;
    assigned_user?: { id: number; name: string };
    status: string;
    notes: string | null;
    stages?: {
        boc: string;
        ppa: string;
        do: string;
        port_charges: string;
        releasing: string;
        billing: string;
    };
    created_at: string;
}

export interface ApiExportTransaction {
    id: number;
    bl_no: string;
    vessel: string;
    shipper: { id: number; name: string } | null;
    destination_country?: { id: number; name: string; code: string };
    assigned_user?: { id: number; name: string };
    status: string;
    notes: string | null;
    stages?: {
        docs_prep: string;
        co: string;
        cil: string;
        bl: string;
    };
    created_at: string;
}

export interface ApiClient {
    id: number;
    name: string;
    type: 'importer' | 'exporter' | 'both';
}

export interface ApiCountry {
    id: number;
    name: string;
    code: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
}

export interface CreateImportPayload {
    customs_ref_no: string;
    bl_no: string;
    selective_color: 'green' | 'yellow' | 'red';
    importer_id: number;
    origin_country_id?: number;
    arrival_date: string;
    notes?: string;
}

export interface CreateExportPayload {
    shipper_id: number;
    bl_no: string;
    vessel: string;
    destination_country_id?: number;
    notes?: string;
}

