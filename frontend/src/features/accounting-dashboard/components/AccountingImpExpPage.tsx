import { useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { useAccountingTaskQueue } from '../hooks/useAccountingTaskQueue';
import {
    FILTER_META,
    stageToneClassName,
    type AccountingQueueRow,
    type QueueState,
    type QueueStageChip,
} from '../utils/accountingTransaction.utils';
import { AccountingUploadModal } from './AccountingUploadModal';

type ReadyQueueGroup =
    | {
        kind: 'shared-vessel';
        vesselName: string;
        vesselKey: string;
        readyCount: number;
        rows: AccountingQueueRow[];
    }
    | {
        kind: 'single-row';
        row: AccountingQueueRow;
    };

export const AccountingImpExpPage = () => {
    const {
        view,
        setView,
        search,
        setSearch,
        filter,
        setFilter,
        selectedTx,
        setSelectedTx,
        importCount,
        exportCount,
        filterCounts,
        queueSummary,
        isLoading,
        isError,
        activeRows,
        filteredRows,
        readyRows,
        waitingRows,
    } = useAccountingTaskQueue();

    const readyVesselCounts = useMemo(() => {
        const counts = new Map<string, number>();

        activeRows.forEach((row) => {
            if (row.state !== 'ready') {
                return;
            }

            const vesselKey = getVesselKey(row.selectedTransaction.vesselName);

            if (!vesselKey) {
                return;
            }

            counts.set(vesselKey, (counts.get(vesselKey) ?? 0) + 1);
        });

        return counts;
    }, [activeRows]);

    const selectedVesselUploadCount = selectedTx
        ? readyVesselCounts.get(getVesselKey(selectedTx.vesselName) ?? '') ?? 0
        : 0;
    const [selectedEntryMode, setSelectedEntryMode] = useState<'single-transaction' | 'shared-vessel'>('single-transaction');

    const readyQueueGroups = useMemo<ReadyQueueGroup[]>(() => {
        const groupedRows = new Map<string, AccountingQueueRow[]>();
        const groups: ReadyQueueGroup[] = [];

        readyRows.forEach((row) => {
            const vesselKey = getVesselKey(row.selectedTransaction.vesselName);

            if (!vesselKey || (readyVesselCounts.get(vesselKey) ?? 0) <= 1) {
                groups.push({ kind: 'single-row', row });
                return;
            }

            const existingRows = groupedRows.get(vesselKey);

            if (existingRows) {
                existingRows.push(row);
                return;
            }

            groupedRows.set(vesselKey, [row]);
            groups.push({
                kind: 'shared-vessel',
                vesselKey,
                vesselName: row.selectedTransaction.vesselName ?? 'Unnamed Vessel',
                readyCount: readyVesselCounts.get(vesselKey) ?? 0,
                rows: groupedRows.get(vesselKey) ?? [],
            });
        });

        return groups;
    }, [readyRows, readyVesselCounts]);

    return (
        <div className="flex h-full flex-1 flex-col bg-app-bg">
            <div className="border-b border-border bg-surface px-4 pb-3 pt-4">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Finance & Accounting Tasks</h1>
                <p className="mt-1 text-sm text-text-secondary">
                    Prioritize ready billing uploads, then monitor blocked transactions by urgency and oldest wait time.
                </p>

                <div className="mt-4 flex flex-wrap gap-4 border-b border-border">
                    <QueueViewButton
                        isActive={view === 'import'}
                        label="Imports"
                        count={importCount}
                        onClick={() => setView('import')}
                    />
                    <QueueViewButton
                        isActive={view === 'export'}
                        label="Exports"
                        count={exportCount}
                        onClick={() => setView('export')}
                    />
                </div>

                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Visible Queue"
                        value={queueSummary.visible}
                        accent="border-border bg-surface-secondary/40"
                        valueTone="text-text-primary"
                    />
                    <SummaryCard
                        label="Ready Now"
                        value={queueSummary.ready}
                        accent="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                        valueTone="text-emerald-700 dark:text-emerald-300"
                    />
                    <SummaryCard
                        label="Blocked"
                        value={queueSummary.waiting}
                        accent="border-slate-200 bg-slate-50/70 dark:border-border/70 dark:bg-surface-secondary/30"
                        valueTone="text-slate-700 dark:text-text-primary"
                    />
                    <SummaryCard
                        label="Overdue"
                        value={queueSummary.overdue}
                        accent="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
                        valueTone="text-amber-700 dark:text-amber-300"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-secondary/20 px-4 pb-8 pt-3">
                {isLoading && (
                    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
                        Loading accounting queue...
                    </div>
                )}

                {isError && !isLoading && (
                    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
                        Accounting queue failed to load. Refresh the page and try again.
                    </div>
                )}

                {!isLoading && !isError && activeRows.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-16 text-center text-text-muted">
                        <Icon name="archive" className="h-12 w-12 opacity-50" />
                        <p className="mt-4 text-sm font-semibold">No accounting upload tasks available</p>
                    </div>
                )}

                {!isLoading && !isError && activeRows.length > 0 && filteredRows.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
                        No accounting tasks match the current search and filter.
                    </div>
                )}

                {!isLoading && !isError && filteredRows.length > 0 && (
                    <div className="space-y-4">
                        <QueueSection
                            title="Ready to Upload"
                            description="Billing work that is fully unblocked and ready for finance upload."
                            tone="ready"
                            emptyMessage="No accounting files are ready right now."
                            rows={readyRows}
                            readyGroups={readyQueueGroups}
                            onOpen={(row, entryMode) => {
                                setSelectedEntryMode(entryMode);
                                setSelectedTx(row.selectedTransaction);
                            }}
                        />
                        <QueueSection
                            title="Waiting / Monitoring"
                            description="Blocked accounting transactions sorted with overdue items first."
                            tone="waiting"
                            emptyMessage="No waiting accounting transactions."
                            rows={waitingRows}
                            onOpen={(row, entryMode) => {
                                setSelectedEntryMode(entryMode);
                                setSelectedTx(row.selectedTransaction);
                            }}
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
                    vesselName={selectedTx.vesselName}
                    vesselUploadCount={selectedVesselUploadCount}
                    entryMode={selectedEntryMode}
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
        className={`flex items-center gap-2 border-b-2 px-2 pb-2.5 text-sm font-bold transition-colors ${
            isActive
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-300'
                : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
    >
        {label}
        {count > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${isActive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-surface-secondary text-text-muted dark:bg-surface-secondary/80'}`}>
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
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300'
                : 'border-border bg-surface text-text-secondary hover:text-text-primary'
        }`}
    >
        {label}
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-surface-secondary text-text-muted dark:bg-surface-secondary/80'}`}>
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
    <div className={`rounded-xl border px-3 py-2 shadow-sm ${accent}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">{label}</p>
        <p className={`mt-1.5 text-xl font-bold ${valueTone}`}>{value}</p>
    </div>
);

const QueueSection = ({
    title,
    description,
    tone,
    emptyMessage,
    rows,
    readyGroups,
    onOpen,
}: {
    title: string;
    description: string;
    tone: QueueState;
    emptyMessage: string;
    rows: AccountingQueueRow[];
    readyGroups?: ReadyQueueGroup[];
    onOpen: (row: AccountingQueueRow, entryMode: 'single-transaction' | 'shared-vessel') => void;
}) => (
    <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
            <div className={`h-4 w-1 rounded-full ${tone === 'ready' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
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
                    className="hidden items-center gap-3 border-b border-border bg-surface-secondary/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted lg:grid"
                    style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) auto' }}
                >
                    <span>Reference</span>
                    <span>Next Step</span>
                    <span>Context</span>
                    <span>Status</span>
                    <span>Action</span>
                </div>

                <div className="divide-y divide-border/50">
                    {readyGroups
                        ? readyGroups.map((group, index) => {
                            if (group.kind === 'single-row') {
                                const row = group.row;

                                return (
                                    <QueueRow
                                        key={`${row.selectedTransaction.type}-${row.id}`}
                                        row={row}
                                        onOpen={() => onOpen(row, 'single-transaction')}
                                    />
                                );
                            }

                            return (
                                <SharedVesselGroup
                                    key={`${group.vesselKey}-${index}`}
                                    vesselName={group.vesselName}
                                    readyCount={group.readyCount}
                                    rows={group.rows}
                                    onOpen={onOpen}
                                />
                            );
                        })
                        : rows.map((row) => (
                            <QueueRow
                                key={`${row.selectedTransaction.type}-${row.id}`}
                                row={row}
                                onOpen={() => onOpen(row, 'single-transaction')}
                            />
                        ))}
                </div>
            </div>
        )}
    </section>
);

