import { useMemo } from 'react';

import { Icon } from '../../../../components/Icon';
import type { EncoderUser } from '../../../oversight/types/transaction.types';
import { Pagination } from '../../../../components/Pagination';
import { VesselGroupHeader } from '../../../tracking/components/vessel-groups/VesselGroupHeader';
import type {
    AdminReviewQueueItem,
    AdminReviewReadinessFilter,
    AdminReviewQueueResponse,
    AdminReviewStatusFilter,
    AdminReviewStats,
    AdminReviewTypeFilter,
} from '../../types/document.types';
import { QueueSkeleton } from './AdminReviewShared';
import { FilterChips, FilterPopover } from './AdminReviewQueueFilters';
import { QueueItem } from './AdminReviewQueueItem';
import { useAdminReviewQueueGroups } from './useAdminReviewQueueGroups';
import {
    buildReviewGroups,
    matchesSelection,
    reviewKey,
    type ReviewSelection,
} from './adminReview.utils';

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
    const groups = useMemo(() => buildReviewGroups(transactions), [transactions]);
    const {
        popoverOpen,
        setPopoverOpen,
        popoverRef,
        expandedGroups,
        toggleGroup,
    } = useAdminReviewQueueGroups(groups);

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
