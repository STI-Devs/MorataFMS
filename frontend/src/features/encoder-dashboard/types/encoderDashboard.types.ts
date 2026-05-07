export type EncoderDashboardDestination = 'imports' | 'exports' | 'documents';

export interface EncoderDashboardKpis {
    active_imports: number;
    active_exports: number;
    needs_update: number;
    upcoming_eta_etd: number;
    open_remarks: number;
    document_gaps: number;
}

export interface EncoderDashboardAttentionItem {
    id: string;
    ref: string;
    type: 'import' | 'export';
    status: 'needs_update' | 'remark' | 'missing';
    title: string;
    detail: string;
    age: string;
    destination: EncoderDashboardDestination;
}

export interface EncoderDashboardMonthlyVolumePoint {
    month: number;
    imports: number;
    exports: number;
    total: number;
}

export interface EncoderDashboardMonthlyVolume {
    year: number;
    months: EncoderDashboardMonthlyVolumePoint[];
    total_imports: number;
    total_exports: number;
    total: number;
}

export interface EncoderDashboardClientVolumeItem {
    client_id: number;
    client_name: string;
    client_type: string | null;
    imports: number;
    exports: number;
    total: number;
}

export interface EncoderDashboardTurnaroundStats {
    completed_count: number;
    avg_days: number | null;
    min_days: number | null;
    max_days: number | null;
}

export interface EncoderDashboardReports {
    year: number;
    month: number;
    monthly_volume: EncoderDashboardMonthlyVolume;
    client_volume: {
        clients: EncoderDashboardClientVolumeItem[];
    };
    turnaround: {
        imports: EncoderDashboardTurnaroundStats;
        exports: EncoderDashboardTurnaroundStats;
    };
}

export interface EncoderDashboardCountByType {
    key: string;
    label: string;
    count: number;
}

export interface EncoderDashboardDocumentUploadStats {
    total: number;
    imports: number;
    exports: number;
    by_type: EncoderDashboardCountByType[];
}

export interface EncoderDashboardTransactionCompletionStats {
    imports: number;
    exports: number;
    total: number;
}

export interface EncoderDashboardStageCompletionStats {
    total: number;
    stages: EncoderDashboardCountByType[];
}

export interface EncoderDashboardRecordStats {
    imports: number;
    exports: number;
    total: number;
}

export interface EncoderDashboardStatusBreakdownItem {
    key: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    label: string;
    value: number;
}

export interface EncoderDashboardOverdueTransactionStats {
    overdue_count: number;
    stale_48_72_count: number;
    stale_over_72_count: number;
    oldest_hours: number | null;
}

export interface EncoderDashboardAnalytics {
    year: number;
    month: number;
    activity: {
        transactions_completed: {
            this_month: EncoderDashboardTransactionCompletionStats;
            this_year: EncoderDashboardTransactionCompletionStats;
        };
        documents_uploaded: {
            this_month: EncoderDashboardDocumentUploadStats;
            this_year: EncoderDashboardDocumentUploadStats;
        };
        stages_completed: {
            this_month: {
                total: number;
                imports: EncoderDashboardStageCompletionStats;
                exports: EncoderDashboardStageCompletionStats;
            };
            this_year: {
                total: number;
                imports: EncoderDashboardStageCompletionStats;
                exports: EncoderDashboardStageCompletionStats;
            };
        };
        records_finalized: {
            this_month: EncoderDashboardRecordStats;
            this_year: EncoderDashboardRecordStats;
        };
    };
    status_breakdown: EncoderDashboardStatusBreakdownItem[];
    overdue_transactions: {
        threshold_hours: number;
        total: number;
        imports: EncoderDashboardOverdueTransactionStats;
        exports: EncoderDashboardOverdueTransactionStats;
    };
}

export interface EncoderDashboardResponse {
    kpis: EncoderDashboardKpis;
    reports: EncoderDashboardReports;
    analytics: EncoderDashboardAnalytics;
    attention_items: EncoderDashboardAttentionItem[];
}
