import { toast } from 'sonner';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { DocumentableType } from '../../tracking/types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../tracking/utils/stageUtils';
import type {
    ArchiveTaskDocument,
    ArchiveTaskQueueStatus,
    ArchiveTaskRecord,
    ArchiveTaskRole,
    ArchiveTaskStageState,
    ArchiveTaskStageSummary,
} from '../types/archiveTask.types';

export type StageDefinition = {
    type: string;
    title: string;
};

export const OTHER_STAGE_DEFINITION: StageDefinition = {
    type: 'others',
    title: 'Other Documents',
};

export const PROCESSOR_OPTIONAL_ARCHIVE_STAGE_KEYS: Record<'import' | 'export', Set<string>> = {
    import: new Set(['ppa', 'port_charges']),
    export: new Set(['dccci']),
};

export const ROW_STAGE_SUMMARY_ORDER: ArchiveTaskStageState[] = [
    'missing',
    'not_applicable',
    'uploaded_by_me',
    'uploaded_by_admin',
    'uploaded_by_encoder',
    'shared',
    'uploaded_by_other_staff',
];

export const SECTION_ORDER: ArchiveTaskQueueStatus[] = [
    'needs_my_upload',
    'waiting_on_others',
    'already_supplied',
    'completed_by_me',
];

export const SECTION_META: Record<ArchiveTaskQueueStatus, { title: string; accent: string; badge: string }> = {
    needs_my_upload: {
        title: 'Needs My Upload',
        accent: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700',
    },
    waiting_on_others: {
        title: 'Waiting on Others',
        accent: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700',
    },
    already_supplied: {
        title: 'Filed',
        accent: 'bg-violet-500',
        badge: 'bg-violet-100 text-violet-700',
    },
    completed_by_me: {
        title: 'Completed by Me',
        accent: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700',
    },
};

export const ROLE_META: Record<ArchiveTaskRole, {
    title: string;
    subtitle: string;
    summaryTone: string;
    uploadLabel: string;
}> = {
    processor: {
        title: 'Archive Tasks',
        subtitle: 'Upload historical processor-owned files for shared archive records without reopening the live workflow.',
        summaryTone: 'text-blue-900',
        uploadLabel: 'Processor Stage Upload',
    },
    accounting: {
        title: 'Archive Finance Tasks',
        subtitle: 'Complete legacy billing archive records and review shared uploads from encoder, admin, and processor users.',
        summaryTone: 'text-amber-900',
        uploadLabel: 'Billing / Liquidation Upload',
    },
};

export const EMPTY_ARCHIVE_TASK_RECORDS: ArchiveTaskRecord[] = [];

export function stageStateTone(state: ArchiveTaskStageState): string {
    switch (state) {
        case 'missing':
            return 'border-red-200 bg-red-50 text-red-700';
        case 'not_applicable':
            return 'border-slate-200 bg-slate-100 text-slate-600';
        case 'uploaded_by_me':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'uploaded_by_admin':
            return 'border-violet-200 bg-violet-50 text-violet-700';
        case 'uploaded_by_encoder':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'shared':
            return 'border-indigo-200 bg-indigo-50 text-indigo-700';
        default:
            return 'border-amber-200 bg-amber-50 text-amber-700';
    }
}

export function shortStageStateLabel(state: ArchiveTaskStageState): string {
    switch (state) {
        case 'missing':
            return 'Pending';
        case 'not_applicable':
            return 'N/A';
        case 'uploaded_by_me':
            return 'By Me';
        case 'uploaded_by_admin':
            return 'By Admin';
        case 'uploaded_by_encoder':
            return 'By Encoder';
        case 'shared':
            return 'Shared';
        default:
            return 'By Staff';
    }
}

export function rowStageSummaryLabel(state: ArchiveTaskStageState, count: number): string {
    switch (state) {
        case 'missing':
            return count === 1 ? 'Pending' : `${count} pending`;
        case 'not_applicable':
            return count === 1 ? 'N/A' : `${count} N/A`;
        case 'uploaded_by_me':
            return count === 1 ? '1 my upload' : `${count} my uploads`;
        case 'uploaded_by_admin':
            return count === 1 ? '1 admin upload' : `${count} admin uploads`;
        case 'uploaded_by_encoder':
            return count === 1 ? '1 encoder upload' : `${count} encoder uploads`;
        case 'shared':
            return count === 1 ? '1 shared upload' : `${count} shared uploads`;
        case 'uploaded_by_other_staff':
            return count === 1 ? '1 staff upload' : `${count} staff uploads`;
    }
}

