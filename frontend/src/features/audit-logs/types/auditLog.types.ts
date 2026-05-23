// Matches the actual AuditLogResource output from the backend
export interface AuditLogEntry {
    id: number;
    event: string;
    auditable_type: string | null;
    auditable_id: number | null;
    auditable_label: string | null;
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

export interface AuditLogSummary {
    total: number;
    created: number;
    updated: number;
    deleted: number;
}

export interface AuditLogListResponse {
    data: AuditLogEntry[];
    meta: AuditLogMeta;
    summary?: AuditLogSummary;
}

export type AuditLogCategory = 'business' | 'operational' | 'all';

export interface AuditLogFilters {
    search?: string;
    action?: string;
    category?: AuditLogCategory;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
    actor?: 'human' | 'system' | 'all';
}
