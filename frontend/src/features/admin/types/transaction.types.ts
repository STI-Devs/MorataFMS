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
    created_at: string;
}

export interface OversightListResponse {
    data: OversightTransaction[];
    total: number;
    imports_count: number;
    exports_count: number;
}

export interface EncoderUser {
    id: number;
    name: string;
    email: string;
    role: string;
}
