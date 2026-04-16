export type ArchiveTaskRole = 'processor' | 'accounting';

export type ArchiveTaskQueueStatus =
    | 'needs_my_upload'
    | 'waiting_on_others'
    | 'completed_by_me'
    | 'already_supplied';

export type ArchiveTaskStageState =
    | 'missing'
    | 'not_applicable'
    | 'uploaded_by_me'
    | 'uploaded_by_admin'
    | 'uploaded_by_encoder'
    | 'uploaded_by_other_staff'
    | 'shared';

export interface ArchiveTaskUser {
    id: number;
    name: string;
    role: string | null;
}

export interface ArchiveTaskDocument {
    id: number;
    type: string;
    filename: string;
    formatted_size: string;
    created_at: string | null;
    uploaded_by: ArchiveTaskUser | null;
}

export interface ArchiveTaskStageSummary {
    key: string;
    label: string;
    state: ArchiveTaskStageState;
    can_upload: boolean;
    documents_count: number;
    uploaded_by: ArchiveTaskUser | null;
}

export interface ArchiveTaskRecord {
    id: number;
    type: 'import' | 'export';
    reference: string;
    bl_no: string;
    client_name: string | null;
    transaction_date: string | null;
    archive_period: {
        year: number | null;
        month: number | null;
        label: string | null;
    };
    status: string;
    notes: string | null;
    selective_color: 'green' | 'yellow' | 'orange' | 'red' | null;
    vessel_name: string | null;
    origin_country: string | null;
    location_of_goods: string | null;
    stages: Record<string, string>;
    not_applicable_stages: string[];
    my_stage_keys: string[];
    my_stage_summaries: ArchiveTaskStageSummary[];
    documents: ArchiveTaskDocument[];
    contributors: ArchiveTaskUser[];
    queue_status: ArchiveTaskQueueStatus;
    last_updated_at: string;
}

export interface ArchiveTaskQueueStats {
    needs_my_upload: number;
    waiting_on_others: number;
    completed_by_me: number;
    already_supplied: number;
    shared_records: number;
}

export interface ArchiveTaskQueueResponse {
    stats: ArchiveTaskQueueStats;
    data: ArchiveTaskRecord[];
}
