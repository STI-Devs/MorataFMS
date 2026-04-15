export interface ImportStages {
    boc: string;
    bonds: string;
    ppa: string;
    do: string;
    port_charges: string;
    releasing: string;
    billing: string;
}

export interface ExportStages {
    boc: string;
    bl_generation: string;
    phytosanitary: string;
    co: string;
    cil: string;
    dccci: string;
    billing: string;
}

export interface OversightTransaction {
    id: number;
    type: 'import' | 'export';
    reference_no: string | null;
    bl_no: string | null;
    client: string | null;
    client_id: number | null;
    vessel?: string | null;
    destination?: string | null;
    date: string | null;
    status: string;
    selective_color?: string | null;
    assigned_to: string | null;
    assigned_user_id: number | null;
    open_remarks_count: number;
    created_at: string;
    stages: ImportStages | ExportStages | null;
    not_applicable_stages?: string[];
}

export interface OversightListResponse {
    data: OversightTransaction[];
    total: number;
    imports_count: number;
    exports_count: number;
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total_records: number;
    };
}

export interface OversightQueryParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    type?: 'import' | 'export';
}

export interface EncoderUser {
    id: number;
    name: string;
    email: string;
    role: string;
}