const QueueRow = ({
    row,
    onOpen,
    actionMode = 'button',
}: {
    row: AccountingQueueRow;
    onOpen: () => void;
    actionMode?: 'button' | 'none';
}) => (
    <div className={`grid gap-3 px-4 py-3 ${row.state === 'ready' ? 'bg-surface' : 'bg-slate-50/70 dark:bg-surface-secondary/20'}`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-bold tracking-tight text-text-primary">{row.ref}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                        row.selectedTransaction.type === 'import'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                            : 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300'
                    }`}>
                        {row.typeLabel}
                    </span>
                    {row.isOverdue && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                            Overdue
                        </span>
                    )}
                </div>
                <p className="mt-1 truncate text-sm text-text-secondary">{row.clientName}</p>
                <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                    Vessel: {row.selectedTransaction.vesselName ?? 'Not set'}
                </p>
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
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
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
                {actionMode === 'button' ? (
                    <button
                        type="button"
                        onClick={onOpen}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                            row.state === 'ready'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/35'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-surface-secondary/60 dark:text-text-primary dark:hover:bg-surface-secondary'
                        }`}
                    >
                        {row.state === 'ready' ? 'Open Tasks' : 'View Details'}
                        <Icon name="chevron-right" className="h-3.5 w-3.5" />
                    </button>
                ) : (
                    <span className="text-[11px] font-medium text-text-muted">Included in vessel upload</span>
                )}
            </div>
        </div>
    </div>
);

