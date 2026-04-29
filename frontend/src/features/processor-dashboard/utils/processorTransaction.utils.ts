import type {
    ApiExportStages,
    ApiExportTransaction,
    ApiImportStages,
    ApiImportTransaction,
} from '../../tracking/types';
import {
    getExportProcessorActionability,
    getExportProcessorWaitingReason,
    getImportProcessorActionability,
    getImportProcessorWaitingReason,
    getWaitingAgeLabel,
} from '../../tracking/utils/stageUtils';

export type QueueView = 'import' | 'export';
export type QueueFilter = 'all' | 'ready' | 'blocked' | 'overdue';
export type QueueState = 'ready' | 'waiting';
export type StageTone = 'ready' | 'waiting' | 'uploaded' | 'review' | 'action' | 'na';

export type SelectedTransaction = {
    id: number;
    ref: string;
    clientName: string;
    type: QueueView;
    stages?: ApiImportStages | ApiExportStages;
    notApplicableStages?: string[];
};

export type QueueStageChip = {
    key: string;
    label: string;
    tone: StageTone;
};

export type ProcessorQueueRow = {
    id: number;
    ref: string;
    clientName: string;
    typeLabel: 'Import' | 'Export';
    primaryMeta: string;
    secondaryMeta: string | null;
    state: QueueState;
    nextActionLabel: string;
    blocker: string | null;
    waitingLabel: string | null;
    isOverdue: boolean;
    stageChips: QueueStageChip[];
    searchableText: string;
    selectedTransaction: SelectedTransaction;
};

export const WAITING_OVERDUE_HOURS = 48;

export const FILTER_META: Array<{ key: QueueFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'ready', label: 'Ready' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'overdue', label: 'Overdue' },
];

