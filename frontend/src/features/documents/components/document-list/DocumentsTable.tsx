import { FileText, TriangleAlert } from 'lucide-react';
import { Pagination } from '../../../../components/Pagination';
import { Badge } from '../../../../components/ui/badge';
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
                            <TableHead>Type</TableHead>
                            <TableHead>BL No.</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Docs</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="mx-auto h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="mx-auto h-6 w-14 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={6} className="h-24 text-center">
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
                                        className="cursor-pointer"
                                    >
                                        <TableCell>
                                            <Badge
                                                className="rounded-full px-2.5 py-1 text-xs font-bold"
                                                style={{ color: typeConfig.color, backgroundColor: typeConfig.bg }}
                                            >
                                                {typeConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm font-bold tracking-tight text-foreground">
                                            {row.blNo}
                                        </TableCell>
                                        <TableCell>
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {toTitleCase(row.client)}
                                            </p>
                                            {row.port !== '—' ? (
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {row.vessel !== '—' ? `${row.vessel} · ` : ''}
                                                    {row.port}
                                                </p>
                                            ) : null}
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm font-semibold text-muted-foreground">
                                                {formatDate(row.date)}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{row.dateLabel} date</p>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {normalizedStatus === 'cancelled' ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                                                >
                                                    <span
                                                        className="size-1.5 rounded-full bg-danger"
                                                        style={{ boxShadow: '0 0 4px var(--danger)' }}
                                                    />
                                                    Cancelled
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="success"
                                                    className="gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                                                >
                                                    <span
                                                        className="size-1.5 rounded-full bg-success"
                                                        style={{ boxShadow: '0 0 4px var(--success)' }}
                                                    />
                                                    {row.type === 'import' ? 'Cleared' : 'Shipped'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isMissingDocs ? (
                                                <Badge
                                                    variant="warning"
                                                    className="gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                                                >
                                                    <TriangleAlert className="size-3" />
                                                    Missing
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="info"
                                                    className="gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                                                >
                                                    <FileText className="size-3" />
                                                    {row.docCount}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && meta && meta.last_page > 1 ? (
                <Pagination
                    currentPage={meta.current_page}
                    totalPages={meta.last_page}
                    perPage={meta.per_page}
                    onPageChange={onPageChange}
                    onPerPageChange={onPerPageChange}
                />
            ) : null}
        </>
    );
};
