export interface MonthlyDataPoint {
    month: number;
    imports: number;
    exports: number;
    total: number;
}

export interface MonthlyReportResponse {
    year: number;
    months: MonthlyDataPoint[];
    total_imports: number;
    total_exports: number;
    total: number;
}

export interface ClientReportRow {
    client_id: number;
    client_name: string;
    client_type: string;
    imports: number;
    exports: number;
    total: number;
}

export interface ClientReportResponse {
    year: number;
    month: number | null;
    clients: ClientReportRow[];
}

export interface TurnaroundStats {
    completed_count: number;
    avg_days: number | null;
    min_days: number | null;
    max_days: number | null;
}

export interface TurnaroundReportResponse {
    year: number;
    month: number | null;
    imports: TurnaroundStats;
    exports: TurnaroundStats;
}
