import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck,
    Flag,
    Ship,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    MoreHorizontal,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../../../../components/ui/tabs';
import { EmptyState } from '../../../../components/EmptyState';
import { StatusBadge } from '../../../../components/StatusBadge';
import { appRoutes } from '../../../../lib/appRoutes';
import { useAllExportsData, useAllImportsData } from '../../hooks/useAllTransactionRecords';
import { useExportVesselGroups, useImportVesselGroups } from '../../hooks/useVesselGrouping';
import type { ApiExportTransaction, ApiImportTransaction, VesselGroup } from '../../types';

const LIVE_PARAMS = { exclude_statuses: 'completed,cancelled' };
const PER_PAGE_OPTIONS = [15, 20, 50];
const DEFAULT_PER_PAGE = 20;

function formatDateLabel(dateString: string | null | undefined): string {
    if (!dateString) return '—';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function toTitleCase(str: string | null | undefined): string {
    if (!str) return '—';
    return str
        .toLowerCase()
        .replace(/\b([a-z])/g, (match) => match.toUpperCase())
        .replace(/\b([a-z0-9]*\d[a-z0-9]*)\b/gi, (match) => match.toUpperCase())
        .replace(/\bCma\b/gi, 'CMA')
        .replace(/\bCgm\b/gi, 'CGM')
        .replace(/\bMsc\b/gi, 'MSC')
        .replace(/\bApl\b/gi, 'APL')
        .replace(/\bOne\b/gi, 'ONE')
        .replace(/\bInc\b\.?/gi, 'Inc.')
        .replace(/\bCo\b\.?/gi, 'Co.')
        .replace(/\bCorp\b\.?/gi, 'Corp.')
        .replace(/\bLlc\b/gi, 'LLC')
        .replace(/\bLtd\b\.?/gi, 'Ltd.')
        .replace(/\.{2,}/g, '.');
}

type AnyVesselGroup = VesselGroup<ApiImportTransaction> | VesselGroup<ApiExportTransaction>;

interface VesselListViewProps {
    groups: AnyVesselGroup[];
    isLoading: boolean;
    typeLabel: string;
    emptyLabel: string;
    searchQuery: string;
    statusFilter: string;
}

function VesselListView({
    groups,
    isLoading,
    typeLabel,
    emptyLabel,
    searchQuery,
    statusFilter,
}: VesselListViewProps) {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
    // Track only what the user explicitly collapsed; the expanded set is derived
    // so newly arrived groups are expanded by default (avoids setState-in-render).
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
        () => new Set()
    );
    const expandedGroups = useMemo(
        () =>
            new Set(
                groups
                    .map((g) => g.vesselKey)
                    .filter((key) => !collapsedGroups.has(key))
            ),
        [groups, collapsedGroups]
    );

    // Filter groups based on search query and status filter
    const filteredGroups = useMemo<AnyVesselGroup[]>(() => {
        const result: AnyVesselGroup[] = [];
        for (const group of groups) {
            if (group.type === 'import') {
                let txns = group.transactions as ApiImportTransaction[];
                if (statusFilter !== 'all') {
                    txns = txns.filter(
                        (t) => (t.status ?? '').toLowerCase() === statusFilter.toLowerCase()
                    );
                }
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchesVessel = group.vesselName.toLowerCase().includes(q);
                    const matchingTxns = txns.filter((t) => {
                        const ref = t.customs_ref_no;
                        const clientName = t.importer?.name;
                        const blNo = t.bl_no;
                        return (
                            (ref && ref.toLowerCase().includes(q)) ||
                            (blNo && blNo.toLowerCase().includes(q)) ||
                            (clientName && clientName.toLowerCase().includes(q))
                        );
                    });
                    if (matchesVessel && txns.length > 0) {
                        result.push({ ...group, transactions: txns });
                    } else if (matchingTxns.length > 0) {
                        result.push({ ...group, transactions: matchingTxns });
                    }
                } else if (txns.length > 0) {
                    result.push({ ...group, transactions: txns });
                }
            } else {
                let txns = group.transactions as ApiExportTransaction[];
                if (statusFilter !== 'all') {
                    txns = txns.filter(
                        (t) => (t.status ?? '').toLowerCase() === statusFilter.toLowerCase()
                    );
                }
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchesVessel = group.vesselName.toLowerCase().includes(q);
                    const matchingTxns = txns.filter((t) => {
                        const ref = t.bl_no;
                        const clientName = t.shipper?.name;
                        return (
                            (ref && ref.toLowerCase().includes(q)) ||
                            (clientName && clientName.toLowerCase().includes(q))
                        );
                    });
                    if (matchesVessel && txns.length > 0) {
                        result.push({ ...group, transactions: txns });
                    } else if (matchingTxns.length > 0) {
                        result.push({ ...group, transactions: matchingTxns });
                    }
                } else if (txns.length > 0) {
                    result.push({ ...group, transactions: txns });
                }
            }
        }
        return result;
    }, [groups, searchQuery, statusFilter]);

    const totalVessels = filteredGroups.length;
    const totalPages = Math.max(1, Math.ceil(totalVessels / perPage));
    const paginatedGroups = filteredGroups.slice(
        (page - 1) * perPage,
        page * perPage
    );
    const startItem = totalVessels === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, totalVessels);

    const allExpanded =
        paginatedGroups.length > 0 &&
        paginatedGroups.every((g) => expandedGroups.has(g.vesselKey));

    const toggleGroup = (key: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleAll = () => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            for (const g of paginatedGroups) {
                if (allExpanded) {
                    next.add(g.vesselKey); // collapse all
                } else {
                    next.delete(g.vesselKey); // expand all
                }
            }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className="skeleton-shimmer flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-5 animate-pulse"
                    >
                        <div className="space-y-2">
                            <div className="h-5 w-44 rounded bg-muted" />
                            <div className="h-3 w-28 rounded bg-muted/60" />
                        </div>
                        <div className="h-7 w-20 rounded bg-muted" />
                    </div>
                ))}
            </div>
        );
    }

    if (filteredGroups.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <EmptyState label={emptyLabel} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Action Bar / Toggle Header */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {totalVessels} {totalVessels === 1 ? 'vessel group' : 'vessel groups'} · Expanded view · Active transactions
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAll}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                    {allExpanded ? (
                        <>
                            <span>Collapse all</span>
                            <ChevronUp className="size-3.5" />
                        </>
                    ) : (
                        <>
                            <span>Expand all</span>
                            <ChevronDown className="size-3.5" />
                        </>
                    )}
                </Button>
            </div>

            {/* Vessel Groups */}
            <div className="space-y-3.5">
                {paginatedGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.vesselKey);

                    return (
                        <div
                            key={group.vesselKey}
                            className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs transition-all hover:border-border"
                        >
                            {/* Vessel Accordion Header */}
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.vesselKey)}
                                className="flex w-full items-center justify-between p-3.5 sm:p-4 bg-muted/30 hover:bg-muted/50 text-left transition-colors border-b border-border/60 gap-3 cursor-pointer"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground">
                                        <Ship className="size-4 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-sm text-foreground truncate">
                                                {group.vesselName}
                                            </span>
                                            {group.voyage && (
                                                <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-md border border-border/80 bg-card text-muted-foreground">
                                                    Voy. {group.voyage}
                                                </span>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    group.type === 'import'
                                                        ? 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                }`}
                                            >
                                                {group.type}
                                            </Badge>
                                            {group.isDelayed && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider"
                                                >
                                                    Late
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            <span className="font-semibold text-foreground/80">
                                                {group.type === 'import' ? 'ETA' : 'ETD'}:
                                            </span>{' '}
                                            {formatDateLabel(group.eta)} ·{' '}
                                            <span className="font-semibold text-foreground">
                                                {group.stats.total}
                                            </span>{' '}
                                            shipments
                                            {group.stats.blocked > 0 && (
                                                <span className="text-destructive font-semibold ml-2">
                                                    ({group.stats.blocked} need review)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="secondary" className="text-xs font-semibold">
                                        {group.transactions.length} total
                                    </Badge>
                                    <span className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
                                        {isExpanded ? (
                                            <ChevronUp className="size-4" />
                                        ) : (
                                            <ChevronDown className="size-4" />
                                        )}
                                    </span>
                                </div>
                            </button>

                            {/* Transactions Table */}
                            {isExpanded && (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b">
                                            <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[180px]">
                                                {group.type === 'import' ? 'Customs Ref' : 'Bill of Lading'}
                                            </TableHead>
                                            <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {group.type === 'import' ? 'Importer' : 'Shipper'}
                                            </TableHead>
                                            <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[135px]">
                                                Status
                                            </TableHead>
                                            <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[135px]">
                                                {group.type === 'import' ? 'Origin' : 'Destination'}
                                            </TableHead>
                                            <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[135px]">
                                                {group.type === 'import' ? 'Arrival' : 'Departure'}
                                            </TableHead>
                                            <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[65px] text-end">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.transactions.map((transaction) => {
                                            const isImport = group.type === 'import';
                                            const refNo = isImport
                                                ? (transaction as ApiImportTransaction).customs_ref_no
                                                : (transaction as ApiExportTransaction).bl_no ||
                                                  `EXP-${String(transaction.id).padStart(4, '0')}`;
                                            const blNo =
                                                (transaction as ApiImportTransaction).bl_no ||
                                                (transaction as ApiExportTransaction).bl_no ||
                                                '—';
                                            const clientName = isImport
                                                ? (transaction as ApiImportTransaction).importer?.name
                                                : (transaction as ApiExportTransaction).shipper?.name;
                                            const destination = isImport
                                                ? (transaction as ApiImportTransaction).origin_country?.name ||
                                                  (transaction as ApiImportTransaction).location_of_goods?.name ||
                                                  '—'
                                                : (transaction as ApiExportTransaction).destination_country
                                                      ?.name || '—';
                                            const dateLabel = isImport
                                                ? formatDateLabel(
                                                      (transaction as ApiImportTransaction).arrival_date
                                                  )
                                                : formatDateLabel(
                                                      (transaction as ApiExportTransaction).export_date
                                                  );

                                            return (
                                                <TableRow
                                                    key={transaction.id}
                                                    onClick={() =>
                                                        navigate(
                                                            appRoutes.trackingDetail.replace(
                                                                ':referenceId',
                                                                encodeURIComponent(refNo)
                                                            )
                                                        )
                                                    }
                                                    className="group cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40"
                                                >
                                                    {/* 1. CUSTOMS REF (Import) / BILL OF LADING (Export) */}
                                                    <TableCell className="py-2.5">
                                                        {isImport ? (
                                                            <>
                                                                <span
                                                                    className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate block max-w-[180px]"
                                                                    title={(transaction as ApiImportTransaction).customs_ref_no}
                                                                >
                                                                    {(transaction as ApiImportTransaction).customs_ref_no}
                                                                </span>
                                                                {(transaction as ApiImportTransaction).bl_no ? (
                                                                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate max-w-[180px]" title={(transaction as ApiImportTransaction).bl_no}>
                                                                        BL: {(transaction as ApiImportTransaction).bl_no}
                                                                    </p>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            <span
                                                                className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate block max-w-[180px]"
                                                                title={blNo}
                                                            >
                                                                {blNo}
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* 3. SHIPPER / IMPORTER */}
                                                    <TableCell className="py-2.5">
                                                        <span
                                                            className="text-xs font-medium text-foreground truncate block max-w-[240px]"
                                                            title={toTitleCase(clientName)}
                                                        >
                                                            {toTitleCase(clientName)}
                                                        </span>
                                                    </TableCell>

                                                    {/* 4. STATUS */}
                                                    <TableCell className="py-2.5">
                                                        <StatusBadge status={transaction.status ?? ''} />
                                                    </TableCell>

                                                    {/* 5. DESTINATION */}
                                                    <TableCell className="py-2.5">
                                                        <span className="text-xs text-muted-foreground truncate block max-w-[125px]">
                                                            {toTitleCase(destination)}
                                                        </span>
                                                    </TableCell>

                                                    {/* 6. DEPARTURE / ARRIVAL */}
                                                    <TableCell className="py-2.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                                        {dateLabel}
                                                    </TableCell>

                                                    {/* 7. ACTIONS */}
                                                    <TableCell
                                                        className="py-2.5 text-end"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            onClick={() =>
                                                                navigate(
                                                                    appRoutes.trackingDetail.replace(
                                                                        ':referenceId',
                                                                        encodeURIComponent(refNo)
                                                                    )
                                                                )
                                                            }
                                                            title="View details"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalVessels > 0 && (
                <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-card shadow-xs">
                    <span className="text-xs font-medium text-muted-foreground">
                        Showing <strong className="font-semibold text-foreground">{startItem}–{endItem}</strong> of{' '}
                        <strong className="font-semibold text-foreground">{totalVessels}</strong> {typeLabel.toLowerCase()}
                    </span>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Vessels per page</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(value) => {
                                    setPerPage(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[76px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="top" className="min-w-[76px]">
                                    {PER_PAGE_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={String(option)} className="text-xs">
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="First page"
                                onClick={() => setPage(1)}
                                disabled={page <= 1}
                                className="size-8"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Previous page"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="size-8"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>
                            <span className="px-2 text-xs font-medium text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Next page"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="size-8"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Last page"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                                className="size-8"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export const TrackingDashboard = () => {
    const { data: importsData, isLoading: importsLoading } = useAllImportsData(LIVE_PARAMS);
    const { data: exportsData, isLoading: exportsLoading } = useAllExportsData(LIVE_PARAMS);

    const rawImports = useMemo(() => (importsData as ApiImportTransaction[] | undefined) ?? [], [importsData]);
    const rawExports = useMemo(() => (exportsData as ApiExportTransaction[] | undefined) ?? [], [exportsData]);

    const importGroups = useImportVesselGroups(rawImports);
    const exportGroups = useExportVesselGroups(rawExports);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const importsWithAttention = rawImports.filter((t) => t.open_remarks_count > 0).length;
    const exportsWithAttention = rawExports.filter((t) => t.open_remarks_count > 0).length;
    const totalVessels = importGroups.length + exportGroups.length;
    const totalAttention = importsWithAttention + exportsWithAttention;

    // All combined groups
    const allGroups = useMemo(() => {
        return [...importGroups, ...exportGroups].sort((a, b) => {
            if (!a.eta) return 1;
            if (!b.eta) return -1;
            return new Date(a.eta).getTime() - new Date(b.eta).getTime();
        });
    }, [importGroups, exportGroups]);

    const attentionGroups = useMemo(() => {
        return allGroups.filter((g) => g.stats.blocked > 0);
    }, [allGroups]);

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Tracking Overview
                </h1>
                <p className="text-sm text-muted-foreground">
                    Your assigned active transactions grouped by voyage and vessel schedule.
                </p>
            </div>

            {/* Section 1: KPI Metrics Row */}
            <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Active Imports</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1">
                                <Truck className="size-3 text-info" /> In Transit
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {rawImports.length}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            Assigned import shipments
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Active Exports</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1">
                                <Flag className="size-3 text-success" /> Outbound
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {rawExports.length}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            Assigned export shipments
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Vessels Tracked</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1">
                                <Ship className="size-3 text-primary" /> Active
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {totalVessels}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {importGroups.length} import · {exportGroups.length} export
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Needs Attention</span>
                            <Badge
                                variant={totalAttention > 0 ? 'destructive' : 'outline'}
                                className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1"
                            >
                                <AlertCircle className="size-3" /> Blockers
                            </Badge>
                        </div>
                        <div
                            className={`text-xl sm:text-2xl font-bold tabular-nums ${
                                totalAttention > 0 ? 'text-destructive' : 'text-foreground'
                            }`}
                        >
                            {totalAttention}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {totalAttention === 0 ? 'No blockers reported' : 'Shipments with open remarks'}
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Section 2: Tabbed Tracking Workspace with Toolbar */}
            <Tabs defaultValue="all" className="w-full space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <TabsList className="h-9 p-1 bg-muted/60">
                        <TabsTrigger value="all" className="gap-2 px-3 text-xs">
                            <span>All Vessels</span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold">
                                {totalVessels}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="imports" className="gap-1.5 px-3 text-xs">
                            <Truck className="size-3.5" />
                            <span>Imports</span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold">
                                {importGroups.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="exports" className="gap-1.5 px-3 text-xs">
                            <Flag className="size-3.5" />
                            <span>Exports</span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold">
                                {exportGroups.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="attention" className="gap-1.5 px-3 text-xs">
                            <AlertCircle className="size-3.5 text-destructive" />
                            <span>Attention</span>
                            {totalAttention > 0 && (
                                <Badge variant="destructive" className="px-1.5 py-0 text-[10px] font-semibold">
                                    {totalAttention}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Search and Filters */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="relative flex-1 sm:w-64 sm:flex-initial">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter vessel, BL, ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-9 text-xs"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9 w-36 text-xs">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Processing">Processing</SelectItem>
                                <SelectItem value="In Transit">In Transit</SelectItem>
                                <SelectItem value="Vessel Arrived">Vessel Arrived</SelectItem>
                                <SelectItem value="Cleared">Cleared</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tab: All Vessels */}
                <TabsContent value="all" className="mt-0">
                    <VesselListView
                        groups={allGroups}
                        isLoading={importsLoading || exportsLoading}
                        typeLabel="Vessels"
                        emptyLabel="vessels"
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                    />
                </TabsContent>

                {/* Tab: Imports */}
                <TabsContent value="imports" className="mt-0">
                    <VesselListView
                        groups={importGroups}
                        isLoading={importsLoading}
                        typeLabel="Imports"
                        emptyLabel="imports"
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                    />
                </TabsContent>

                {/* Tab: Exports */}
                <TabsContent value="exports" className="mt-0">
                    <VesselListView
                        groups={exportGroups}
                        isLoading={exportsLoading}
                        typeLabel="Exports"
                        emptyLabel="exports"
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                    />
                </TabsContent>

                {/* Tab: Attention */}
                <TabsContent value="attention" className="mt-0">
                    <VesselListView
                        groups={attentionGroups}
                        isLoading={importsLoading || exportsLoading}
                        typeLabel="Flagged Vessels"
                        emptyLabel="flagged transactions"
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

