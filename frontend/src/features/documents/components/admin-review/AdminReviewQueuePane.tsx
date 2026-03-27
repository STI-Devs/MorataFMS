import { Icon } from '../../../../components/Icon';
import type { EncoderUser } from '../../../oversight/types/transaction.types';
import { Pagination } from '../../../../components/Pagination';
import type {
    AdminReviewQueueItem,
    AdminReviewReadinessFilter,
    AdminReviewQueueResponse,
    AdminReviewStatusFilter,
    AdminReviewTypeFilter,
} from '../../types/document.types';
import { QueueSkeleton } from './AdminReviewShared';
import {
    matchesSelection,
    reviewKey,
    timeAgo,
    TYPE_TONES,
    type ReviewSelection,
} from './adminReview.utils';

const QueueItem = ({
    transaction,
    isSelected,
    onSelect,
}: {
    transaction: AdminReviewQueueItem;
    isSelected: boolean;
    onSelect: (transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>) => void;
}) => {
    const typeTone = TYPE_TONES[transaction.type] ?? TYPE_TONES.import;

    return (
        <button
            onClick={() => onSelect(transaction)}
            className={`w-full border-b border-border text-left transition-all ${
                isSelected
                    ? 'border-l-[3px] border-l-blue-500 bg-blue-500/10'
                    : 'border-l-[3px] border-l-transparent hover:bg-hover'
            }`}
        >
            <div className="px-4 py-3">
                {/* Row 1: BL Number + Time */}
                <div className="flex items-baseline justify-between gap-3">
                    <span className={`font-mono text-sm font-bold tracking-tight leading-tight ${isSelected ? 'text-blue-500' : 'text-text-primary'}`}>
                        {transaction.bl_number ?? transaction.ref}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase font-mono tracking-widest text-text-muted">
                        {timeAgo(transaction.finalized_date)}
                    </span>
                </div>

                {/* Row 2: Client + Ref + User — merged into one compact line */}
                <p className="mt-1 truncate text-xs text-text-muted">
                    <span className="font-medium text-text-secondary">{transaction.client ?? 'Unknown client'}</span>
                    {' · '}{transaction.ref}{transaction.assigned_user ? ` · ${transaction.assigned_user}` : ''}
                </p>

                {/* Row 3: Type badge only — readiness already visible in detail pane */}
                <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${typeTone.text} ${typeTone.bg}`}>
                            {transaction.type}
                        </span>
                        {transaction.has_exceptions ? (
                            <span className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">
                                <Icon name="flag" className="h-2.5 w-2.5" />
                                Remarks
                            </span>
                        ) : null}
                    </div>
                    <span className={`text-[11px] font-semibold tabular-nums ${transaction.archive_ready ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {transaction.docs_count}/{transaction.docs_total}
                    </span>
                </div>
            </div>
        </button>
    );
};

export const AdminReviewQueuePane = ({
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
}: {
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
}) => {
    return (
    <div
        className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:w-[38%] lg:min-w-[22rem] lg:max-w-[30rem]"
        data-testid="admin-review-queue-pane"
    >
        <div className="flex-none border-b border-border px-4 py-3">
            {/* Search */}
            <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search BL, ref, or client..."
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {/* All filters — always visible in 2×2 grid */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
                <select
                    value={typeFilter}
                    onChange={(event) => onTypeFilterChange(event.target.value as AdminReviewTypeFilter)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text-primary focus:outline-none"
                >
                    <option value="all">All Types</option>
                    <option value="import">Import</option>
                    <option value="export">Export</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(event) => onStatusFilterChange(event.target.value as AdminReviewStatusFilter)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text-primary focus:outline-none"
                >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    value={readinessFilter}
                    onChange={(event) => onReadinessFilterChange(event.target.value as AdminReviewReadinessFilter)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text-primary focus:outline-none"
                >
                    <option value="all">All Readiness</option>
                    <option value="ready">Archive Ready</option>
                    <option value="missing_docs">Missing Docs</option>
                    <option value="flagged">Flagged</option>
                </select>
                <select
                    value={assignedUserIdFilter === 'all' ? 'all' : String(assignedUserIdFilter)}
                    onChange={(event) =>
                        onAssignedUserFilterChange(
                            event.target.value === 'all' ? 'all' : Number.parseInt(event.target.value, 10),
                        )
                    }
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text-primary focus:outline-none"
                >
                    <option value="all">All Encoders</option>
                    {assignedUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>


        {/* Pagination count above list — scannable before scrolling */}
        {queueData?.meta && !isLoading ? (
            <div className="flex-none border-b border-border px-5 py-3.5 sm:px-6">
                <p className="text-[11px] font-mono text-text-muted">
                    Showing {transactions.length} of {queueData.meta.total} finalized files
                    {isFetching && !isLoading ? ' · refreshing...' : ''}
                </p>
            </div>
        ) : null}

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
                    <h3 className="mt-5 text-base font-bold text-text-primary">No files in review</h3>
                    <p className="mt-2 text-sm text-text-secondary">
                        {debouncedSearch || typeFilter !== 'all' || statusFilter !== 'all' || readinessFilter !== 'all' || assignedUserIdFilter !== 'all'
                            ? 'No finalized transactions match the current filters.'
                            : 'Finalized transactions will appear here once they need archive review.'}
                    </p>
                </div>
            ) : (
                transactions.map((transaction) => (
                    <QueueItem
                        key={reviewKey(transaction)}
                        transaction={transaction}
                        isSelected={matchesSelection(selection, transaction)}
                        onSelect={onSelect}
                    />
                ))
            )}
        </div>

        {queueData?.meta && queueData.meta.last_page > 1 ? (
            <div className="border-t border-border px-5 sm:px-6">
                <Pagination
                    currentPage={queueData.meta.current_page}
                    totalPages={queueData.meta.last_page}
                    perPage={queueData.meta.per_page}
                    onPageChange={onPageChange}
                    onPerPageChange={onPerPageChange}
                />
            </div>
        ) : null}
    </div>
    );
};
