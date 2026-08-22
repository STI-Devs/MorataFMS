import { Fragment } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../components/ui/table';
import { VesselGroupHeader } from '../../../tracking/components/vessel-groups/VesselGroupHeader';
import type { VesselGroup } from '../../../tracking/types';
import type { AdminReviewQueueItem } from '../../types/document.types';
import { AdminReviewTableRow } from './AdminReviewTableRow';
import { matchesSelection, reviewKey, type ReviewSelection } from './adminReview.utils';
import { Archive } from 'lucide-react';

interface AdminReviewTableProps {
    groups: VesselGroup<AdminReviewQueueItem>[];
    expandedGroups: Set<string>;
    toggleGroup: (key: string) => void;
    selection: ReviewSelection | null;
    onSelect: (transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>) => void;
    onArchiveGroup: (groupKey: string, transactions: AdminReviewQueueItem[]) => void;
    archivingGroupKey: string | null;
}

export const AdminReviewTable = ({
    groups,
    expandedGroups,
    toggleGroup,
    selection,
    onSelect,
    onArchiveGroup,
    archivingGroupKey,
}: AdminReviewTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/80">
                    <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[18%] min-w-[150px]">
                        BL / Reference
                    </TableHead>
                    <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[28%] min-w-[200px]">
                        Client
                    </TableHead>
                    <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[18%] min-w-[130px] hidden sm:table-cell">
                        Encoder
                    </TableHead>
                    <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[14%] min-w-[100px] hidden md:table-cell">
                        Documents
                    </TableHead>
                    <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[12%] min-w-[120px]">
                        Readiness
                    </TableHead>
                    <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[10%] min-w-[90px] text-right hidden lg:table-cell">
                        Finalized
                    </TableHead>
                    <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[80px] text-right">
                        Action
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {groups.map((group) => {
                    const isExpanded = expandedGroups.has(group.vesselKey);

                    return (
                        <Fragment key={group.vesselKey}>
                            {/* Vessel Group Header Row */}
                            <TableRow className="border-b-0 hover:bg-transparent">
                                <TableCell colSpan={7} className="p-0 hover:bg-transparent">
                                    <VesselGroupHeader
                                        group={group}
                                        isExpanded={isExpanded}
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
                                </TableCell>
                            </TableRow>

                            {/* Direct sibling rows in TableBody so columns align 100% with the table header */}
                            {isExpanded &&
                                group.transactions.map((transaction, index) => (
                                    <AdminReviewTableRow
                                        key={reviewKey(transaction)}
                                        transaction={transaction}
                                        isSelected={matchesSelection(selection, transaction)}
                                        onSelect={onSelect}
                                        dataTestId={index === 0 ? 'admin-review-group-panel' : undefined}
                                    />
                                ))}
                        </Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );
};
