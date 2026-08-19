import { useMemo } from 'react';
import { Archive, FileText, Filter, Search } from 'lucide-react';
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
import { AdminReviewKpiCards } from './AdminReviewKpiCards';
import { AdminReviewTable } from './AdminReviewTable';
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
                    : 'h-full min-h-0 overflow-hidden border-r border-border bg-card xl:min-w-[26rem] xl:max-w-[38rem] 2xl:min-w-[30rem] 2xl:max-w-[42rem]'
            }`}
            data-testid="admin-review-queue-pane"
        >
            {/* Top KPI metric cards when in full expanded view */}
            {expanded ? (
                <AdminReviewKpiCards
                    summary={summary}
                    total={queueData?.meta?.total}
                    isLoading={isSummaryLoading}
                />
            ) : null}

            {/* Main Queue Card Container */}
            <div className={`flex flex-col ${expanded ? 'overflow-hidden rounded-xl border border-border bg-card shadow-xs' : 'h-full min-h-0'}`}>
                {/* Header / Filter Toolbar */}
                <div className={`flex-none bg-card px-4 py-3 sm:px-5 sm:py-3.5 ${!expanded ? 'border-b border-border' : 'border-b border-border/80'}`}>
                    {!expanded ? (
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Completed Transaction Queue</p>
                                <h2 className="text-sm font-semibold tracking-tight text-foreground">Review queue</h2>
                            </div>
                            {queueData?.meta ? (
                                <span className="inline-flex h-6 items-center justify-center rounded-full border border-border bg-muted/50 px-2.5 text-[11px] font-semibold text-muted-foreground">
                                    {queueData.meta.total} total
                                </span>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Compact KPI strip when in split view */}
                    {!expanded ? (
                        <div className="mb-3 flex flex-wrap items-center gap-1.5" data-testid="admin-review-kpi-strip">
                            {summaryItems.map((item) => (
                                <span
                                    key={item.label}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs"
                                >
                                    <span className="font-semibold text-foreground">
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
                                <Search className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search vessel, BL, ref, or client..."
                                value={searchQuery}
                                onChange={(event) => onSearchChange(event.target.value)}
                                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-xs font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-colors hover:bg-muted/40 focus:border-blue-500/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue-500/30 shadow-2xs"
                            />
                        </div>

                        {/* Filters button + popover */}
                        <div className="relative flex-none" ref={popoverRef}>
                            <button
                                type="button"
                                onClick={() => setPopoverOpen((prev) => !prev)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs ${
                                    popoverOpen || hasActiveFilters
                                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Filter className="h-3.5 w-3.5" />
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
                        <p className="mt-2.5 text-xs font-medium text-rose-500">{bulkArchiveError}</p>
                    ) : null}
                </div>

                {/* Queue list / Grouped Table */}
                <div className={`${expanded ? 'overflow-x-auto' : 'min-h-0 flex-1 overflow-y-auto'} bg-card`}>
                    {isLoading && !queueData ? (
                        <QueueSkeleton />
                    ) : isError ? (
                        <div className="p-10 text-center">
                            <p className="text-sm font-medium text-rose-500">Failed to load the review queue.</p>
                            <button onClick={onRetry} className="mt-3 text-xs font-semibold text-blue-500 hover:underline cursor-pointer">
                                Retry
                            </button>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground shadow-2xs">
                                <FileText className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">No transactions in review</h3>
                            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                                {debouncedSearch || hasActiveFilters
                                    ? 'No completed or cancelled transactions match the current filters.'
                                    : 'Completed and cancelled transactions will appear here once they are ready for admin review.'}
                            </p>
                        </div>
                    ) : expanded ? (
                        <AdminReviewTable
                            groups={groups}
                            expandedGroups={expandedGroups}
                            toggleGroup={toggleGroup}
                            selection={selection}
                            onSelect={onSelect}
                            onArchiveGroup={onArchiveGroup}
                            archivingGroupKey={archivingGroupKey}
                        />
                    ) : (
                        <div>
                            {groups.map((group) => (
                                <div key={group.vesselKey} className="border-b border-border/80 last:border-b-0 bg-card">
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
                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                                                    group.stats.completed === group.stats.total
                                                        ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                                                        : 'cursor-not-allowed border-border/50 bg-muted/40 text-muted-foreground'
                                                }`}
                                                title={
                                                    group.stats.completed === group.stats.total
                                                        ? 'Move this vessel group to records'
                                                        : 'All transactions in this vessel group must be ready before moving to records'
                                                }
                                            >
                                                <Archive className="h-3.5 w-3.5" />
                                                {archivingGroupKey === group.vesselKey ? 'Moving...' : 'Move to Records'}
                                            </button>
                                        )}
                                    />
                                    {expandedGroups.has(group.vesselKey) ? (
                                        <div
                                            className="bg-muted/15"
                                            data-testid="admin-review-group-panel"
                                        >
                                            <div className="flex flex-col">
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
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {meta && !isLoading ? (
                    <div className="border-t border-border bg-muted/20 px-4 py-3 sm:px-6 sm:py-3.5">
                        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-medium text-muted-foreground">
                                {hasTransactions
                                    ? `${rangeStart}-${rangeEnd} of ${meta.total} reviewable transactions`
                                    : `0 of ${meta.total} reviewable transactions`}
                                {isFetching && !isLoading ? ' · refreshing...' : ''}
                            </p>
                            <p className="text-[11px] font-medium text-muted-foreground">
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
        </div>
    );
};
