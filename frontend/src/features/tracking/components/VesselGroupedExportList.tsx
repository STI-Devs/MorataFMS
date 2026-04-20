import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as React from 'react';
import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { useExports } from '../hooks/useExports';
import { useExportVesselGroups } from '../hooks/useVesselGrouping';
import type { ApiExportTransaction, VesselGroup } from '../types';
import { RemarkViewerModal } from './RemarkViewerModal';
import { VesselGroupHeader } from './VesselGroupHeader';
import type { VesselListFilters } from './VesselListToolbar';
import { ExportTransactionRow } from './ExportTransactionRow';

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
    { label: 'Shipper', className: '' },
    { label: 'Current Stage', className: '' },
    { label: 'Status', className: '' },
    { label: 'Docs', className: 'text-center' },
    { label: 'Assignee', className: 'text-center' },
    { label: 'Updated', className: 'text-right' },
    { label: '', className: '' },
];

export function VesselGroupedExportList({ filters, onCancel }: Props) {
    const navigate = useNavigate();
    
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '15');

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

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(groups.map(g => g.vesselKey)));
    const seenGroupsRef = React.useRef<Set<string>>(new Set(groups.map(g => g.vesselKey)));

    useEffect(() => {
        setExpandedGroups(prev => {
            let hasNew = false;
            const next = new Set(prev);
            for (const g of groups) {
                if (!seenGroupsRef.current.has(g.vesselKey)) {
                    seenGroupsRef.current.add(g.vesselKey);
                    next.add(g.vesselKey);
                    hasNew = true;
                }
            }
            return hasNew ? next : prev;
        });
    }, [groups]);

    const [remarkTarget, setRemarkTarget] = useState<ApiExportTransaction | null>(null);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) { next.delete(key); } else { next.add(key); }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-3 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm">
                        <div className="w-3.5 h-3.5 skeleton-shimmer rounded" />
                        <div className="h-4 w-48 skeleton-shimmer rounded" />
                        <div className="ml-auto h-4 w-24 skeleton-shimmer rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (filteredGroups.length === 0) {
        return (
            <div className="p-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-secondary/20 px-6 py-20 text-text-muted">
                    <Icon name="search" className="w-8 h-8 opacity-30" />
                    <p className="text-sm font-semibold">No vessel groups match the current filters</p>
                    <p className="text-xs">Try adjusting your search or filter settings</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3 p-3">
                {filteredGroups.map(group => (
                <div key={group.vesselKey} className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
                    <VesselGroupHeader
                        group={group}
                        isExpanded={expandedGroups.has(group.vesselKey)}
                        onToggle={() => toggleGroup(group.vesselKey)}
                    />

                    {expandedGroups.has(group.vesselKey) && (
                        <div
                            className="bg-surface-secondary/10 px-0 pb-1.5 pt-0.5 dark:bg-transparent sm:pb-2"
                            data-testid="tracking-vessel-group-panel"
                        >
                            <div
                                className="ml-6 border-l-2 border-slate-300 pl-2.5 dark:border-border/55 sm:ml-7 sm:pl-3"
                                data-testid="tracking-vessel-group-guide"
                            >
                                <div className="overflow-hidden rounded-lg bg-surface-secondary/15 dark:bg-surface/60">
                                    <div
                                        className="hidden border-b border-border bg-surface-secondary/35 px-4 py-2.5 lg:grid lg:gap-x-3"
                                        style={{ gridTemplateColumns: '1.2fr 1.2fr 1.4fr 100px 60px 80px 70px 48px' }}
                                    >
                                        {COL_HEADERS.map(h => (
                                            <span key={h.label} className={`text-[9px] font-bold text-text-muted uppercase tracking-[0.1em] ${h.className}`}>
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
            ))}
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

            <div className="border-t border-border bg-surface-secondary/20 px-4 py-3">
                <Pagination
                    currentPage={response?.meta?.current_page ?? 1}
                    totalPages={response?.meta?.last_page ?? 1}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={setPerPage}
                />
            </div>
        </>
    );
}
