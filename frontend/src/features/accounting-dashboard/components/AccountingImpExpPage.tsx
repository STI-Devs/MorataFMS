import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../../components/Icon';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { ApiExportStages, ApiExportTransaction, ApiImportStages, ApiImportTransaction } from '../../tracking/types';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import {
    getExportAccountingActionability,
    getExportAccountingWaitingReason,
    getImportAccountingActionability,
    getImportAccountingWaitingReason,
    getWaitingAgeLabel,
} from '../../tracking/utils/stageUtils';
import { AccountingUploadModal } from './AccountingUploadModal';

type QueueView = 'import' | 'export';
type QueueFilter = 'all' | 'ready' | 'blocked' | 'overdue';
type QueueState = 'ready' | 'waiting';
type StageTone = 'ready' | 'waiting' | 'uploaded' | 'review' | 'action';

type SelectedTransaction = {
    id: number;
    ref: string;
    clientName: string;
    type: QueueView;
    stages?: ApiImportStages | ApiExportStages;
};

type QueueStageChip = {
    label: string;
    tone: StageTone;
};

type AccountingQueueRow = {
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

const WAITING_OVERDUE_HOURS = 48;
const FILTER_META: Array<{ key: QueueFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'ready', label: 'Ready' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'overdue', label: 'Overdue' },
];

