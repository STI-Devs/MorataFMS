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
    onArchiveGroup,
    archivingGroupKey,
    onPageChange,
    onPerPageChange,
    onResetFilters,
    bulkArchiveError,
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
    onArchiveGroup: (groupKey: string, transactions: AdminReviewQueueItem[]) => void;
    archivingGroupKey: string | null;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onResetFilters: () => void;
    bulkArchiveError: string | null;
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
    const expandedSummaryItems = [
        ...summaryItems,
        { label: 'Total', value: queueData?.meta?.total ?? '—' },
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
            className={`flex w-full flex-col ${
                expanded
                    ? 'max-w-none gap-3 bg-transparent'
                    : 'h-full min-h-0 overflow-hidden border-r border-border bg-surface xl:min-w-[26rem] xl:max-w-[38rem] 2xl:min-w-[30rem] 2xl:max-w-[42rem]'
            }`}
            data-testid="admin-review-queue-pane"
        >
            {/* Header */}
            <div className={`flex-none bg-surface px-5 ${
                expanded
                    ? 'rounded-xl border border-border py-4 shadow-sm'
                    : 'border-b border-border py-4'
            }`}>
                <div className={`${expanded ? 'mb-3' : 'mb-3'} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>
                    <div>
                        {expanded ? (
                            <>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Documents Control</p>
                                <h2 className="mt-1 text-lg font-black tracking-tight text-text-primary">Review queue</h2>
                            </>
                        ) : (
                            <>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Completed Transaction Queue</p>
                                <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-text-primary">Review queue</h2>
                            </>
                        )}
                    </div>
                    {expanded ? (
                        <div
                            className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end"
                            data-testid="admin-review-kpi-strip"
                        >
                            {expandedSummaryItems.map((item) => (
                                <span
                                    key={item.label}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-subtle px-3 text-[11px] font-black uppercase tracking-wider text-text-muted"
                                >
                                    {item.label}
                                    <span className="text-[13px] font-black normal-case tracking-normal text-text-primary">
                                        {isSummaryLoading && item.label !== 'Total' ? '—' : item.value}
                                    </span>
                                </span>
                            ))}
                        </div>
                    ) : queueData?.meta ? (
                            <span className="inline-flex h-6 items-center justify-center rounded-full border border-border bg-surface-secondary px-2.5 text-[11px] font-semibold text-text-secondary">
                                {queueData.meta.total} total
                            </span>
                        ) : null}
                </div>

                {/* KPI strip */}
                {!expanded ? (
                    <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="admin-review-kpi-strip">
                        {summaryItems.map((item) => (
                            <span
                                key={item.label}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary shadow-sm"
                            >
                                <span className="font-semibold text-text-primary">
                                    {isSummaryLoading ? '—' : item.value}
                                </span>{' '}
                                {item.label}
                            </span>
                        ))}
                    </div>
                ) : null}

                {/* Search + Filters trigger */}
                <div className="flex items-center gap-2.5">
                    <div className="relative min-w-0 flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Icon name="search" className="h-4 w-4 text-neutral-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search vessel, BL, ref, or client..."
                            value={searchQuery}
                            onChange={(event) => onSearchChange(event.target.value)}
                            className="w-full rounded-xl border border-border-strong bg-input-bg py-2 pl-9 pr-4 text-[13px] font-medium text-text-primary placeholder:font-normal placeholder:text-text-muted transition-colors hover:bg-surface-secondary/70 focus:border-blue-500/50 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                        />
                    </div>

                    {/* Filters button + popover */}
                    <div className="relative flex-none" ref={popoverRef}>
                        <button
                            type="button"
                            onClick={() => setPopoverOpen((prev) => !prev)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                popoverOpen || hasActiveFilters
                                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300'
                                    : 'border-border bg-surface text-text-secondary hover:bg-hover hover:text-text-primary shadow-sm'
                            }`}
                        >
                            <Icon name="filter" className="h-4 w-4" />
                            Filters
                            {hasActiveFilters ? (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
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

                {bulkArchiveError ? (
                    <p className="mt-3 text-xs font-medium text-red-500">{bulkArchiveError}</p>
                ) : null}
            </div>

            {/* Queue list */}
            <div className={`${expanded ? 'overflow-hidden rounded-t-xl border-x border-t border-border' : 'min-h-0 flex-1 overflow-y-auto'} bg-surface-secondary/20`}>
                {isLoading && !queueData ? (
                    <QueueSkeleton />
                ) : isError ? (
                    <div className="p-10 text-center">
                        <p className="text-[14px] font-medium text-red-500">Failed to load the review queue.</p>
                        <button onClick={onRetry} className="mt-3 text-[13px] font-semibold text-blue-500 hover:underline">
                            Retry
                        </button>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface shadow-sm text-text-muted">
                            <Icon name="file-text" className="h-6 w-6" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-text-primary">No transactions in review</h3>
                        <p className="mt-2 max-w-sm text-[13px] text-text-secondary">
                            {debouncedSearch || hasActiveFilters
                                ? 'No completed or cancelled transactions match the current filters.'
                                : 'Completed and cancelled transactions will appear here once they are ready for admin review.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {groups.map((group) => (
                            <div key={group.vesselKey} className="border-b border-border last:border-b-0 bg-surface">
                                <VesselGroupHeader
                                    group={group}
                                    isExpanded={expandedGroups.has(group.vesselKey)}
                                    onToggle={() => toggleGroup(group.vesselKey)}
                                    mode="review"
                                    action={(
                                        <button
                                            type="button"
                                            onClick={() => onArchiveGroup(group.vesselKey, group.transactions)}
                                            disabled={group.stats.completed !== group.stats.total || archivingGroupKey === group.vesselKey}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                group.stats.completed === group.stats.total
                                                    ? 'border-border bg-surface text-text-primary shadow-sm hover:bg-hover'
                                                    : 'cursor-not-allowed border-border bg-surface-secondary/60 text-text-muted'
                                            }`}
                                            title={
                                                group.stats.completed === group.stats.total
                                                    ? 'Move this vessel group to records'
                                                    : 'All transactions in this vessel group must be ready before moving to records'
                                            }
                                        >
                                            <Icon name="archive" className="h-3.5 w-3.5" />
                                            {archivingGroupKey === group.vesselKey ? 'Moving...' : 'Move to Records'}
                                        </button>
                                    )}
                                />
                                {expandedGroups.has(group.vesselKey) ? (
                                    <div
                                        className="bg-surface-secondary/20 px-4 pb-4 pt-2"
                                        data-testid="admin-review-group-panel"
                                    >
                                        <div className="ml-2 border-l-2 border-border pl-4">
                                            <div className="flex flex-col gap-2">
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
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {meta && !isLoading ? (
                <div className={`${expanded ? 'rounded-b-xl border-x border-b border-border' : ''} border-t border-border bg-surface-subtle/95 px-8 py-4`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                            {hasTransactions
                                ? `${rangeStart}-${rangeEnd} of ${meta.total} reviewable transactions`
                                : `0 of ${meta.total} reviewable transactions`}
                            {isFetching && !isLoading ? ' · refreshing...' : ''}
                        </p>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
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
