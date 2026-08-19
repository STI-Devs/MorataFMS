import { CheckCircle2, ChevronRight, Clock, FileText, Flag } from 'lucide-react';
import { TableCell, TableRow } from '../../../../components/ui/table';
import type { AdminReviewQueueItem } from '../../types/document.types';
import { timeAgo, toTitleCase } from './adminReview.utils';

interface AdminReviewTableRowProps {
    transaction: AdminReviewQueueItem;
    isSelected: boolean;
    onSelect: (transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>) => void;
    dataTestId?: string;
}

export const AdminReviewTableRow = ({
    transaction,
    isSelected,
    onSelect,
    dataTestId,
}: AdminReviewTableRowProps) => {
    const formattedClient = toTitleCase(transaction.client ?? 'Unknown client');
    const formattedEncoder = transaction.assigned_user ? toTitleCase(transaction.assigned_user) : 'Unassigned';
    const blOrRef = transaction.bl_number ?? transaction.ref;
    const secondaryRef = transaction.type === 'import' && transaction.bl_number ? transaction.ref : null;

    return (
        <TableRow
            data-testid={dataTestId}
            className={`transition-colors cursor-pointer text-xs ${
                isSelected
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 border-l-2 border-l-blue-500'
                    : 'hover:bg-muted/50 border-b border-border/60'
            }`}
            onClick={() => onSelect(transaction)}
        >
            {/* BL / Reference */}
            <TableCell className="py-3 px-4 font-mono font-bold w-[18%] min-w-[150px]">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(transaction);
                    }}
                    className="font-mono text-xs font-bold text-left text-foreground hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer block truncate"
                    title={blOrRef}
                >
                    {blOrRef}
                </button>
                {secondaryRef ? (
                    <span className="block text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
                        Ref: {secondaryRef}
                    </span>
                ) : null}
            </TableCell>

            {/* Client */}
            <TableCell className="py-3 px-4 w-[28%] min-w-[200px]">
                <span className="font-medium text-foreground truncate block" title={formattedClient}>
                    {formattedClient}
                </span>
            </TableCell>

            {/* Encoder */}
            <TableCell className="py-3 px-4 w-[18%] min-w-[130px] hidden sm:table-cell">
                <span className="text-muted-foreground truncate block" title={formattedEncoder}>
                    {formattedEncoder}
                </span>
            </TableCell>

            {/* Documents Count */}
            <TableCell className="py-3 px-4 w-[14%] min-w-[100px] hidden md:table-cell">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="size-3.5 text-muted-foreground/70 shrink-0" />
                    <span className="font-medium">
                        {transaction.docs_count}/{transaction.docs_total} docs
                    </span>
                </div>
            </TableCell>

            {/* Readiness Status */}
            <TableCell className="py-3 px-4 w-[12%] min-w-[120px]">
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
            </TableCell>

            {/* Date */}
            <TableCell className="py-3 px-4 w-[10%] min-w-[90px] font-mono text-muted-foreground text-right hidden lg:table-cell">
                {timeAgo(transaction.finalized_date)}
            </TableCell>

            {/* Actions */}
            <TableCell className="py-3 px-4 text-right w-[80px]">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(transaction);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer shadow-2xs transition-colors"
                >
                    Review
                    <ChevronRight className="size-3" />
                </button>
            </TableCell>
        </TableRow>
    );
};
