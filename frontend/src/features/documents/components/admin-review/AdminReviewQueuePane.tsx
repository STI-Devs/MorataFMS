import { useEffect, useMemo, useRef, useState } from 'react';

import { Icon } from '../../../../components/Icon';
import type { EncoderUser } from '../../../oversight/types/transaction.types';
import { Pagination } from '../../../../components/Pagination';
import { VesselGroupHeader } from '../../../tracking/components/VesselGroupHeader';
import type { VesselGroup } from '../../../tracking/types/tracking.types';
import type {
    AdminReviewQueueItem,
    AdminReviewReadinessFilter,
    AdminReviewQueueResponse,
    AdminReviewStatusFilter,
    AdminReviewStats,
    AdminReviewTypeFilter,
} from '../../types/document.types';
import { QueueSkeleton } from './AdminReviewShared';
import {
    matchesSelection,
    reviewKey,
    timeAgo,
    type ReviewSelection,
} from './adminReview.utils';

function buildReviewGroups(transactions: AdminReviewQueueItem[]): VesselGroup<AdminReviewQueueItem>[] {
    const grouped = new Map<string, AdminReviewQueueItem[]>();

    for (const transaction of transactions) {
        const vesselName = transaction.vessel?.trim() || 'Unknown Vessel';
        const key = `${transaction.type}:${vesselName}`;
        const existing = grouped.get(key);

        if (existing) {
            existing.push(transaction);
        } else {
            grouped.set(key, [transaction]);
        }
    }

    const groups: VesselGroup<AdminReviewQueueItem>[] = [];

    for (const [groupKey, vesselTransactions] of grouped.entries()) {
        const firstTransaction = vesselTransactions[0];
        const blockedCount = vesselTransactions.filter((transaction) => transaction.has_exceptions).length;
        const readyCount = vesselTransactions.filter((transaction) => transaction.archive_ready).length;

        groups.push({
            vesselKey: groupKey,
            vesselName: firstTransaction?.vessel?.trim() || 'Unknown Vessel',
            voyage: null,
            eta: firstTransaction?.transaction_date ?? null,
            type: firstTransaction?.type ?? 'import',
            transactions: vesselTransactions,
            stats: {
                total: vesselTransactions.length,
                in_progress: vesselTransactions.length - readyCount,
                blocked: blockedCount,
                completed: readyCount,
            },
            isDelayed: false,
        });
    }

    return groups.sort((left, right) => {
        const leftDate = left.eta ? new Date(left.eta).getTime() : Number.POSITIVE_INFINITY;
        const rightDate = right.eta ? new Date(right.eta).getTime() : Number.POSITIVE_INFINITY;

        if (leftDate !== rightDate) {
            return leftDate - rightDate;
        }

        return left.vesselName.localeCompare(right.vesselName);
    });
}

// ---------------------------------------------------------------------------
// QueueItem
// ---------------------------------------------------------------------------

const QueueItem = ({
    transaction,
    isSelected,
    onSelect,
}: {
    transaction: AdminReviewQueueItem;
    isSelected: boolean;
    onSelect: (transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>) => void;
}) => {
    return (
        <button
            onClick={() => onSelect(transaction)}
            className={`w-full border-b border-border/80 dark:border-border/60 text-left transition-all ${
                isSelected
                    ? 'border-l-[3px] border-l-blue-500 bg-blue-500/[0.08] dark:bg-blue-500/[0.07]'
                    : 'border-l-[3px] border-l-transparent hover:bg-surface-secondary/45 dark:hover:bg-surface-secondary/35'
            }`}
        >
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                    <span className={`font-mono text-sm font-bold tracking-tight leading-tight ${isSelected ? 'text-blue-500' : 'text-text-primary'}`}>
                        {transaction.bl_number ?? transaction.ref}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase font-mono tracking-widest text-text-muted">
                        {timeAgo(transaction.finalized_date)}
                    </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-text-muted">
                    <span className="font-medium text-text-secondary">{transaction.client ?? 'Unknown client'}</span>
                    {' · '}{transaction.ref}{transaction.assigned_user ? ` · ${transaction.assigned_user}` : ''}
                </p>

                {transaction.has_exceptions ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">
                                <Icon name="flag" className="h-2.5 w-2.5" />
                                Remarks
                            </span>
                        </div>
                    </div>
                ) : null}
            </div>
        </button>
    );
};

