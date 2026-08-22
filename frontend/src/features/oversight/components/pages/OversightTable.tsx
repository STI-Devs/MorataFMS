import { Fragment } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../components/ui/table';
import {
    DataTableColumnHeader,
    type SortDirection,
} from '../../../../components/data-table/DataTableColumnHeader';
import { VesselGroupHeader } from '../../../tracking/components/vessel-groups/VesselGroupHeader';
import type { VesselGroup } from '../../../tracking/types';
import type { OversightTransaction } from '../../types/transaction.types';
import { OversightTableRow } from './OversightTableRow';

interface OversightTableProps {
    transactions: OversightTransaction[];
    groups: VesselGroup<OversightTransaction>[];
    expandedGroups: Set<string>;
    toggleGroup: (key: string) => void;
    viewMode?: 'table' | 'grouped';
    sortKey?: string | null;
    sortDir?: SortDirection;
    onSort?: (key: string, dir: SortDirection) => void;
    onSelectTransaction: (transaction: OversightTransaction) => void;
    onStatus: (transaction: OversightTransaction) => void;
    onRemarks: (transaction: OversightTransaction) => void;
    onDelete: (transaction: OversightTransaction) => void;
    onVesselFilter?: (vesselName: string) => void;
    deletingTargetKey: string | null;
}

export const OversightTable = ({
    transactions,
    groups,
    expandedGroups,
    toggleGroup,
    viewMode = 'table',
    sortKey,
    sortDir,
    onSort,
    onSelectTransaction,
    onStatus,
    onRemarks,
    onDelete,
    onVesselFilter,
    deletingTargetKey,
}: OversightTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground w-[75px]">
                        Type
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground w-[20%] min-w-[160px]">
                        <DataTableColumnHeader
                            title="Vessel"
                            sortKey="vessel"
                            currentSortKey={sortKey}
                            currentSortDir={sortDir}
                            onSort={onSort}
                        />
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground w-[15%] min-w-[130px]">
                        <DataTableColumnHeader
                            title="Reference"
                            sortKey="reference"
                            currentSortKey={sortKey}
                            currentSortDir={sortDir}
                            onSort={onSort}
                        />
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground w-[25%] min-w-[200px]">
                        <DataTableColumnHeader
                            title="Client"
                            sortKey="client"
                            currentSortKey={sortKey}
                            currentSortDir={sortDir}
                            onSort={onSort}
                        />
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground w-[12%] min-w-[110px]">
                        <DataTableColumnHeader
                            title="Status"
                            sortKey="status"
                            currentSortKey={sortKey}
                            currentSortDir={sortDir}
                            onSort={onSort}
                        />
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground hidden md:table-cell w-[14%] min-w-[120px]">
                        Encoder
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground text-center w-[60px]">
                        Remarks
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground hidden md:table-cell text-right w-[95px]">
                        <DataTableColumnHeader
                            title="Date"
                            sortKey="date"
                            currentSortKey={sortKey}
                            currentSortDir={sortDir}
                            onSort={onSort}
                            className="justify-end"
                        />
                    </TableHead>
                    <TableHead className="h-9 text-xs font-medium text-muted-foreground w-[50px] text-right">
                        Actions
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {viewMode === 'grouped' ? (
                    groups.map((group) => (
                        <Fragment key={group.vesselKey}>
                            <TableRow className="border-b-0 hover:bg-transparent">
                                <TableCell colSpan={9} className="p-0 hover:bg-transparent">
                                    <VesselGroupHeader
                                        group={group}
                                        isExpanded={expandedGroups.has(group.vesselKey)}
                                        onToggle={() => toggleGroup(group.vesselKey)}
                                    />
                                </TableCell>
                            </TableRow>
                            {expandedGroups.has(group.vesselKey) &&
                                group.transactions.map((transaction) => (
                                    <OversightTableRow
                                        key={`${transaction.type}-${transaction.id}`}
                                        transaction={transaction}
                                        isDeleting={deletingTargetKey === `${transaction.type}-${transaction.id}`}
                                        onOpen={() => onSelectTransaction(transaction)}
                                        onStatus={() => onStatus(transaction)}
                                        onRemarks={() => onRemarks(transaction)}
                                        onDelete={() => onDelete(transaction)}
                                        onVesselFilter={onVesselFilter}
                                    />
                                ))}
                        </Fragment>
                    ))
                ) : (
                    transactions.map((transaction) => (
                        <OversightTableRow
                            key={`${transaction.type}-${transaction.id}`}
                            transaction={transaction}
                            isDeleting={deletingTargetKey === `${transaction.type}-${transaction.id}`}
                            onOpen={() => onSelectTransaction(transaction)}
                            onStatus={() => onStatus(transaction)}
                            onRemarks={() => onRemarks(transaction)}
                            onDelete={() => onDelete(transaction)}
                            onVesselFilter={onVesselFilter}
                        />
                    ))
                )}
            </TableBody>
        </Table>
    );
};
