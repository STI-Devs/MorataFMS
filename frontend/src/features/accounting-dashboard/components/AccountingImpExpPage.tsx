import { useMemo, useState } from 'react';
import {
    AlertCircle,
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    Flag,
    FolderArchive,
    Layers,
    Receipt,
    Search,
    Ship,
    Truck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../../../components/ui/tabs';
import { useAccountingTaskQueue } from '../hooks/useAccountingTaskQueue';
import {
    FILTER_META,
    stageToneClassName,
    type AccountingQueueRow,
    type QueueStageChip,
    type QueueState,
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
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Finance & Accounting Tasks
                </h1>
                <p className="text-sm text-muted-foreground">
                    Prioritize ready billing uploads, then monitor blocked transactions by urgency and oldest wait time.
                </p>
            </div>

            {/* Error Banner */}
            {isError && !isLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    Accounting queue failed to load. Please refresh the page and try again.
                </div>
            )}

            {/* Section 1: KPI Metrics Cards */}
            <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Visible Queue</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1">
                                <Layers className="size-3 text-primary" /> Queue
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {isLoading ? '...' : queueSummary.visible}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {view === 'import' ? `${importCount} imports` : `${exportCount} exports`} in view
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Ready Now</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Receipt className="size-3 text-emerald-500" /> Actionable
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {isLoading ? '...' : queueSummary.ready}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            Unblocked and ready for billing
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Blocked</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1 border-border bg-muted/60 text-muted-foreground">
                                <Clock className="size-3" /> Waiting
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {isLoading ? '...' : queueSummary.waiting}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            Awaiting preceding stages
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Overdue</span>
                            <Badge
                                variant={queueSummary.overdue > 0 ? 'destructive' : 'outline'}
                                className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1"
                            >
                                <AlertCircle className="size-3" /> Overdue
                            </Badge>
                        </div>
                        <div className={`text-xl sm:text-2xl font-bold tabular-nums ${queueSummary.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {isLoading ? '...' : queueSummary.overdue}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {queueSummary.overdue === 0 ? 'No overdue items' : 'Waiting > 48 hours'}
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Section 2: Tabbed Workspace Toolbar */}
            <Tabs value={view} onValueChange={(val) => setView(val as 'import' | 'export')} className="w-full space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <TabsList className="h-9 p-1 bg-muted/60">
                        <TabsTrigger value="import" className="gap-2 px-3 text-xs">
                            <Truck className="size-3.5 text-blue-500" />
                            Imports
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                                {importCount}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="export" className="gap-2 px-3 text-xs">
                            <Flag className="size-3.5 text-emerald-500" />
                            Exports
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                                {exportCount}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* Search & Quick Filters */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative min-w-[240px] sm:w-64">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search BL, ref, client, vessel, blocker..."
                                className="h-9 pl-8.5 pr-3 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                            {FILTER_META.map((option) => {
                                const isSelected = filter === option.key;
                                return (
                                    <Button
                                        key={option.key}
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilter(option.key)}
                                        className="h-8 px-2.5 text-xs gap-1.5 font-medium shrink-0"
                                    >
                                        {option.label}
                                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                                            isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {filterCounts[option.key]}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Section 3: Task Lists Content */}
                <TabsContent value={view} className="mt-0 space-y-6">
                    {isLoading && (
                        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                            Loading accounting queue...
                        </div>
                    )}

                    {!isLoading && !isError && activeRows.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <FolderArchive className="size-12 opacity-50 mb-3" />
                            <p className="text-sm font-semibold text-foreground">No accounting upload tasks available</p>
                        </div>
                    )}

                    {!isLoading && !isError && activeRows.length > 0 && filteredRows.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                            No accounting tasks match the current search and filter.
                        </div>
                    )}

                    {!isLoading && !isError && filteredRows.length > 0 && (
                        <div className="space-y-6">
                            <QueueSection
                                title="Ready to Upload"
                                description="Billing work that is fully unblocked and ready for finance upload."
                                tone="ready"
                                emptyMessage="No accounting files are ready right now."
                                rows={readyRows}
                                readyGroups={readyQueueGroups}
                                view={view}
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
                                view={view}
                                onOpen={(row, entryMode) => {
                                    setSelectedEntryMode(entryMode);
                                    setSelectedTx(row.selectedTransaction);
                                }}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

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

const QueueSection = ({
    title,
    description,
    tone,
    emptyMessage,
    rows,
    readyGroups,
    view,
    onOpen,
}: {
    title: string;
    description: string;
    tone: QueueState;
    emptyMessage: string;
    rows: AccountingQueueRow[];
    readyGroups?: ReadyQueueGroup[];
    view: 'import' | 'export';
    onOpen: (row: AccountingQueueRow, entryMode: 'single-transaction' | 'shared-vessel') => void;
}) => (
    <section className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
            <div className={`h-4 w-1 rounded-full ${tone === 'ready' ? 'bg-emerald-500' : 'bg-muted-foreground/60'}`} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold text-muted-foreground">
                {rows.length}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {description}</span>
        </div>

        {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
                <div
                    className="hidden items-center gap-3 border-b border-border/80 bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground lg:grid"
                    style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) auto' }}
                >
                    <span>{view === 'import' ? 'Customs Ref / Client' : 'Bill of Lading / Client'}</span>
                    <span>Next Step</span>
                    <span>Schedule / Context</span>
                    <span>Status</span>
                    <span className="text-end">Actions</span>
                </div>

                <div className="divide-y divide-border/60">
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
    <div className={`px-4 py-3.5 transition-colors ${row.state === 'ready' ? 'bg-card hover:bg-muted/30' : 'bg-muted/15 hover:bg-muted/30'}`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
            {/* Column 1: Reference / Client */}
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                        {row.customsRef ?? row.blNo ?? row.ref}
                    </span>
                    <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 font-medium ${
                            row.selectedTransaction.type === 'import'
                                ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                    >
                        {row.typeLabel}
                    </Badge>
                    {row.isOverdue && (
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-medium border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        >
                            Overdue
                        </Badge>
                    )}
                </div>
                {row.customsRef && row.blNo && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate font-normal">
                        BL: <span className="text-foreground/80 font-medium">{row.blNo}</span>
                    </p>
                )}
                <p className="mt-0.5 truncate text-xs text-muted-foreground font-medium">{row.clientName}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    Vessel: {row.selectedTransaction.vesselName ?? 'Not set'}
                </p>
                {row.secondaryMeta && (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{row.secondaryMeta}</p>
                )}
            </div>

            {/* Column 2: Next Step / Blocker */}
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {row.state === 'ready' ? 'Next Upload' : 'Blocked By'}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                    {row.state === 'ready' ? row.actionSummary : (row.blocker ?? 'Waiting for workflow progress.')}
                </p>
                {row.waitingLabel && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <Clock className="size-3 shrink-0" />
                        {row.waitingLabel}
                    </span>
                )}
            </div>

            {/* Column 3: Context / Schedule */}
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Context</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                        <Calendar className="size-3 text-muted-foreground shrink-0" />
                        {row.primaryMeta}
                    </span>
                </div>
            </div>

            {/* Column 4: Status */}
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                    <StageChip chip={row.stageChip} />
                </div>
            </div>

            {/* Column 5: Action */}
            <div className="flex items-center justify-start lg:justify-end">
                {actionMode === 'button' ? (
                    <Button
                        variant={row.state === 'ready' ? 'default' : 'secondary'}
                        size="sm"
                        onClick={onOpen}
                        className="h-8 gap-1 text-xs font-semibold"
                    >
                        {row.state === 'ready' ? 'Open Tasks' : 'View Details'}
                        <ChevronRight className="size-3.5" />
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground">Included in vessel upload</span>
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
        <div className="bg-primary/5">
            <div className="border-b border-primary/20 bg-primary/10 px-4 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 font-semibold">
                            {readyCount} Ready BLs
                        </Badge>
                        <div className="mt-2 flex items-start gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsExpanded((current) => !current)}
                                className="mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-primary/20 bg-card text-primary transition-colors hover:bg-primary/10 cursor-pointer"
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${vesselName} shared vessel group`}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="size-3.5" />
                                ) : (
                                    <ChevronRight className="size-3.5" />
                                )}
                            </button>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Ship className="size-4 text-primary shrink-0" />
                                    <p className="text-sm font-bold tracking-tight text-foreground">{vesselName}</p>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Billing & Liquidation is shared across every ready BL on this vessel.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center lg:self-stretch">
                        <Button
                            size="sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                const primaryRow = rows[0];

                                if (primaryRow) {
                                    onOpen(primaryRow, 'shared-vessel');
                                }
                            }}
                            className="h-8 gap-1.5 text-xs font-semibold"
                        >
                            Open Shared Upload
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="relative px-4 py-2">
                    <div className="absolute bottom-3 left-8 top-3 hidden w-px bg-primary/20 lg:block" />
                    <div className="space-y-2">
                        {rows.map((row) => (
                            <div key={`${row.selectedTransaction.type}-${row.id}`} className="relative lg:pl-6">
                                <div className="absolute left-[1.15rem] top-6 hidden h-2.5 w-2.5 rounded-full border border-primary/20 bg-card lg:block" />
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
    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold gap-1.5 ${stageToneClassName(chip.tone)}`}>
        <span className="size-1.5 rounded-full bg-current opacity-80" />
        {chip.label}
    </Badge>
);

function getVesselKey(vesselName: string | null | undefined): string | null {
    if (!vesselName) {
        return null;
    }

    const normalized = vesselName.trim().toLowerCase();

    return normalized ? normalized : null;
}
