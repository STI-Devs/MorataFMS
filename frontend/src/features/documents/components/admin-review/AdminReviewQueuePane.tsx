import { Icon } from '../../../../components/Icon';
import { Pagination } from '../../../../components/Pagination';
import type {
    AdminReviewQueueItem,
    AdminReviewQueueResponse,
    AdminReviewStatusFilter,
    AdminReviewTypeFilter,
} from '../../types/document.types';
import { QueueSkeleton } from './AdminReviewShared';
import {
    matchesSelection,
    reviewKey,
    STATUS_TONES,
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
    const isComplete = transaction.docs_count === transaction.docs_total;
    const statusTone = STATUS_TONES[transaction.status.toLowerCase()] ?? STATUS_TONES.completed;
    const typeTone = TYPE_TONES[transaction.type] ?? TYPE_TONES.import;

    return (
        <button
            onClick={() => onSelect(transaction)}
            className={`w-full border-b border-border p-4 text-left transition-colors ${
                isSelected
                    ? 'border-l-4 border-l-blue-500 bg-blue-500/10'
                    : 'border-l-4 border-l-transparent hover:bg-hover'
            }`}
        >
            <div className="mb-1 flex items-center justify-between gap-3">
                <span className={`font-mono font-bold tracking-tight ${isSelected ? 'text-blue-500' : 'text-text-primary'}`}>
                    {transaction.bl_number ?? transaction.ref}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-text-muted">
                    {timeAgo(transaction.finalized_date)}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-text-secondary">
                    {transaction.client ?? 'Unknown client'}
                </p>
                <span className="border-l border-border pl-2 text-[10px] font-mono text-text-muted">
                    {transaction.ref}
                </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-text-muted">
                <span>{transaction.assigned_user ?? 'Unassigned'}</span>
                <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-bold uppercase tracking-[0.16em] ${typeTone.text} ${typeTone.bg}`}>
                    {transaction.type}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${statusTone.text} ${statusTone.bg}`}>
                    {transaction.status}
                </span>
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {transaction.docs_count}/{transaction.docs_total} Docs
                    </span>
                    {transaction.has_exceptions ? (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                            <Icon name="flag" className="h-3 w-3" />
                            Open Remarks
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
};

export const AdminReviewQueuePane = ({
    searchQuery,
    typeFilter,
    statusFilter,
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
    onRetry,
    onSelect,
    onPageChange,
    onPerPageChange,
}: {
    searchQuery: string;
    typeFilter: AdminReviewTypeFilter;
    statusFilter: AdminReviewStatusFilter;
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
    onRetry: () => void;
    onSelect: (transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>) => void;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}) => (
    <div className="flex w-full flex-col bg-surface lg:w-[40%] lg:border-r lg:border-border">
        <div className="flex-none border-b border-border p-4">
            <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search BL, ref, or client..."
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select
                    value={typeFilter}
                    onChange={(event) => onTypeFilterChange(event.target.value as AdminReviewTypeFilter)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none"
                >
                    <option value="all">All Types</option>
                    <option value="import">Import</option>
                    <option value="export">Export</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(event) => onStatusFilterChange(event.target.value as AdminReviewStatusFilter)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none"
                >
                    <option value="all">All Finalized</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            {isFetching && !isLoading ? (
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Refreshing queue...
                </p>
            ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading && !queueData ? (
                <QueueSkeleton />
            ) : isError ? (
                <div className="p-8 text-center">
                    <p className="text-sm font-medium text-red-500">Failed to load the review queue.</p>
                    <button onClick={onRetry} className="mt-3 text-xs font-semibold text-blue-500 hover:underline">
                        Retry
                    </button>
                </div>
            ) : transactions.length === 0 ? (
                <div className="p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-text-muted">
                        <Icon name="file-text" className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-text-primary">No files in review</h3>
                    <p className="mt-2 text-sm text-text-secondary">
                        {debouncedSearch || typeFilter !== 'all' || statusFilter !== 'all'
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

        {queueData?.meta ? (
            queueData.meta.last_page > 1 ? (
                <div className="border-t border-border px-4">
                    <Pagination
                        currentPage={queueData.meta.current_page}
                        totalPages={queueData.meta.last_page}
                        perPage={queueData.meta.per_page}
                        onPageChange={onPageChange}
                        onPerPageChange={onPerPageChange}
                    />
                </div>
            ) : (
                <div className="border-t border-border px-4 py-3 text-xs text-text-muted">
                    Showing {transactions.length} of {queueData.meta.total} finalized files
                </div>
            )
        ) : null}
    </div>
);
