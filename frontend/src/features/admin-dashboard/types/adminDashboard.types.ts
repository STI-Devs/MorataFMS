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

export interface AdminDashboardResponse {
    kpis: AdminDashboardKpis;
    critical_operations: AdminDashboardCriticalItem[];
    action_feed: AdminDashboardFeedItem[];
    workloads: AdminDashboardWorkloadItem[];
}
