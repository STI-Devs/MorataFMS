import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { EmptyState } from '../../../../components/EmptyState';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import { useExports } from '../../hooks/useExports';
import { useExportVesselGroups } from '../../hooks/useVesselGrouping';
import type { ApiExportTransaction, VesselGroup } from '../../types';
import { RemarkViewerModal } from '../modals/RemarkViewerModal';
import { VesselGroupHeader } from './VesselGroupHeader';
import type { VesselListFilters } from './VesselListToolbar';
import { ExportTransactionRow } from '../lists/ExportTransactionRow';

interface Props {
    filters: VesselListFilters;
    onCancel: (id: number, ref: string) => void;
}

const ACTIVE_STATUSES = new Set(['Processing', 'In Progress', 'in_progress', 'In Transit', 'Departure', 'Pending']);
const COMPLETED_STATUSES = new Set(['Completed', 'completed', 'Shipped']);

function isThisWeek(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d >= startOfWeek && d < endOfWeek;
}

function isToday(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

function matchesSearch(t: ApiExportTransaction, search: string): boolean {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
        (t.vessel ?? '').toLowerCase().includes(q) ||
        (t.bl_no ?? '').toLowerCase().includes(q) ||
        (t.shipper?.name ?? '').toLowerCase().includes(q)
    );
}

function filterTransactions(
    transactions: ApiExportTransaction[],
    filters: VesselListFilters,
): ApiExportTransaction[] {
    return transactions.filter(t => {
        if (!matchesSearch(t, filters.search)) return false;
        if (filters.status === 'active' && !ACTIVE_STATUSES.has(t.status ?? '')) return false;
        if (filters.status === 'blocked' && t.open_remarks_count === 0) return false;
        if (filters.status === 'completed' && !COMPLETED_STATUSES.has(t.status ?? '')) return false;
        return true;
    });
}

function filterGroups(
    groups: VesselGroup<ApiExportTransaction>[],
    filters: VesselListFilters,
): VesselGroup<ApiExportTransaction>[] {
    return groups
        .map(g => ({ ...g, transactions: filterTransactions(g.transactions, filters) }))
        .filter(g => {
            if (g.transactions.length === 0) return false;
            if (filters.time === 'today' && !isToday(g.eta)) return false;
            if (filters.time === 'week' && !isThisWeek(g.eta)) return false;
            if (filters.time === 'delayed' && !g.isDelayed) return false;
            return true;
        });
}

const COL_HEADERS = [
    { label: 'BL No.', className: '' },
    { label: 'Vessel', className: '' },
    { label: 'Shipper', className: '' },
    { label: 'Current Stage', className: '' },
    { label: 'Status', className: '' },
    { label: 'Updated', className: 'text-left' },
    { label: 'Actions', className: 'text-end' },
];