export function buildImportQueueRows(transactions: ApiImportTransaction[]): ProcessorQueueRow[] {
    return transactions.map((transaction) => {
        const stages = transaction.stages;
        const actionability = getImportProcessorActionability(stages);
        const stageChips = [
            buildStageChip('ppa', 'PPA', stages?.ppa, actionability.ppa, transaction.not_applicable_stages?.includes('ppa') === true),
            buildStageChip(
                'port_charges',
                'Port Charges',
                stages?.port_charges,
                actionability.port_charges,
                transaction.not_applicable_stages?.includes('port_charges') === true,
            ),
        ];
        const state: QueueState = actionability.ppa || actionability.port_charges ? 'ready' : 'waiting';
        const waitAnchor = transaction.waiting_since ?? transaction.created_at;
        const waitingLabel = getWaitingAgeLabel(waitAnchor);
        const blocker = state === 'waiting' ? getImportProcessorWaitingReason(stages) : null;
        const overdue = state === 'waiting' && isOverdue(waitAnchor);

        return {
            id: transaction.id,
            ref: transaction.customs_ref_no || transaction.bl_no || 'Pending Ref',
            clientName: transaction.importer?.name || 'Unknown Client',
            typeLabel: 'Import',
            primaryMeta: transaction.arrival_date ? `ETA ${formatDateLabel(transaction.arrival_date)}` : 'ETA —',
            secondaryMeta: transaction.location_of_goods?.name ?? transaction.origin_country?.name ?? null,
            state,
            nextActionLabel: state === 'ready' ? getNextActionLabel(stageChips) : 'Waiting for encoder progress.',
            blocker,
            waitingLabel,
            isOverdue: overdue,
            stageChips,
            searchableText: [
                transaction.customs_ref_no,
                transaction.bl_no,
                transaction.importer?.name,
                transaction.location_of_goods?.name,
                transaction.origin_country?.name,
                blocker,
                waitingLabel,
                ...stageChips.map((chip) => chip.label),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase(),
            selectedTransaction: {
                id: transaction.id,
                ref: transaction.customs_ref_no || transaction.bl_no || 'Pending Ref',
                clientName: transaction.importer?.name || 'Unknown Client',
                type: 'import',
                stages,
                notApplicableStages: transaction.not_applicable_stages,
            },
        };
    });
}

export function buildExportQueueRows(transactions: ApiExportTransaction[]): ProcessorQueueRow[] {
    return transactions.map((transaction) => {
        const stages = transaction.stages;
        const actionability = getExportProcessorActionability(stages);
        const stageChips = [
            buildStageChip('cil', 'CIL', stages?.cil, actionability.cil, false),
            buildStageChip('dccci', 'DCCCI', stages?.dccci, actionability.dccci, transaction.not_applicable_stages?.includes('dccci') === true),
        ];
        const state: QueueState = actionability.cil || actionability.dccci ? 'ready' : 'waiting';
        const waitAnchor = transaction.waiting_since ?? transaction.created_at;
        const waitingLabel = getWaitingAgeLabel(waitAnchor);
        const blocker = state === 'waiting' ? getExportProcessorWaitingReason(stages) : null;
        const overdue = state === 'waiting' && isOverdue(waitAnchor);

        return {
            id: transaction.id,
            ref: transaction.bl_no || 'Pending BL',
            clientName: transaction.shipper?.name || 'Unknown Client',
            typeLabel: 'Export',
            primaryMeta: transaction.vessel ? `Vessel ${transaction.vessel}` : 'Vessel —',
            secondaryMeta: transaction.destination_country?.name ?? null,
            state,
            nextActionLabel: state === 'ready' ? getNextActionLabel(stageChips) : 'Waiting for encoder progress.',
            blocker,
            waitingLabel,
            isOverdue: overdue,
            stageChips,
            searchableText: [
                transaction.bl_no,
                transaction.shipper?.name,
                transaction.vessel,
                transaction.destination_country?.name,
                blocker,
                waitingLabel,
                ...stageChips.map((chip) => chip.label),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase(),
            selectedTransaction: {
                id: transaction.id,
                ref: transaction.bl_no || 'Pending BL',
                clientName: transaction.shipper?.name || 'Unknown Client',
                type: 'export',
                stages,
                notApplicableStages: transaction.not_applicable_stages,
            },
        };
    });
}

export function buildStageChip(
    key: string,
    label: string,
    status: string | undefined,
    isActionable: boolean,
    isNotApplicable: boolean,
): QueueStageChip {
    if (isNotApplicable) {
        return { key, label: `${label} N/A`, tone: 'na' };
    }

    if (status === 'completed') {
        return { key, label: `${label} Uploaded`, tone: 'uploaded' };
    }

    if (status === 'in_progress' || status === 'review') {
        return { key, label: `${label} For Review`, tone: 'review' };
    }

    if (status === 'rejected') {
        return { key, label: `${label} Action Needed`, tone: 'action' };
    }

    if (isActionable) {
        return { key, label: `${label} Ready`, tone: 'ready' };
    }

    return { key, label: `${label} Waiting`, tone: 'waiting' };
}

export function getNextActionLabel(stageChips: QueueStageChip[]): string {
    const readyStages = stageChips
        .filter((chip) => chip.tone === 'ready')
        .map((chip) => chip.label.replace(/ Ready$/, ''));

    if (readyStages.length === 0) {
        return 'Review transaction status';
    }

    if (readyStages.length === 1) {
        return `${readyStages[0]} ready now`;
    }

    return `${readyStages.length} stages ready now`;
}

export function applyQueueFilter(rows: ProcessorQueueRow[], filter: QueueFilter): ProcessorQueueRow[] {
    switch (filter) {
        case 'ready':
            return rows.filter((row) => row.state === 'ready');
        case 'blocked':
            return rows.filter((row) => row.state === 'waiting');
        case 'overdue':
            return rows.filter((row) => row.isOverdue);
        default:
            return rows;
    }
}

export function compareQueueRows(left: ProcessorQueueRow, right: ProcessorQueueRow): number {
    if (left.isOverdue !== right.isOverdue) {
        return left.isOverdue ? -1 : 1;
    }

    return getSortAnchor(left.waitingLabel) - getSortAnchor(right.waitingLabel);
}

export function getSortAnchor(waitingLabel: string | null): number {
    if (!waitingLabel) {
        return Number.MAX_SAFE_INTEGER;
    }

    if (waitingLabel.includes('<1 hour')) {
        return 0;
    }

    const matched = waitingLabel.match(/Waiting (\d+) (hour|hours|day|days)/i);

    if (!matched) {
        return Number.MAX_SAFE_INTEGER;
    }

    const value = Number(matched[1]);

    if (matched[2].startsWith('day')) {
        return -(value * 24);
    }

    return -value;
}

export function isOverdue(dateString: string | null | undefined): boolean {
    if (!dateString) {
        return false;
    }

    const waitingSince = new Date(dateString).getTime();

    if (Number.isNaN(waitingSince)) {
        return false;
    }

    const hours = (Date.now() - waitingSince) / (1000 * 60 * 60);

    return hours >= WAITING_OVERDUE_HOURS;
}

export function formatDateLabel(value: string): string {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function stageToneClassName(tone: StageTone): string {
    switch (tone) {
        case 'ready':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'uploaded':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'review':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'action':
            return 'border-red-200 bg-red-50 text-red-700';
        case 'na':
            return 'border-slate-200 bg-slate-100 text-slate-600';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600';
    }
}