const SharedVesselGroup = ({
    vesselName,
    readyCount,
    rows,
    onOpen,
}: {
    vesselName: string;
    readyCount: number;
    rows: AccountingQueueRow[];
    onOpen: (row: AccountingQueueRow, entryMode: 'single-transaction' | 'shared-vessel') => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-blue-50/30 dark:bg-surface-secondary/10">
            <div className="border-b border-blue-100 bg-blue-50/60 px-4 py-3 dark:border-border/60 dark:bg-surface/70">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                            {readyCount} Ready BLs
                        </span>
                        <div className="mt-2 flex items-start gap-3">
                            <button
                                type="button"
                                onClick={() => setIsExpanded((current) => !current)}
                                className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-300 dark:hover:bg-blue-950/45"
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${vesselName} shared vessel group`}
                            >
                                <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} className="h-4 w-4" />
                            </button>
                            <div className="min-w-0">
                                <p className="text-base font-bold tracking-tight text-text-primary">{vesselName}</p>
                                <p className="mt-1 text-xs text-text-secondary">
                                    Billing & Liquidation is shared across every ready BL on this vessel.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center lg:self-stretch">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                const primaryRow = rows[0];

                                if (primaryRow) {
                                    onOpen(primaryRow, 'shared-vessel');
                                }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/35"
                        >
                            Open Shared Upload
                            <Icon name="chevron-right" className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="relative px-4 py-2">
                    <div className="absolute bottom-3 left-8 top-3 hidden w-px bg-blue-100 dark:bg-border/55 lg:block" />
                    <div className="space-y-2">
                        {rows.map((row) => (
                            <div key={`${row.selectedTransaction.type}-${row.id}`} className="relative lg:pl-6">
                                <div className="absolute left-[1.15rem] top-6 hidden h-2.5 w-2.5 rounded-full border border-blue-200 bg-white dark:border-blue-900/40 dark:bg-surface lg:block" />
                                <QueueRow row={row} onOpen={() => onOpen(row, 'single-transaction')} actionMode="none" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StageChip = ({ chip }: { chip: QueueStageChip }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${stageToneClassName(chip.tone)}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {chip.label}
    </span>
);

function getVesselKey(vesselName: string | null | undefined): string | null {
    if (!vesselName) {
        return null;
    }

    const normalized = vesselName.trim().toLowerCase();

    return normalized ? normalized : null;
}
