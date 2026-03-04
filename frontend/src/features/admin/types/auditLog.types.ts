// Matches the actual AuditLogResource output from the backend
export interface AuditLogEntry {
    id: number;
    event: string;
    auditable_type: string | null;
    auditable_id: number | null;
    user: {
        id: number;
        name: string;
    } | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
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
