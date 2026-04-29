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

export interface EncoderDashboardResponse {
    kpis: EncoderDashboardKpis;
    attention_items: EncoderDashboardAttentionItem[];
}
