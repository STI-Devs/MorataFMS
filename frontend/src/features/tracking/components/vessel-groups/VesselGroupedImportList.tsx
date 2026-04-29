import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as React from 'react';
import { Icon } from '../../../../components/Icon';
import { Pagination } from '../../../../components/Pagination';
import { useImports } from '../../hooks/useImports';
import { useImportVesselGroups } from '../../hooks/useVesselGrouping';
import type { ApiImportTransaction, VesselGroup } from '../../types';
import { RemarkViewerModal } from '../modals/RemarkViewerModal';
import { VesselGroupHeader } from './VesselGroupHeader';
import type { VesselListFilters } from './VesselListToolbar';
import { ImportTransactionRow } from '../lists/ImportTransactionRow';

interface Props {
    filters: VesselListFilters;
    onCancel: (id: number, ref: string) => void;
}

const ACTIVE_STATUSES = new Set(['Processing', 'In Progress', 'in_progress', 'Vessel Arrived', 'Pending']);
const COMPLETED_STATUSES = new Set(['Completed', 'completed', 'Cleared']);

function isToday(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

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

function matchesSearch(t: ApiImportTransaction, search: string): boolean {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
        (t.vessel_name ?? '').toLowerCase().includes(q) ||
        (t.customs_ref_no ?? '').toLowerCase().includes(q) ||
        (t.bl_no ?? '').toLowerCase().includes(q) ||
        (t.importer?.name ?? '').toLowerCase().includes(q)
    );
}

function filterTransactions(
    transactions: ApiImportTransaction[],
    filters: VesselListFilters,
): ApiImportTransaction[] {
    return transactions.filter(t => {
        if (!matchesSearch(t, filters.search)) return false;

        if (filters.status === 'active' && !ACTIVE_STATUSES.has(t.status ?? '')) return false;
        if (filters.status === 'blocked' && t.open_remarks_count === 0) return false;
        if (filters.status === 'completed' && !COMPLETED_STATUSES.has(t.status ?? '')) return false;

        return true;
    });
}

function filterGroups(
    groups: VesselGroup<ApiImportTransaction>[],
    filters: VesselListFilters,
): VesselGroup<ApiImportTransaction>[] {
    const filtered = groups
        .map(g => ({
            ...g,
            transactions: filterTransactions(g.transactions, filters),
        }))
        .filter(g => {
            if (g.transactions.length === 0) return false;

            if (filters.time === 'today' && !isToday(g.eta)) {
                const groupMatchesSearch = filters.search
                    ? (g.vesselName.toLowerCase().includes(filters.search.toLowerCase()))
                    : true;
                return groupMatchesSearch && isToday(g.eta);
            }
            if (filters.time === 'week' && !isThisWeek(g.eta)) return false;
            if (filters.time === 'delayed' && !g.isDelayed) return false;

            return true;
        });

    return filtered;
}

const COL_HEADERS = [
    { label: 'Customs Ref No.', className: '' },
    { label: 'Bill of Lading', className: '' },
    { label: 'Importer', className: '' },
    { label: 'Current Stage', className: '' },
    { label: 'Status', className: '' },
    { label: 'Assignee', className: 'text-center' },
    { label: 'Updated', className: 'text-left' },
    { label: '', className: '' },
];

export function VesselGroupedImportList({ filters, onCancel }: Props) {
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

    const { data: response, isLoading } = useImports(params);
    const allImports = useMemo(() => response?.data ?? [], [response]);

    const groups = useImportVesselGroups(allImports);
    const filteredGroups = useMemo(() => filterGroups(groups, filters), [groups, filters]);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(groups.map(g => g.vesselKey)));
    const seenGroupsRef = React.useRef<Set<string>>(new Set(groups.map(g => g.vesselKey)));

    // Auto-expand groups when they load but don't uncollapse user closed groups
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

    const [remarkTarget, setRemarkTarget] = useState<ApiImportTransaction | null>(null);

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
                                    <div className="hidden border-b border-border bg-surface-secondary/35 px-4 py-2.5 lg:grid lg:grid-cols-[1.45fr_1.05fr_1.2fr_1.45fr_100px_80px_92px_56px] lg:gap-x-3">
                                        {COL_HEADERS.map(h => (
                                            <span key={h.label} className={`text-[9px] font-bold text-text-muted uppercase tracking-[0.1em] ${h.className}`}>
                                                {h.label}
                                            </span>
                                        ))}
                                    </div>
                                    {group.transactions.map(t => (
                                        <ImportTransactionRow
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
                    transactionType="import"
                    transactionId={remarkTarget.id}
                    transactionLabel={`Import — ${remarkTarget.customs_ref_no}`}
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