export function VesselGroupedExportList({ filters, onCancel }: Props) {
    const navigate = useNavigate();
    
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const setPage = (nextPage: number) => {
        setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('page', String(nextPage)); return next; });
    };

    const setPerPage = (nextPerPage: number) => {
        setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('per_page', String(nextPerPage)); next.set('page', '1'); return next; });
    };

    const params = useMemo(() => {
        let statusFilter: string | undefined;
        let excludeStatuses: string | undefined = 'completed,cancelled';
        
        if (filters.status === 'completed') {
             statusFilter = 'completed';
             excludeStatuses = undefined;
        }

        return {
            page,
            per_page: perPage,
            search: filters.search || undefined,
            status: statusFilter,
            exclude_statuses: excludeStatuses,
        };
    }, [page, perPage, filters]);

    const { data: response, isLoading } = useExports(params);
    const allExports = useMemo(() => response?.data ?? [], [response]);

    const groups = useExportVesselGroups(allExports);
    const filteredGroups = useMemo(() => filterGroups(groups, filters), [groups, filters]);

    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [remarkTarget, setRemarkTarget] = useState<ApiExportTransaction | null>(null);

    const totalVessels = filteredGroups.length;
    const totalPages = response?.meta?.last_page ?? 1;
    const allExpanded = filteredGroups.length > 0 && filteredGroups.every(g => !collapsedGroups.has(g.vesselKey));

    const toggleGroup = (key: string) => {
        setCollapsedGroups(prev => {
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
        if (allExpanded) {
            setCollapsedGroups(new Set(filteredGroups.map(g => g.vesselKey)));
        } else {
            setCollapsedGroups(new Set());
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3.5">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-shimmer flex items-center justify-between rounded-xl border border-border bg-card p-5 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg skeleton-shimmer" />
                            <div className="space-y-1.5">
                                <div className="h-4 w-48 skeleton-shimmer rounded" />
                                <div className="h-3 w-28 skeleton-shimmer rounded" />
                            </div>
                        </div>
                        <div className="h-6 w-20 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (filteredGroups.length === 0) {
        return (
            <Card>
                <EmptyState
                    label="vessel groups"
                    message="No vessel groups match your current filter settings."
                />
            </Card>
        );
    }

    const totalRecords = response?.meta?.total ?? allExports.length;
    const startItem = totalRecords === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, totalRecords);

    return (
        <div className="space-y-4">
            {/* Action Bar / Toggle Header */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {totalVessels} {totalVessels === 1 ? 'vessel group' : 'vessel groups'} · Active shipments
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAll}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
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

            {/* Individual Vessel Cards */}
            <div className="space-y-3.5">
                {filteredGroups.map(group => {
                    const isExpanded = !collapsedGroups.has(group.vesselKey);
                    return (
                        <div
                            key={group.vesselKey}
                            className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs transition-all hover:border-border"
                        >
                            <VesselGroupHeader
                                group={group}
                                isExpanded={isExpanded}
                                onToggle={() => toggleGroup(group.vesselKey)}
                            />

                            {isExpanded && (
                                <div
                                    className="bg-card px-0 pb-0 pt-0"
                                    data-testid="tracking-vessel-group-panel"
                                >
                                    <div
                                        className="border-l-2 border-slate-300 dark:border-border/55"
                                        data-testid="tracking-vessel-group-guide"
                                    >
                                        <div className="overflow-hidden bg-card">
                                            <div
                                                className="hidden border-b border-border/80 bg-muted/40 px-4 py-2 lg:grid lg:grid-cols-[1.3fr_1.2fr_1.4fr_1.3fr_100px_90px_90px] lg:gap-x-3"
                                            >
                                                {COL_HEADERS.map(h => (
                                                    <span key={h.label} className={`text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${h.className}`}>
                                                        {h.label}
                                                    </span>
                                                ))}
                                            </div>
                                            {group.transactions.map(t => (
                                                <ExportTransactionRow
                                                    key={t.id}
                                                    transaction={t}
                                                    onNavigate={navigate}
                                                    onCancel={onCancel}
                                                    onRemarks={setRemarkTarget}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {remarkTarget && (
                <RemarkViewerModal
                    isOpen
                    onClose={() => setRemarkTarget(null)}
                    transactionType="export"
                    transactionId={remarkTarget.id}
                    transactionLabel={`Export — ${remarkTarget.bl_no || `EXP-${String(remarkTarget.id).padStart(4, '0')}`}`}
                />
            )}

            {/* Pagination Controls */}
            {totalRecords > 0 && (
                <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-card shadow-xs">
                    <span className="text-xs font-medium text-muted-foreground">
                        Showing <strong className="font-semibold text-foreground">{startItem}–{endItem}</strong> of{' '}
                        <strong className="font-semibold text-foreground">{totalRecords}</strong> transactions
                    </span>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Rows per page</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(value) => {
                                    setPerPage(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[76px] text-xs bg-background">
                                    <SelectValue placeholder={String(perPage)} />
                                </SelectTrigger>
                                <SelectContent side="top" className="min-w-[76px]">
                                    {[15, 20, 50].map((option) => (
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
                                onClick={() => setPage(Math.max(1, page - 1))}
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
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
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
