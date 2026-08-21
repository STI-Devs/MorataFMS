import { FileText, TriangleAlert } from 'lucide-react';
import { Pagination } from '../../../../components/Pagination';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../components/ui/table';
import type { DocumentTransactionListResponse } from '../../types/document.types';
import { formatDate, toTitleCase, TYPE_CONFIG, type DocumentRow } from './documentsList.utils';

const TableEmptyState = ({ isFullyEmpty }: { isFullyEmpty: boolean }) => (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <FileText className="size-10 opacity-30" />
        <p className="text-sm font-semibold">
            {isFullyEmpty ? 'No completed transactions yet' : 'No transactions match your filter'}
        </p>
        {isFullyEmpty ? (
            <p className="max-w-xs text-center text-xs">
                Completed import and export transactions will appear here once all stages are done.
            </p>
        ) : null}
    </div>
);

export const DocumentsTable = ({
    rows,
    response,
    selectedRef,
    isLoading,
    onSelect,
    onPageChange,
    onPerPageChange,
}: {
    rows: DocumentRow[];
    response: DocumentTransactionListResponse | undefined;
    selectedRef: string | null;
    isLoading: boolean;
    onSelect: (ref: string) => void;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}) => {
    const meta = response?.meta;

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                            <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference / BL</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</TableHead>
                            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                            <TableHead className="w-[120px] text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                            <TableHead className="w-[100px] text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Docs</TableHead>
                            <TableHead className="w-[110px] text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="mx-auto h-5 w-18 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="mx-auto h-5 w-12 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="ml-auto h-7 w-20 rounded" /></TableCell>
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <TableEmptyState isFullyEmpty={(response?.meta?.total ?? 0) === 0} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => {
                                const isSelected = selectedRef === row.ref;
                                const typeConfig = TYPE_CONFIG[row.type];
                                const isMissingDocs = row.docCount === 0;
                                const normalizedStatus = row.status.toLowerCase();

                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={isSelected ? 'selected' : undefined}
                                        onClick={() => onSelect(row.ref)}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Type */}
                                        <TableCell>
                                            <Badge
                                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                style={{ color: typeConfig.color, backgroundColor: typeConfig.bg }}
                                            >
                                                {typeConfig.label}
                                            </Badge>
                                        </TableCell>

                                        {/* Reference / BL */}
                                        <TableCell>
                                            {row.type === 'import' && row.customsRef && row.customsRef !== '—' ? (
                                                <>
                                                    <span className="text-xs font-bold text-foreground block">{row.customsRef}</span>
                                                    {row.blNo && row.blNo !== '—' ? (
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">BL: {row.blNo}</p>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <span className="text-xs font-semibold text-foreground">{row.blNo}</span>
                                            )}
                                        </TableCell>

                                        {/* Client */}
                                        <TableCell>
                                            <p className="truncate text-xs font-semibold text-foreground max-w-[240px]">
                                                {toTitleCase(row.client)}
                                            </p>
                                            {row.port !== '—' ? (
                                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground max-w-[240px]">
                                                    {row.vessel !== '—' ? `${row.vessel} · ` : ''}
                                                    {row.port}
                                                </p>
                                            ) : null}
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="text-xs font-medium text-foreground">
                                            {formatDate(row.date)}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="text-center">
                                            {normalizedStatus === 'cancelled' ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                >
                                                    Cancelled
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                                >
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    {row.type === 'import' ? 'Cleared' : 'Shipped'}
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Docs Count */}
                                        <TableCell className="text-center">
                                            {isMissingDocs ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                                >
                                                    <TriangleAlert className="size-3" />
                                                    0
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                                >
                                                    <FileText className="size-3" />
                                                    {row.docCount}
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-end">
                                            <Button
                                                size="sm"
                                                className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(row.ref);
                                                }}
                                            >
                                                View Files
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && meta && meta.total > 0 ? (
                <div className="p-3 border-t">
                    <Pagination
                        currentPage={meta.current_page}
                        totalPages={meta.last_page}
                        perPage={meta.per_page}
                        perPageOptions={[15, 30, 50, 100]}
                        compact
                        onPageChange={onPageChange}
                        onPerPageChange={onPerPageChange}
                    />
                </div>
            ) : null}
        </>
    );
};