export const AccountingImpExpPage = () => {
    const [view, setView] = useState<QueueView>('import');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<QueueFilter>('all');
    const [selectedTx, setSelectedTx] = useState<SelectedTransaction | null>(null);

    const deferredSearch = useDeferredValue(search);

    const importsQuery = useQuery({
        queryKey: [...trackingKeys.imports.list(), 'accounting-queue'],
        queryFn: () => trackingApi.getAllImports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const exportsQuery = useQuery({
        queryKey: [...trackingKeys.exports.list(), 'accounting-queue'],
        queryFn: () => trackingApi.getAllExports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const importRows = useMemo(
        () => buildImportQueueRows(importsQuery.data ?? []),
        [importsQuery.data],
    );
    const exportRows = useMemo(
        () => buildExportQueueRows(exportsQuery.data ?? []),
        [exportsQuery.data],
    );

    const activeRows = view === 'import' ? importRows : exportRows;
    const activeQuery = view === 'import' ? importsQuery : exportsQuery;

    const searchedRows = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();

        if (!term) {
            return activeRows;
        }

        return activeRows.filter((row) => row.searchableText.includes(term));
    }, [activeRows, deferredSearch]);

    const filterCounts = useMemo(() => ({
        all: searchedRows.length,
        ready: searchedRows.filter((row) => row.state === 'ready').length,
        blocked: searchedRows.filter((row) => row.state === 'waiting').length,
        overdue: searchedRows.filter((row) => row.isOverdue).length,
    }), [searchedRows]);

    const filteredRows = useMemo(() => applyQueueFilter(searchedRows, filter), [searchedRows, filter]);

    const readyRows = useMemo(
        () => filteredRows.filter((row) => row.state === 'ready').sort(compareQueueRows),
        [filteredRows],
    );
    const waitingRows = useMemo(
        () => filteredRows.filter((row) => row.state === 'waiting').sort(compareQueueRows),
        [filteredRows],
    );

    const queueSummary = useMemo(() => ({
        visible: filteredRows.length,
        ready: readyRows.length,
        waiting: waitingRows.length,
        overdue: filteredRows.filter((row) => row.isOverdue).length,
    }), [filteredRows, readyRows.length, waitingRows.length]);

    return (
        <div className="flex h-full flex-1 flex-col bg-app-bg">
            <div className="border-b border-border bg-surface px-4 pb-4 pt-4">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Finance & Accounting Tasks</h1>
                <p className="mt-1 text-sm text-text-secondary">
                    Prioritize ready billing uploads, then monitor blocked transactions by urgency and oldest wait time.
                </p>

                <div className="mt-5 flex flex-wrap gap-4 border-b border-border">
                    <QueueViewButton
                        isActive={view === 'import'}
                        label="Imports"
                        count={importRows.length}
                        onClick={() => setView('import')}
                    />
                    <QueueViewButton
                        isActive={view === 'export'}
                        label="Exports"
                        count={exportRows.length}
                        onClick={() => setView('export')}
                    />
                </div>

                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search BL, ref, client, vessel, blocker..."
                            className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                            <Icon name="filter" className="h-3.5 w-3.5" />
                            Quick Filter
                        </span>
                        {FILTER_META.map((option) => (
                            <FilterChip
                                key={option.key}
                                label={option.label}
                                count={filterCounts[option.key]}
                                isActive={filter === option.key}
                                onClick={() => setFilter(option.key)}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Visible Queue"
                        value={queueSummary.visible}
                        accent="border-border bg-surface-secondary/50"
                        valueTone="text-text-primary"
                    />
                    <SummaryCard
                        label="Ready Now"
                        value={queueSummary.ready}
                        accent="border-emerald-200 bg-emerald-50/80"
                        valueTone="text-emerald-700"
                    />
                    <SummaryCard
                        label="Blocked"
                        value={queueSummary.waiting}
                        accent="border-slate-200 bg-slate-50/80"
                        valueTone="text-slate-700"
                    />
                    <SummaryCard
                        label="Overdue"
                        value={queueSummary.overdue}
                        accent="border-amber-200 bg-amber-50/80"
                        valueTone="text-amber-700"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-secondary/20 px-4 pb-8 pt-5">
                {activeQuery.isLoading && (
                    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
                        Loading accounting queue...
                    </div>
                )}

                {activeQuery.isError && !activeQuery.isLoading && (
                    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
                        Accounting queue failed to load. Refresh the page and try again.
                    </div>
                )}

                {!activeQuery.isLoading && !activeQuery.isError && activeRows.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-16 text-center text-text-muted">
                        <Icon name="archive" className="h-12 w-12 opacity-50" />
                        <p className="mt-4 text-sm font-semibold">No accounting upload tasks available</p>
                    </div>
                )}

                {!activeQuery.isLoading && !activeQuery.isError && activeRows.length > 0 && filteredRows.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
                        No accounting tasks match the current search and filter.
                    </div>
                )}

                {!activeQuery.isLoading && !activeQuery.isError && filteredRows.length > 0 && (
                    <div className="space-y-8">
                        <QueueSection
                            title="Ready to Upload"
                            description="Billing work that is fully unblocked and ready for finance upload."
                            tone="ready"
                            emptyMessage="No accounting files are ready right now."
                            rows={readyRows}
                            onOpen={(row) => setSelectedTx(row.selectedTransaction)}
                        />
                        <QueueSection
                            title="Waiting / Monitoring"
                            description="Blocked accounting transactions sorted with overdue items first."
                            tone="waiting"
                            emptyMessage="No waiting accounting transactions."
                            rows={waitingRows}
                            onOpen={(row) => setSelectedTx(row.selectedTransaction)}
                        />
                    </div>
                )}
            </div>

            {selectedTx && (
                <AccountingUploadModal
                    isOpen={!!selectedTx}
                    onClose={() => setSelectedTx(null)}
                    transactionId={selectedTx.id}
                    reference={selectedTx.ref}
                    type={selectedTx.type}
                    clientName={selectedTx.clientName}
                    transactionStages={selectedTx.stages}
                />
            )}
        </div>
    );
};

const QueueViewButton = ({
    isActive,
    label,
    count,
    onClick,
}: {
    isActive: boolean;
    label: string;
    count: number;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-bold transition-colors ${
            isActive
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
    >
        {label}
        {count > 0 && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-600">
                {count}
            </span>
        )}
    </button>
);

const FilterChip = ({
    label,
    count,
    isActive,
    onClick,
}: {
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-border bg-surface text-text-secondary hover:text-text-primary'
        }`}
    >
        {label}
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-secondary text-text-muted'}`}>
            {count}
        </span>
    </button>
);

const SummaryCard = ({
    label,
    value,
    accent,
    valueTone,
}: {
    label: string;
    value: number;
    accent: string;
    valueTone: string;
}) => (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${accent}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-secondary">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${valueTone}`}>{value}</p>
    </div>
);

const QueueSection = ({
    title,
    description,
    tone,
    emptyMessage,
    rows,
    onOpen,
}: {
    title: string;
    description: string;
    tone: QueueState;
    emptyMessage: string;
    rows: AccountingQueueRow[];
    onOpen: (row: AccountingQueueRow) => void;
}) => (
    <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
            <div className={`h-5 w-1 rounded-full ${tone === 'ready' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">{title}</h2>
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                {rows.length}
            </span>
            <p className="text-xs text-text-muted">{description}</p>
        </div>

        {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-text-muted">
                {emptyMessage}
            </div>
        ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div
                    className="hidden items-center gap-3 border-b border-border bg-surface-secondary/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted lg:grid"
                    style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) auto' }}
                >
                    <span>Reference</span>
                    <span>Next Step</span>
                    <span>Context</span>
                    <span>Status</span>
                    <span>Action</span>
                </div>

                <div className="divide-y divide-border/50">
                    {rows.map((row) => (
                        <QueueRow key={`${row.selectedTransaction.type}-${row.id}`} row={row} onOpen={() => onOpen(row)} />
                    ))}
                </div>
            </div>
        )}
    </section>
);

const QueueRow = ({
    row,
    onOpen,
}: {
    row: AccountingQueueRow;
    onOpen: () => void;
}) => (
    <div className={`grid gap-3 px-4 py-4 ${row.state === 'ready' ? 'bg-surface' : 'bg-slate-50/70'}`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-bold tracking-tight text-text-primary">{row.ref}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                        row.selectedTransaction.type === 'import'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-teal-200 bg-teal-50 text-teal-700'
                    }`}>
                        {row.typeLabel}
                    </span>
                    {row.isOverdue && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                            Overdue
                        </span>
                    )}
                </div>
                <p className="mt-1 truncate text-sm text-text-secondary">{row.clientName}</p>
                {row.secondaryMeta && (
                    <p className="mt-1 truncate text-[11px] text-text-muted">{row.secondaryMeta}</p>
                )}
            </div>

            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                    {row.state === 'ready' ? 'Next Upload' : 'Blocked By'}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-text-primary">
                    {row.state === 'ready' ? row.actionSummary : (row.blocker ?? 'Waiting for workflow progress.')}
                </p>
                {row.waitingLabel && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                        <Icon name="alert-circle" className="h-3 w-3" />
                        {row.waitingLabel}
                    </span>
                )}
            </div>

            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Context</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[10px] font-semibold text-text-secondary">
                        <Icon name="clock" className="h-3 w-3 text-text-muted" />
                        {row.primaryMeta}
                    </span>
                </div>
            </div>

            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <StageChip chip={row.stageChip} />
                </div>
            </div>

            <div className="flex items-center justify-start lg:justify-end">
                <button
                    type="button"
                    onClick={onOpen}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        row.state === 'ready'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                >
                    {row.state === 'ready' ? 'Open Tasks' : 'View Details'}
                    <Icon name="chevron-right" className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    </div>
);

const StageChip = ({ chip }: { chip: QueueStageChip }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${stageToneClassName(chip.tone)}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {chip.label}
    </span>
);

function buildImportQueueRows(transactions: ApiImportTransaction[]): AccountingQueueRow[] {
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
                stages: transaction.stages,
            },
        };
    });
}

function buildExportQueueRows(transactions: ApiExportTransaction[]): AccountingQueueRow[] {
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
                stages: transaction.stages,
            },
        };
    });
}

function buildStageChip(status: string | undefined, isActionable: boolean): QueueStageChip {
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

function applyQueueFilter(rows: AccountingQueueRow[], filter: QueueFilter): AccountingQueueRow[] {
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

function compareQueueRows(left: AccountingQueueRow, right: AccountingQueueRow): number {
    if (left.isOverdue !== right.isOverdue) {
        return left.isOverdue ? -1 : 1;
    }

    return getSortAnchor(left.waitingLabel) - getSortAnchor(right.waitingLabel);
}

function getSortAnchor(waitingLabel: string | null): number {
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

function isOverdue(dateString: string | null | undefined): boolean {
    if (!dateString) {
        return false;
    }

    const waitingSince = new Date(dateString).getTime();

    if (Number.isNaN(waitingSince)) {
        return false;
    }

    return (Date.now() - waitingSince) / (1000 * 60 * 60) >= WAITING_OVERDUE_HOURS;
}

function formatDateLabel(value: string): string {
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

function stageToneClassName(tone: StageTone): string {
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
