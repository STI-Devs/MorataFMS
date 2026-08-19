import { CheckCircle2, Clock, Flag } from 'lucide-react';
import type { AdminReviewQueueItem as AdminReviewQueueItemType } from '../../types/document.types';
import { timeAgo, toTitleCase } from './adminReview.utils';

export const QueueItem = ({
    transaction,
    isSelected,
    onSelect,
}: {
    transaction: AdminReviewQueueItemType;
    isSelected: boolean;
    onSelect: (transaction: Pick<AdminReviewQueueItemType, 'id' | 'type'>) => void;
}) => {
    const subtitleParts = [
        transaction.client ? toTitleCase(transaction.client) : 'Unknown client',
        transaction.type === 'import' ? transaction.ref : null,
        transaction.assigned_user,
    ].filter((part): part is string => Boolean(part));

    return (
        <button
            type="button"
            onClick={() => onSelect(transaction)}
            className={`group w-full text-left transition-all border-b border-border/70 last:border-b-0 cursor-pointer ${
                isSelected
                    ? 'border-l-[3px] border-l-blue-500 bg-blue-500/[0.08] dark:bg-blue-500/[0.07]'
                    : 'border-l-[3px] border-l-transparent hover:bg-muted/50'
            }`}
        >
            <div className="px-4 py-3 sm:px-5 sm:py-3">
                <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-mono text-sm font-bold tracking-tight truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                            {transaction.bl_number ?? transaction.ref}
                        </span>
                        {transaction.has_exceptions ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 shrink-0">
                                <Flag className="size-2.5" />
                                Remarks
                            </span>
                        ) : transaction.archive_ready ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                                <CheckCircle2 className="size-2.5" />
                                Ready
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 shrink-0">
                                <Clock className="size-2.5" />
                                Missing Docs
                            </span>
                        )}
                    </div>
                    <span className="shrink-0 text-[11px] font-mono font-medium text-muted-foreground">
                        {timeAgo(transaction.finalized_date)}
                    </span>
                </div>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/90">{subtitleParts[0]}</span>
                    {subtitleParts.slice(1).map((part) => ` · ${part}`).join('')}
                </p>
            </div>
        </button>
    );
};
