export type AuditAction =
    | 'login'
    | 'logout'
    | 'encoder_reassigned'
    | 'status_changed'
    | string;

export interface AuditLogEntry {
    id: number;
    user_id: number | null;
    action: AuditAction;
    subject_type: 'import' | 'export' | null;
    subject_id: number | null;
    description: string;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    } | null;
}

export interface AuditLogMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface AuditLogListResponse {
    data: AuditLogEntry[];
    meta: AuditLogMeta;
}

export interface AuditLogFilters {
    search?: string;
    action?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
}
