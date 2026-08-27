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
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Pagination } from '../../../components/Pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
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
    type QueueFilter,
    type AccountingQueueRow,
    type QueueStageChip,
    type QueueState,
} from '../utils/accountingTransaction.utils';
import { AccountingUploadModal } from './AccountingUploadModal';

type ReadySingleRowGroup = {
    kind: 'single-row';
    row: AccountingQueueRow;
};

type ReadySharedVesselGroup = {
    kind: 'shared-vessel';
    vesselKey: string;
    vesselName: string;
    readyCount: number;
    rows: AccountingQueueRow[];
};

type ReadyQueueGroup = ReadySingleRowGroup | ReadySharedVesselGroup;

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

    const [queueTab, setQueueTab] = useState<'ready' | 'waiting'>('ready');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(30);

    const handleFilterChange = (newFilter: QueueFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
        if (newFilter === 'blocked' || newFilter === 'overdue') {
            setQueueTab('waiting');
        } else if (newFilter === 'ready') {
            setQueueTab('ready');
        }
    };

    const handleTabChange = (tab: 'ready' | 'waiting') => {
        setQueueTab(tab);
        setCurrentPage(1);
        if (tab === 'ready' && (filter === 'blocked' || filter === 'overdue')) {
            setFilter('all');
        } else if (tab === 'waiting' && filter === 'ready') {
            setFilter('all');
        }
    };

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

    const totalReadyPages = Math.max(1, Math.ceil(readyQueueGroups.length / perPage));
    const paginatedReadyGroups = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return readyQueueGroups.slice(start, start + perPage);
    }, [readyQueueGroups, currentPage, perPage]);

    const totalWaitingPages = Math.max(1, Math.ceil(waitingRows.length / perPage));
    const paginatedWaitingRows = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return waitingRows.slice(start, start + perPage);
    }, [waitingRows, currentPage, perPage]);

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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Visible Queue */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Visible Queue</CardTitle>
                        <Layers className="size-4 text-muted-foreground/70" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : queueSummary.visible}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {view === 'import' ? `${importCount} imports` : `${exportCount} exports`} in view
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Ready Now */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Ready Now</CardTitle>
                        <Receipt className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : queueSummary.ready}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Unblocked and ready for billing
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Blocked */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Blocked</CardTitle>
                        <Clock className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : queueSummary.waiting}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Awaiting preceding stages
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Overdue */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Overdue</CardTitle>
                        <AlertCircle className={`size-4 ${queueSummary.overdue > 0 ? 'text-rose-500' : 'text-muted-foreground/70'}`} />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div
                            className={`text-2xl font-bold tracking-tight tabular-nums ${
                                queueSummary.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                            }`}
                        >
                            {isLoading ? '—' : queueSummary.overdue}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {queueSummary.overdue === 0 ? 'No overdue items' : 'Waiting > 48 hours'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Section 2: Tabbed Workspace Toolbar */}
            <Tabs
                value={view}
                onValueChange={(val) => {
                    setView(val as 'import' | 'export');
                    setCurrentPage(1);
                }}
                className="w-full space-y-4"
            >
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
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setCurrentPage(1);
                                }}
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
                                        onClick={() => handleFilterChange(option.key)}
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

                {/* Sub-tabs for Queue Separation (Ready vs Waiting) */}
                <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => handleTabChange('ready')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            queueTab === 'ready'
                                ? 'bg-background text-foreground shadow-2xs border border-border/60'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                    >
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Ready to Upload
                        <Badge
                            variant={queueTab === 'ready' ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 font-bold"
                        >
                            {readyRows.length}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('waiting')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            queueTab === 'waiting'
                                ? 'bg-background text-foreground shadow-2xs border border-border/60'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                    >
                        <span className="size-2 rounded-full bg-amber-500" />
                        Waiting / Monitoring
                        <Badge
                            variant={queueTab === 'waiting' ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 font-bold"
                        >
                            {waitingRows.length}
                        </Badge>
                    </button>
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
                            {queueTab === 'ready' ? (
                                <QueueSection
                                    title="Ready to Upload"
                                    description="Billing work that is fully unblocked and ready for finance upload."
                                    tone="ready"
                                    emptyMessage="No accounting files are ready right now."
                                    rows={readyRows}
                                    readyGroups={paginatedReadyGroups}
                                    totalCount={readyRows.length}
                                    currentPage={currentPage}
                                    totalPages={totalReadyPages}
                                    perPage={perPage}
                                    onPageChange={setCurrentPage}
                                    onPerPageChange={(newPerPage) => {
                                        setPerPage(newPerPage);
                                        setCurrentPage(1);
                                    }}
                                    view={view}
                                    onOpen={(row, entryMode) => {
                                        setSelectedEntryMode(entryMode);
                                        setSelectedTx(row.selectedTransaction);
                                    }}
                                />
                            ) : (
                                <QueueSection
                                    title="Waiting / Monitoring"
                                    description="Blocked accounting transactions sorted with overdue items first."
                                    tone="waiting"
                                    emptyMessage="No waiting accounting transactions."
                                    rows={paginatedWaitingRows}
                                    totalCount={waitingRows.length}
                                    currentPage={currentPage}
                                    totalPages={totalWaitingPages}
                                    perPage={perPage}
                                    onPageChange={setCurrentPage}
                                    onPerPageChange={(newPerPage) => {
                                        setPerPage(newPerPage);
                                        setCurrentPage(1);
                                    }}
                                    view={view}
                                    onOpen={(row, entryMode) => {
                                        setSelectedEntryMode(entryMode);
                                        setSelectedTx(row.selectedTransaction);
                                    }}
                                />
                            )}
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
    totalCount,
    currentPage,
    totalPages,
    perPage,
    onPageChange,
    onPerPageChange,
    view,
    onOpen,
}: {
    title: string;
    description: string;
    tone: QueueState;
    emptyMessage: string;
    rows: AccountingQueueRow[];
    readyGroups?: ReadyQueueGroup[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    view: 'import' | 'export';
    onOpen: (row: AccountingQueueRow, entryMode: 'single-transaction' | 'shared-vessel') => void;
}) => (
    <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <div className={`h-4 w-1 rounded-full ${tone === 'ready' ? 'bg-emerald-500' : 'bg-muted-foreground/60'}`} />
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 font-medium ${
                        tone === 'ready'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-border bg-muted/60 text-muted-foreground'
                    }`}
                >
                    {totalCount}
                </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {totalCount === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        ) : (
            <Card className="p-0 overflow-hidden shadow-2xs border-border/80">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {view === 'import' ? 'Reference / BL' : 'Bill of Lading'}
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client / Vessel</TableHead>
                            <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Step / Blocker</TableHead>
                            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context</TableHead>
                            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                            <TableHead className="w-[140px] text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {readyGroups
                            ? readyGroups.map((group, index) => {
                                if (group.kind === 'single-row') {
                                    const row = group.row;

                                    return (
                                        <QueueTableRow
                                            key={`${row.selectedTransaction.type}-${row.id}`}
                                            row={row}
                                            onOpen={() => onOpen(row, 'single-transaction')}
                                        />
                                    );
                                }

                                return (
                                    <SharedVesselTableGroup
                                        key={`${group.vesselKey}-${index}`}
                                        vesselName={group.vesselName}
                                        readyCount={group.readyCount}
                                        rows={group.rows}
                                        onOpen={onOpen}
                                    />
                                );
                            })
                            : rows.map((row) => (
                                <QueueTableRow
                                    key={`${row.selectedTransaction.type}-${row.id}`}
                                    row={row}
                                    onOpen={() => onOpen(row, 'single-transaction')}
                                />
                            ))}
                    </TableBody>
                </Table>

                {totalCount > 0 && (
                    <div className="p-3 border-t border-border/80 bg-muted/20">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            perPage={perPage}
                            perPageOptions={[15, 30, 50, 100]}
                            onPageChange={onPageChange}
                            onPerPageChange={onPerPageChange}
                            compact
                        />
                    </div>
                )}
            </Card>
        )}
    </section>
);

const QueueTableRow = ({
    row,
    onOpen,
    actionMode = 'button',
    isGroupChild = false,
}: {
    row: AccountingQueueRow;
    onOpen: () => void;
    actionMode?: 'button' | 'none';
    isGroupChild?: boolean;
}) => {
    const isImport = row.selectedTransaction.type === 'import';
    const displayTitle = isImport ? (row.customsRef || row.blNo || row.ref) : (row.blNo || row.ref);

    return (
        <TableRow className={`hover:bg-muted/50 transition-colors ${isGroupChild ? 'bg-primary/5' : (row.state === 'ready' ? 'bg-card' : 'bg-muted/10')}`}>
            {/* Reference / BL */}
            <TableCell className="py-3.5 px-4 align-top">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground block">
                            {displayTitle}
                        </span>
                        <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 font-medium shrink-0 ${
                                isImport
                                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                        >
                            {row.typeLabel}
                        </Badge>
                        {row.isOverdue && (
                            <Badge
                                variant="destructive"
                                className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1"
                            >
                                <AlertCircle className="size-2.5" /> Overdue
                            </Badge>
                        )}
                    </div>
                    {isImport && row.customsRef && row.blNo && (
                        <p className="text-[11px] text-muted-foreground">
                            BL: <span className="font-medium text-foreground">{row.blNo}</span>
                        </p>
                    )}
                </div>
            </TableCell>

            {/* Client / Vessel */}
            <TableCell className="py-3.5 px-4 align-top">
                <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                    {row.clientName}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate max-w-[200px]">
                    Vessel: {row.selectedTransaction.vesselName ?? 'Not set'}
                </p>
            </TableCell>

            {/* Next Step / Blocker */}
            <TableCell className="py-3.5 px-4 align-top">
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                    {row.state === 'ready' ? row.actionSummary : (row.blocker ?? 'Waiting for workflow progress.')}
                </p>
                {row.waitingLabel && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="size-3 shrink-0" />
                        <span>{row.waitingLabel}</span>
                    </div>
                )}
            </TableCell>

            {/* Context */}
            <TableCell className="py-3.5 px-4 align-top">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{row.primaryMeta}</span>
                </div>
            </TableCell>

            {/* Status */}
            <TableCell className="py-3.5 px-4 align-top">
                <StageChip chip={row.stageChip} />
            </TableCell>

            {/* Actions */}
            <TableCell className="py-3.5 px-4 align-top text-end">
                {actionMode === 'button' ? (
                    <Button
                        variant={row.state === 'ready' ? 'default' : 'outline'}
                        size="sm"
                        onClick={onOpen}
                        className="h-8 px-3 text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                        View
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground italic">Included in vessel upload</span>
                )}
            </TableCell>
        </TableRow>
    );
};

const SharedVesselTableGroup = ({
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
        <>
            {/* Header row for Shared Vessel */}
            <TableRow className="border-b border-primary/20 bg-primary/10 hover:bg-primary/15 transition-colors">
                <TableCell colSpan={6} className="py-3 px-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsExpanded((current) => !current)}
                                className="inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-card text-primary transition-colors hover:bg-primary/10 cursor-pointer"
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${vesselName} shared vessel group`}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="size-3.5" />
                                ) : (
                                    <ChevronRight className="size-3.5" />
                                )}
                            </button>
                            <Ship className="size-4 text-primary shrink-0" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold tracking-tight text-foreground">{vesselName}</span>
                                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0 font-semibold">
                                        {readyCount} Ready BLs
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Billing & Liquidation is shared across every ready BL on this vessel.
                                </p>
                            </div>
                        </div>

                        <div>
                            <Button
                                size="sm"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    const primaryRow = rows[0];
                                    if (primaryRow) {
                                        onOpen(primaryRow, 'shared-vessel');
                                    }
                                }}
                                className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                            >
                                Open Shared Upload
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </TableCell>
            </TableRow>

            {/* Child rows when expanded */}
            {isExpanded &&
                rows.map((row) => (
                    <QueueTableRow
                        key={`${row.selectedTransaction.type}-${row.id}`}
                        row={row}
                        onOpen={() => onOpen(row, 'single-transaction')}
                        actionMode="none"
                        isGroupChild
                    />
                ))}
        </>
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
