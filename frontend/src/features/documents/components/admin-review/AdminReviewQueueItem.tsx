import { Icon } from '../../../../components/Icon';
import type { AdminReviewQueueItem as AdminReviewQueueItemType } from '../../types/document.types';
import { timeAgo } from './adminReview.utils';

export const QueueItem = ({
    transaction,
    isSelected,
    onSelect,
}: {
    transaction: AdminReviewQueueItemType;
    isSelected: boolean;
    onSelect: (transaction: Pick<AdminReviewQueueItemType, 'id' | 'type'>) => void;
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
