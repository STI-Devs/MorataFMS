export interface Remark {
    id: number;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    author: {
        id: number;
        name: string;
        role: string;
    } | null;
    is_resolved: boolean;
    resolved_by: {
        id: number;
        name: string;
    } | null;
    resolved_at: string | null;
    created_at: string;
    document: {
        id: number;
        filename: string;
        type: string;
    } | null;
}

export interface CreateRemarkData {
    severity: 'info' | 'warning' | 'critical';
    message: string;
    document_id?: number | null;
}

export interface RemarkDocument {
    id: number;
    filename: string;
    type: string;
}
