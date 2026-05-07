export type AdminDashboardDestination = 'transactions' | 'admin_document_review';

export interface AdminDashboardKpis {
    active_imports: number;
    active_exports: number;
    delayed_shipments: number;
    upcoming_eta_etd: number;
    open_remarks: number;
    missing_final_docs: number;
}

export interface AdminDashboardCriticalItem {
    id: string;
    ref: string;
    status: 'stuck' | 'missing' | 'review';
    title: string;
    detail: string;
    age: string;
    destination: AdminDashboardDestination;
}

export interface AdminDashboardFeedItem {
    id: string;
    age: string;
    actor: string;
    action: string;
    target: string;
    detail: string;
    created_at: string | null;
}

export interface AdminDashboardWorkloadItem {
    id: number;
    name: string;
    role: string;
    active: number;
    overdue: number;
}

export interface AdminDashboardRecordsSummary {
    in_review_count: number;
    completed_count: number;
    cancelled_count: number;
    missing_docs_count: number;
    archive_ready_count: number;
}

export interface AdminDashboardMonthlyVolumePoint {
    month: number;
    imports: number;
    exports: number;
    total: number;
}

export interface AdminDashboardMonthlyVolume {
    year: number;
    months: AdminDashboardMonthlyVolumePoint[];
    total_imports: number;
    total_exports: number;
    total: number;
}

export interface AdminDashboardTransactionFlow {
    imports: number;
    exports: number;
    total: number;
    completed: number;
    completion_rate: number;
}

export interface AdminDashboardStatusBreakdownItem {
    key: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    label: string;
    value: number;
}

export interface AdminDashboardOverdueTransactionStats {
    overdue_count: number;
    stale_48_72_count: number;
    stale_over_72_count: number;
    oldest_hours: number | null;
}

export interface AdminDashboardAnalytics {
    year: number;
    monthly_volume: AdminDashboardMonthlyVolume;
    transaction_flow: AdminDashboardTransactionFlow;
    status_breakdown: AdminDashboardStatusBreakdownItem[];
    overdue_transactions: {
        threshold_hours: number;
        total: number;
        imports: AdminDashboardOverdueTransactionStats;
        exports: AdminDashboardOverdueTransactionStats;
    };
}

export interface AdminDashboardResponse {
    kpis: AdminDashboardKpis;
    critical_operations: AdminDashboardCriticalItem[];
    action_feed: AdminDashboardFeedItem[];
    workloads: AdminDashboardWorkloadItem[];
    records_summary: AdminDashboardRecordsSummary;
    analytics: AdminDashboardAnalytics;
}