export function buildRowStageChips(summaries: ArchiveTaskStageSummary[]): Array<{
    key: string;
    state: ArchiveTaskStageState;
    label: string;
}> {
    if (summaries.length === 1) {
        const [summary] = summaries;

        return [
            {
                key: summary.key,
                state: summary.state,
                label: `${summary.label}: ${shortStageStateLabel(summary.state)}`,
            },
        ];
    }

    const grouped = new Map<ArchiveTaskStageState, number>();

    for (const summary of summaries) {
        grouped.set(summary.state, (grouped.get(summary.state) ?? 0) + 1);
    }

    return ROW_STAGE_SUMMARY_ORDER
        .filter((state) => grouped.has(state))
        .map((state) => {
            const count = grouped.get(state) ?? 0;

            return {
                key: `${state}:${count}`,
                state,
                label: rowStageSummaryLabel(state, count),
            };
        });
}

export function stageStateLabel(
    state: ArchiveTaskStageState,
    uploader: ArchiveTaskStageSummary['uploaded_by'],
): string {
    switch (state) {
        case 'missing':
            return 'No documents have been uploaded for this stage yet.';
        case 'not_applicable':
            return 'This stage is marked as not applicable.';
        case 'uploaded_by_me':
            return 'You already supplied this stage.';
        case 'shared':
            return 'This stage has files from multiple contributors.';
        case 'uploaded_by_admin':
        case 'uploaded_by_encoder':
        case 'uploaded_by_other_staff':
            return `${uploader?.name ?? 'Another user'} already uploaded this stage.`;
    }
}

export function canToggleArchiveStageApplicability(
    role: ArchiveTaskRole,
    record: ArchiveTaskRecord,
    summary: ArchiveTaskStageSummary,
): boolean {
    if (role !== 'processor') {
        return false;
    }

    if (!PROCESSOR_OPTIONAL_ARCHIVE_STAGE_KEYS[record.type].has(summary.key)) {
        return false;
    }

    return summary.documents_count === 0 && (summary.state === 'missing' || summary.state === 'not_applicable');
}

export function allStageDefinitions(type: ArchiveTaskRecord['type']): StageDefinition[] {
    const stageDefinitions = (type === 'import' ? IMPORT_STAGES : EXPORT_STAGES).map((stage) => ({
        type: stage.type,
        title: stage.title,
    }));

    return [...stageDefinitions, OTHER_STAGE_DEFINITION];
}

export function stageLabelFor(record: ArchiveTaskRecord | null, stageKey: string): string {
    const summaryLabel = record?.my_stage_summaries.find((summary) => summary.key === stageKey)?.label;

    if (summaryLabel) {
        return summaryLabel;
    }

    return allStageDefinitions(record?.type ?? 'import')
        .find((stage) => stage.type === stageKey)?.title
        ?? stageKey;
}

export function groupDocumentsByStage(
    documents: ArchiveTaskDocument[],
): Map<string, ArchiveTaskDocument[]> {
    const grouped = new Map<string, ArchiveTaskDocument[]>();

    for (const document of documents) {
        const existing = grouped.get(document.type) ?? [];
        grouped.set(document.type, [...existing, document]);
    }

    return grouped;
}

export function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Unknown date';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function titleCase(value: string): string {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function documentableTypeFor(record: ArchiveTaskRecord): DocumentableType {
    return record.type === 'import'
        ? 'App\\Models\\ImportTransaction'
        : 'App\\Models\\ExportTransaction';
}

export async function previewDocument(document: ArchiveTaskDocument): Promise<void> {
    const extension = document.filename.split('.').pop()?.toLowerCase() ?? '';
    const isOfficeDocument = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv'].includes(extension);

    if (isOfficeDocument) {
        await trackingApi.downloadDocument(document.id, document.filename);
        return;
    }

    const pendingTab = window.open('', '_blank');

    if (pendingTab) {
        pendingTab.opener = null;
        pendingTab.document.title = document.filename;
    }

    try {
        const previewBlob = await trackingApi.previewDocument(document.id);
        const previewUrl = window.URL.createObjectURL(previewBlob);

        if (pendingTab) {
            pendingTab.location.replace(previewUrl);
        } else {
            const fallbackTab = window.open(previewUrl, '_blank', 'noopener');

            if (fallbackTab) {
                fallbackTab.opener = null;
            }
        }

        window.setTimeout(() => {
            window.URL.revokeObjectURL(previewUrl);
        }, 60_000);
    } catch (error) {
        pendingTab?.close();
        const message = error instanceof Error ? error.message : 'Preview failed. Please try again.';
        toast.error(message);
    }
}