// ---------------------------------------------------------------------------
// PillGroup — a row of pill-style toggle buttons for a single filter dim
// ---------------------------------------------------------------------------

function PillGroup<T extends string | number>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{label}</p>
            <div className="flex flex-wrap gap-1">
                {options.map((option) => {
                    const isActive = option.value === value;
                    return (
                        <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                isActive
                                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                                    : 'border-border bg-background text-text-secondary hover:bg-hover hover:text-text-primary'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// FilterPopover
// ---------------------------------------------------------------------------

const FilterPopover = ({
    typeFilter,
    statusFilter,
    readinessFilter,
    assignedUserIdFilter,
    assignedUsers,
    onTypeFilterChange,
    onStatusFilterChange,
    onReadinessFilterChange,
    onAssignedUserFilterChange,
    onResetFilters,
    onClose,
}: {
    typeFilter: AdminReviewTypeFilter;
    statusFilter: AdminReviewStatusFilter;
    readinessFilter: AdminReviewReadinessFilter;
    assignedUserIdFilter: number | 'all';
    assignedUsers: EncoderUser[];
    onTypeFilterChange: (value: AdminReviewTypeFilter) => void;
    onStatusFilterChange: (value: AdminReviewStatusFilter) => void;
    onReadinessFilterChange: (value: AdminReviewReadinessFilter) => void;
    onAssignedUserFilterChange: (value: number | 'all') => void;
    onResetFilters: () => void;
    onClose: () => void;
}) => {
    const [encoderSearch, setEncoderSearch] = useState('');
    const encoderOptions = useMemo<{ label: string; value: number | 'all' }[]>(
        () => [
            { label: 'All', value: 'all' },
            ...assignedUsers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((user) => ({ label: user.name, value: user.id as number | 'all' })),
        ],
        [assignedUsers],
    );
    const filteredEncoderOptions = useMemo(() => {
        const query = encoderSearch.trim().toLowerCase();

        if (!query) {
            return encoderOptions;
        }

        return encoderOptions.filter((option) => option.label.toLowerCase().includes(query));
    }, [encoderOptions, encoderSearch]);

    return (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Refine Queue</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md p-0.5 text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                >
                    <Icon name="x" className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="space-y-4 px-4 py-3">
                <PillGroup<AdminReviewTypeFilter>
                    label="Type"
                    value={typeFilter}
                    onChange={onTypeFilterChange}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Import', value: 'import' },
                        { label: 'Export', value: 'export' },
                    ]}
                />
                <PillGroup<AdminReviewStatusFilter>
                    label="Status"
                    value={statusFilter}
                    onChange={onStatusFilterChange}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ]}
                />
                <PillGroup<AdminReviewReadinessFilter>
                    label="Readiness"
                    value={readinessFilter}
                    onChange={onReadinessFilterChange}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Ready', value: 'ready' },
                        { label: 'Missing Docs', value: 'missing_docs' },
                        { label: 'Flagged', value: 'flagged' },
                    ]}
                />
                {assignedUsers.length > 0 ? (
                    <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Encoder</p>
                            <span className="text-[10px] font-mono text-text-muted">{assignedUsers.length} total</span>
                        </div>
                        {assignedUsers.length > 6 ? (
                            <div className="relative mb-2">
                                <Icon name="search" className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    value={encoderSearch}
                                    onChange={(event) => setEncoderSearch(event.target.value)}
                                    placeholder="Search encoder..."
                                    className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        ) : null}
                        <div className="max-h-48 overflow-y-auto pr-1">
                            <div className="flex flex-wrap gap-1">
                                {filteredEncoderOptions.length > 0 ? (
                                    filteredEncoderOptions.map((option) => {
                                        const isActive = option.value === assignedUserIdFilter;

                                        return (
                                            <button
                                                key={String(option.value)}
                                                type="button"
                                                onClick={() => onAssignedUserFilterChange(option.value)}
                                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                                    isActive
                                                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                                                        : 'border-border bg-background text-text-secondary hover:bg-hover hover:text-text-primary'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="text-[11px] text-text-muted">No encoder matches the current search.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="border-t border-border px-4 py-2.5">
                <button
                    type="button"
                    onClick={() => {
                        onResetFilters();
                        onClose();
                    }}
                    className="text-[11px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
                >
                    Clear all filters
                </button>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// FilterChips — dismissible active-filter row
// ---------------------------------------------------------------------------

const FilterChips = ({
    typeFilter,
    statusFilter,
    readinessFilter,
    assignedUserIdFilter,
    assignedUsers,
    onTypeFilterChange,
    onStatusFilterChange,
    onReadinessFilterChange,
    onAssignedUserFilterChange,
    onResetAll,
}: {
    typeFilter: AdminReviewTypeFilter;
    statusFilter: AdminReviewStatusFilter;
    readinessFilter: AdminReviewReadinessFilter;
    assignedUserIdFilter: number | 'all';
    assignedUsers: EncoderUser[];
    onTypeFilterChange: (value: AdminReviewTypeFilter) => void;
    onStatusFilterChange: (value: AdminReviewStatusFilter) => void;
    onReadinessFilterChange: (value: AdminReviewReadinessFilter) => void;
    onAssignedUserFilterChange: (value: number | 'all') => void;
    onResetAll: () => void;
}) => {
    const READINESS_LABELS: Record<Exclude<AdminReviewReadinessFilter, 'all' | 'ready'>, string> = {
        missing_docs: 'Missing Docs',
        flagged: 'Flagged',
    };

    const chips: { key: string; label: string; value: string; onRemove: () => void }[] = [];

    if (typeFilter !== 'all') {
        chips.push({
            key: 'type',
            label: 'Type',
            value: typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1),
            onRemove: () => onTypeFilterChange('all'),
        });
    }
    if (statusFilter !== 'all') {
        chips.push({
            key: 'status',
            label: 'Status',
            value: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
            onRemove: () => onStatusFilterChange('all'),
        });
    }
    if (readinessFilter !== 'all' && readinessFilter !== 'ready') {
        chips.push({
            key: 'readiness',
            label: 'Readiness',
            value: READINESS_LABELS[readinessFilter],
            onRemove: () => onReadinessFilterChange('all'),
        });
    }
    if (assignedUserIdFilter !== 'all') {
        const userName = assignedUsers.find((u) => u.id === assignedUserIdFilter)?.name ?? 'Selected';
        chips.push({
            key: 'encoder',
            label: 'Encoder',
            value: userName,
            onRemove: () => onAssignedUserFilterChange('all'),
        });
    }

    if (chips.length === 0) return null;

    return (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface pl-2.5 pr-1.5 py-1 text-[11px] text-text-secondary"
                >
                    <span className="font-semibold text-text-primary">{chip.label}:</span>
                    {chip.value}
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        className="flex items-center rounded-full p-0.5 text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                        aria-label={`Remove ${chip.label} filter`}
                    >
                        <Icon name="x" className="h-2.5 w-2.5" />
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={onResetAll}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
            >
                <Icon name="x" className="h-3 w-3" />
                Clear
            </button>
        </div>
    );
};

// ---------------------------------------------------------------------------
// AdminReviewQueuePane
// ---------------------------------------------------------------------------

export const AdminReviewQueuePane = ({
    summary,
    isSummaryLoading,
    expanded,
    searchQuery,
    typeFilter,
    statusFilter,
    readinessFilter,
    assignedUserIdFilter,
    assignedUsers,
    debouncedSearch,
    selection,
    transactions,
    queueData,
    isLoading,
    isError,
    isFetching,
    onSearchChange,
    onTypeFilterChange,
    onStatusFilterChange,
    onReadinessFilterChange,
    onAssignedUserFilterChange,
    onRetry,
    onSelect,
    onPageChange,
    onPerPageChange,
    onResetFilters,
}: {
    summary: AdminReviewStats | undefined;
    isSummaryLoading: boolean;
    expanded: boolean;
    searchQuery: string;
    typeFilter: AdminReviewTypeFilter;
    statusFilter: AdminReviewStatusFilter;
    readinessFilter: AdminReviewReadinessFilter;
    assignedUserIdFilter: number | 'all';
    assignedUsers: EncoderUser[];
    debouncedSearch: string;
    selection: ReviewSelection | null;
    transactions: AdminReviewQueueItem[];
    queueData: AdminReviewQueueResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    onSearchChange: (value: string) => void;
    onTypeFilterChange: (value: AdminReviewTypeFilter) => void;
    onStatusFilterChange: (value: AdminReviewStatusFilter) => void;
    onReadinessFilterChange: (value: AdminReviewReadinessFilter) => void;
    onAssignedUserFilterChange: (value: number | 'all') => void;
    onRetry: () => void;
    onSelect: (transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>) => void;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onResetFilters: () => void;
}) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const groups = useMemo(() => buildReviewGroups(transactions), [transactions]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        () => new Set(groups.map((group) => group.vesselKey)),
    );
    const seenGroupsRef = useRef<Set<string>>(new Set(groups.map((group) => group.vesselKey)));

    // Close popover on outside click
    useEffect(() => {
        if (!popoverOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPopoverOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [popoverOpen]);

    useEffect(() => {
        setExpandedGroups((previous) => {
            let hasNewGroup = false;
            const next = new Set(previous);

            for (const group of groups) {
                if (!seenGroupsRef.current.has(group.vesselKey)) {
                    seenGroupsRef.current.add(group.vesselKey);
                    next.add(group.vesselKey);
                    hasNewGroup = true;
                }
            }

            for (const key of Array.from(next)) {
                if (!groups.some((group) => group.vesselKey === key)) {
                    next.delete(key);
                }
            }

            return hasNewGroup ? next : new Set(next);
        });
    }, [groups]);

    const summaryItems = [
        { label: 'Completed', value: summary?.completed_count ?? '—' },
        { label: 'Cancelled', value: summary?.cancelled_count ?? '—' },
        { label: 'Missing Docs', value: summary?.missing_docs_count ?? '—' },
    ];

    const hasActiveFilters =
        typeFilter !== 'all' ||
        statusFilter !== 'all' ||
        readinessFilter !== 'all' ||
        assignedUserIdFilter !== 'all';

    const activeFilterCount = [
        typeFilter !== 'all',
        statusFilter !== 'all',
        readinessFilter !== 'all',
        assignedUserIdFilter !== 'all',
    ].filter(Boolean).length;

    const handleResetFilters = () => {
        setPopoverOpen(false);
        onResetFilters();
    };
    const toggleGroup = (key: string) => {
        setExpandedGroups((previous) => {
            const next = new Set(previous);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    };
    const meta = queueData?.meta;
    const hasTransactions = transactions.length > 0;
    const rangeStart = meta && hasTransactions ? (meta.current_page - 1) * meta.per_page + 1 : 0;
    const rangeEnd = meta && hasTransactions ? rangeStart + transactions.length - 1 : 0;

    return (
        <div
            className={`flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm ${
                expanded ? 'max-w-none' : 'xl:min-w-[26rem] xl:max-w-[38rem] 2xl:min-w-[30rem] 2xl:max-w-[42rem]'
            }`}
            data-testid="admin-review-queue-pane"
        >
            {/* Header */}
            <div className="flex-none border-b border-border bg-gradient-to-b from-surface-secondary/45 to-surface px-4 py-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Completed Transaction Queue</p>
                        <h2 className="mt-1 text-sm font-semibold text-text-primary">Review queue</h2>
                    </div>
                    {queueData?.meta ? (
                        <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold text-text-muted">
                            {queueData.meta.total} total
                        </span>
                    ) : null}
                </div>

                {/* KPI strip */}
                <div className="mb-3 flex flex-wrap items-center gap-2" data-testid="admin-review-kpi-strip">
                    {summaryItems.map((item) => (
                        <span
                            key={item.label}
                            className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-text-muted"
                        >
                            <span className="font-semibold text-text-primary">
                                {isSummaryLoading ? '—' : item.value}
                            </span>{' '}
                            {item.label}
                        </span>
                    ))}
                </div>

                {/* Search + Filters trigger */}
                <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Icon name="search" className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search vessel, BL, ref, or client..."
                            value={searchQuery}
                            onChange={(event) => onSearchChange(event.target.value)}
                            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filters button + popover */}
                    <div className="relative flex-none" ref={popoverRef}>
                        <button
                            type="button"
                            onClick={() => setPopoverOpen((prev) => !prev)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                                popoverOpen || hasActiveFilters
                                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                                    : 'border-border bg-background text-text-secondary hover:bg-hover hover:text-text-primary'
                            }`}
                        >
                            <Icon name="filter" className="h-3.5 w-3.5" />
                            Filters
                            {hasActiveFilters ? (
                                <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                                    {activeFilterCount}
                                </span>
                            ) : null}
                        </button>

                        {popoverOpen ? (
                            <FilterPopover
                                typeFilter={typeFilter}
                                statusFilter={statusFilter}
                                readinessFilter={readinessFilter}
                                assignedUserIdFilter={assignedUserIdFilter}
                                assignedUsers={assignedUsers}
                                onTypeFilterChange={onTypeFilterChange}
                                onStatusFilterChange={onStatusFilterChange}
                                onReadinessFilterChange={onReadinessFilterChange}
                                onAssignedUserFilterChange={onAssignedUserFilterChange}
                                onResetFilters={handleResetFilters}
                                onClose={() => setPopoverOpen(false)}
                            />
                        ) : null}
                    </div>
                </div>

                {/* Active filter chips */}
                <FilterChips
                    typeFilter={typeFilter}
                    statusFilter={statusFilter}
                    readinessFilter={readinessFilter}
                    assignedUserIdFilter={assignedUserIdFilter}
                    assignedUsers={assignedUsers}
                    onTypeFilterChange={onTypeFilterChange}
                    onStatusFilterChange={onStatusFilterChange}
                    onReadinessFilterChange={onReadinessFilterChange}
                    onAssignedUserFilterChange={onAssignedUserFilterChange}
                    onResetAll={handleResetFilters}
                />
            </div>

            {/* Queue list */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading && !queueData ? (
                    <QueueSkeleton />
                ) : isError ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-red-500">Failed to load the review queue.</p>
                        <button onClick={onRetry} className="mt-3 text-xs font-semibold text-blue-500 hover:underline">
                            Retry
                        </button>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background text-text-muted">
                            <Icon name="file-text" className="h-6 w-6" />
                        </div>
                        <h3 className="mt-5 text-base font-bold text-text-primary">No transactions in review</h3>
                        <p className="mt-2 text-sm text-text-secondary">
                            {debouncedSearch || hasActiveFilters
                                ? 'No completed or cancelled transactions match the current filters.'
                                : 'Completed and cancelled transactions will appear here once they are ready for admin review.'}
                        </p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.vesselKey} className="border-b border-border last:border-b-0">
                            <VesselGroupHeader
                                group={group}
                                isExpanded={expandedGroups.has(group.vesselKey)}
                                onToggle={() => toggleGroup(group.vesselKey)}
                                mode="review"
                            />
                            {expandedGroups.has(group.vesselKey) ? (
                                <div
                                    className="bg-surface-secondary/10 dark:bg-transparent px-0 pb-1.5 pt-0.5 sm:pb-2"
                                    data-testid="admin-review-group-panel"
                                >
                                    <div className="ml-6 border-l-2 border-slate-300 dark:border-border/55 pl-2.5 sm:ml-7 sm:pl-3">
                                        <div className="overflow-hidden rounded-lg bg-surface-secondary/20 dark:bg-surface/60">
                                            {group.transactions.map((transaction) => (
                                                <QueueItem
                                                    key={reviewKey(transaction)}
                                                    transaction={transaction}
                                                    isSelected={matchesSelection(selection, transaction)}
                                                    onSelect={onSelect}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {meta && !isLoading ? (
                <div className="border-t border-border bg-surface-secondary/20 px-5 py-3 sm:px-6">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-mono text-text-muted">
                            {hasTransactions
                                ? `${rangeStart}-${rangeEnd} of ${meta.total} reviewable transactions`
                                : `0 of ${meta.total} reviewable transactions`}
                            {isFetching && !isLoading ? ' · refreshing...' : ''}
                        </p>
                        <p className="text-[11px] font-mono text-text-muted">
                            Page {meta.current_page} of {meta.last_page}
                        </p>
                    </div>
                    <Pagination
                        currentPage={meta.current_page}
                        totalPages={meta.last_page}
                        perPage={meta.per_page}
                        compact
                        onPageChange={onPageChange}
                        onPerPageChange={onPerPageChange}
                    />
                </div>
            ) : null}
        </div>
    );
};
