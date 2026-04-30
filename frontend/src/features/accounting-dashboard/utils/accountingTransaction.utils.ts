import type {
    ApiExportStages,
    ApiExportTransaction,
    ApiImportStages,
    ApiImportTransaction,
} from '../../tracking/types';
import {
    getExportAccountingActionability,
    getExportAccountingWaitingReason,
    getImportAccountingActionability,
    getImportAccountingWaitingReason,
    getWaitingAgeLabel,
} from '../../tracking/utils/stageUtils';

export type QueueView = 'import' | 'export';
export type QueueFilter = 'all' | 'ready' | 'blocked' | 'overdue';
export type QueueState = 'ready' | 'waiting';
export type StageTone = 'ready' | 'waiting' | 'uploaded' | 'review' | 'action';

export type SelectedTransaction = {
    id: number;
    ref: string;
    clientName: string;
    type: QueueView;
    vesselName: string | null;
    stages?: ApiImportStages | ApiExportStages;
};

export type QueueStageChip = {
    label: string;
    tone: StageTone;
};

export type AccountingQueueRow = {
    id: number;
    ref: string;
    clientName: string;
    typeLabel: 'Import' | 'Export';
    primaryMeta: string;
    secondaryMeta: string | null;
    state: QueueState;
    actionSummary: string;
    blocker: string | null;
    waitingLabel: string | null;
    isOverdue: boolean;
    stageChip: QueueStageChip;
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

export function buildImportQueueRows(transactions: ApiImportTransaction[]): AccountingQueueRow[] {
    return transactions.map((transaction) => {
        const billingReady = getImportAccountingActionability(transaction.stages).billing;
        const state: QueueState = billingReady ? 'ready' : 'waiting';
        const waitAnchor = transaction.waiting_since ?? transaction.created_at;
        const waitingLabel = getWaitingAgeLabel(waitAnchor);
        const blocker = state === 'waiting' ? getImportAccountingWaitingReason(transaction.stages) : null;

        return {
            id: transaction.id,
            ref: transaction.customs_ref_no || transaction.bl_no || 'Pending Ref',
            clientName: transaction.importer?.name || 'Unknown Client',
            typeLabel: 'Import',
            primaryMeta: transaction.arrival_date ? `ETA ${formatDateLabel(transaction.arrival_date)}` : 'ETA —',
            secondaryMeta: transaction.location_of_goods?.name ?? transaction.origin_country?.name ?? null,
            state,
            actionSummary: billingReady ? 'Billing and Liquidation ready now' : 'Waiting for workflow progress.',
            blocker,
            waitingLabel,
            isOverdue: state === 'waiting' && isOverdue(waitAnchor),
            stageChip: buildStageChip(transaction.stages?.billing, billingReady),
            searchableText: [
                transaction.customs_ref_no,
                transaction.bl_no,
                transaction.vessel_name,
                transaction.importer?.name,
                transaction.location_of_goods?.name,
                transaction.origin_country?.name,
                blocker,
                waitingLabel,
                'billing and liquidation',
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase(),
            selectedTransaction: {
                id: transaction.id,
                ref: transaction.customs_ref_no || transaction.bl_no || 'Pending Ref',
                clientName: transaction.importer?.name || 'Unknown Client',
                type: 'import',
                vesselName: transaction.vessel_name ?? null,
                stages: transaction.stages,
            },
        };
    });
}

export function buildExportQueueRows(transactions: ApiExportTransaction[]): AccountingQueueRow[] {
    return transactions.map((transaction) => {
        const billingReady = getExportAccountingActionability(transaction.stages).billing;
        const state: QueueState = billingReady ? 'ready' : 'waiting';
        const waitAnchor = transaction.waiting_since ?? transaction.created_at;
        const waitingLabel = getWaitingAgeLabel(waitAnchor);
        const blocker = state === 'waiting' ? getExportAccountingWaitingReason(transaction.stages) : null;

        return {
            id: transaction.id,
            ref: transaction.bl_no || 'Pending BL',
            clientName: transaction.shipper?.name || 'Unknown Client',
            typeLabel: 'Export',
            primaryMeta: transaction.vessel ? `Vessel ${transaction.vessel}` : 'Vessel —',
            secondaryMeta: transaction.destination_country?.name ?? null,
            state,
            actionSummary: billingReady ? 'Billing and Liquidation ready now' : 'Waiting for workflow progress.',
            blocker,
            waitingLabel,
            isOverdue: state === 'waiting' && isOverdue(waitAnchor),
            stageChip: buildStageChip(transaction.stages?.billing, billingReady),
            searchableText: [
                transaction.bl_no,
                transaction.shipper?.name,
                transaction.vessel,
                transaction.destination_country?.name,
                blocker,
                waitingLabel,
                'billing and liquidation',
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase(),
            selectedTransaction: {
                id: transaction.id,
                ref: transaction.bl_no || 'Pending BL',
                clientName: transaction.shipper?.name || 'Unknown Client',
                type: 'export',
                vesselName: transaction.vessel ?? null,
                stages: transaction.stages,
            },
        };
    });
}

export function buildStageChip(status: string | undefined, isActionable: boolean): QueueStageChip {
    if (status === 'completed') {
        return { label: 'Billing Uploaded', tone: 'uploaded' };
    }

    if (status === 'in_progress' || status === 'review') {
        return { label: 'Billing For Review', tone: 'review' };
    }

    if (status === 'rejected') {
        return { label: 'Billing Action Needed', tone: 'action' };
    }

    if (isActionable) {
        return { label: 'Billing Ready', tone: 'ready' };
    }

    return { label: 'Billing Waiting', tone: 'waiting' };
}

export function applyQueueFilter(rows: AccountingQueueRow[], filter: QueueFilter): AccountingQueueRow[] {
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

export function compareQueueRows(left: AccountingQueueRow, right: AccountingQueueRow): number {
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

    return (Date.now() - waitingSince) / (1000 * 60 * 60) >= WAITING_OVERDUE_HOURS;
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
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'uploaded':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'review':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'action':
            return 'border-red-200 bg-red-50 text-red-700';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600';
    }
}
