import {
    AlertCircle,
    Calendar,
    Clock,
    Flag,
    FolderArchive,
    Layers,
    Receipt,
    Search,
    Truck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
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
import { useProcessorTaskQueue } from '../hooks/useProcessorTaskQueue';
import {
    FILTER_META,
    stageToneClassName,
    type ProcessorQueueRow,
    type QueueStageChip,
    type QueueState,
} from '../utils/processorTransaction.utils';
import { ProcessorUploadModal } from './ProcessorUploadModal';

export const ProcessorTransactionPage = () => {
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
    } = useProcessorTaskQueue();

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Processor Task Queue
                </h1>
                <p className="text-sm text-muted-foreground">
                    Scan ready uploads first, then monitor blocked transactions by urgency and oldest waiting time.
                </p>
            </div>

            {/* Error Banner */}
            {isError && !isLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    Processor queue failed to load. Please refresh the page and try again.
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
                            Unblocked and ready for processor action
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
                            Imports (PPA / Port Charges)
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                                {importCount}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="export" className="gap-2 px-3 text-xs">
                            <Flag className="size-3.5 text-emerald-500" />
                            Exports (CIL / DCCCI)
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
                            Loading processor queue...
                        </div>
                    )}

                    {!isLoading && !isError && activeRows.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <FolderArchive className="size-12 opacity-50 mb-3" />
                            <p className="text-sm font-semibold text-foreground">No processor upload tasks available</p>
                        </div>
                    )}

                    {!isLoading && !isError && activeRows.length > 0 && filteredRows.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                            No processor tasks match the current search and filter.
                        </div>
                    )}

                    {!isLoading && !isError && filteredRows.length > 0 && (
                        <div className="space-y-6">
                            <QueueSection
                                title="Ready to Upload"
                                description="Unblocked processor-owned stages, sorted so the oldest waiting work stays near the top."
                                tone="ready"
                                emptyMessage="No processor uploads are ready right now."
                                rows={readyRows}
                                onOpen={(row) => setSelectedTx(row.selectedTransaction)}
                            />

                            <QueueSection
                                title="Waiting / Monitoring"
                                description="Blocked transactions sorted by overdue items first, then by oldest wait."
                                tone="waiting"
                                emptyMessage="No waiting processor transactions."
                                rows={waitingRows}
                                onOpen={(row) => setSelectedTx(row.selectedTransaction)}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {selectedTx && (
                <ProcessorUploadModal
                    isOpen={!!selectedTx}
                    onClose={() => setSelectedTx(null)}
                    transactionId={selectedTx.id}
                    reference={selectedTx.ref}
                    type={selectedTx.type}
                    clientName={selectedTx.clientName}
                    transactionStages={selectedTx.stages}
                    transactionNotApplicableStages={selectedTx.notApplicableStages}
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
    onOpen,
}: {
    title: string;
    description: string;
    tone: QueueState;
    emptyMessage: string;
    rows: ProcessorQueueRow[];
    onOpen: (row: ProcessorQueueRow) => void;
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
                    {rows.length}
                </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        ) : (
            <Card className="p-0 overflow-hidden shadow-2xs">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference / BL</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client / Vessel</TableHead>
                            <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Step / Blocker</TableHead>
                            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context</TableHead>
                            <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stages</TableHead>
                            <TableHead className="w-[140px] text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <QueueTableRow key={`${row.selectedTransaction.type}-${row.id}`} row={row} onOpen={() => onOpen(row)} />
                        ))}
                    </TableBody>
                </Table>
            </Card>
        )}
    </section>
);

const QueueTableRow = ({
    row,
    onOpen,
}: {
    row: ProcessorQueueRow;
    onOpen: () => void;
}) => {
    const isImport = row.selectedTransaction.type === 'import';
    const displayTitle = isImport ? (row.customsRef || row.ref) : (row.blNo || row.ref);

    return (
        <TableRow className={`hover:bg-muted/50 transition-colors ${row.state === 'ready' ? 'bg-card' : 'bg-muted/10'}`}>
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
                    {isImport && row.blNo && (
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
                {row.vesselName && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate max-w-[200px]">
                        Vessel: <span className="font-medium text-foreground/80">{row.vesselName}</span>
                    </p>
                )}
            </TableCell>

            {/* Next Step / Blocker */}
            <TableCell className="py-3.5 px-4 align-top">
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                    {row.state === 'ready' ? row.nextActionLabel : (row.blocker ?? 'Waiting for encoder progress.')}
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

            {/* Stages */}
            <TableCell className="py-3.5 px-4 align-top">
                <div className="flex flex-wrap gap-1.5">
                    {row.stageChips.map((chip) => (
                        <StageChip key={chip.key} chip={chip} />
                    ))}
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell className="py-3.5 px-4 align-top text-end">
                <Button
                    variant={row.state === 'ready' ? 'default' : 'outline'}
                    size="sm"
                    onClick={onOpen}
                    className="h-8 px-3 text-xs font-semibold cursor-pointer shadow-2xs"
                >
                    View
                </Button>
            </TableCell>
        </TableRow>
    );
};

const StageChip = ({ chip }: { chip: QueueStageChip }) => {
    const toneClass = stageToneClassName(chip.tone);

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>
            <span className="size-1.5 rounded-full bg-current opacity-80" />
            {chip.label}
        </span>
    );
};
