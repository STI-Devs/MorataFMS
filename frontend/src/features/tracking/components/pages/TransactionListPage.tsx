import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { EmptyState } from '../../../../components/EmptyState';
import { Button } from '../../../../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import { appRoutes } from '../../../../lib/appRoutes';
import { trackingApi } from '../../api/trackingApi';
import { useCancelTransaction } from '../../hooks/useCancelTransaction';
import { useCreateTransaction } from '../../hooks/useCreateTransaction';
import { useTransactionList } from '../../hooks/useTransactionList';
import type {
    ApiExportTransaction,
    ApiImportTransaction,
    CreateExportPayload,
    CreateImportPayload,
} from '../../types';
import { trackingKeys } from '../../utils/queryKeys';
import { CancelTransactionModal } from '../modals/CancelTransactionModal';
import { EncodeModal } from '../modals/EncodeModal';
import type { VesselListFilters } from '../vessel-groups/VesselListToolbar';

function getPagesToPrefetch(currentPage: number, totalPages: number): number[] {
    return Array.from({ length: 3 }, (_, index) => currentPage + index + 1)
        .filter((pageNumber) => pageNumber <= totalPages);
}

export interface TransactionListPageProps<T> {
    type: 'import' | 'export';
    title?: string;
    subtitle?: string;
    encodeButtonLabel?: string;
    filters?: VesselListFilters;
    gridTemplateColumns: string;
    /** Shared floor width for the header AND data-row grids (must be identical on both or columns drift when scrolled). */
    minGridWidth?: string;
    renderHeaders: () => React.ReactNode;
    renderRow: (
        row: T,
        index: number,
        navigate: ReturnType<typeof useNavigate>,
        onCancel: (id: number, ref: string) => void,
    ) => React.ReactNode;
    mapResponseData: (data: (ApiImportTransaction | ApiExportTransaction)[]) => T[];
}

export function TransactionListPage<T>({
    type,
    filters,
    gridTemplateColumns,
    minGridWidth,
    renderHeaders,
    renderRow,
    mapResponseData,
}: TransactionListPageProps<T>) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const [isEncodeOpen, setIsEncodeOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

    const createMutation = useCreateTransaction(type);
    const cancelMutation = useCancelTransaction(type);

    const baseParams = useMemo(() => {
        let statusParam: string | undefined;
        let excludeStatuses: string | undefined = 'completed,cancelled';

        if (filters?.status === 'completed') {
            statusParam = 'completed';
            excludeStatuses = undefined;
        }

        return {
            search: filters?.search || undefined,
            status: statusParam,
            exclude_statuses: excludeStatuses,
            page,
            per_page: perPage,
        };
    }, [filters, page, perPage]);

    const { data: response, isLoading, isFetching } = useTransactionList(type, baseParams);
    const data = useMemo(() => mapResponseData(response?.data ?? []), [response, mapResponseData]);

    const updateSearchParams = (
        updater: (params: URLSearchParams) => void,
        options?: { replace?: boolean },
    ) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            updater(next);
            return next;
        }, options);
    };

    const setPage = (nextPage: number) =>
        updateSearchParams((params) => {
            params.set('page', String(nextPage));
        });

    const setPerPage = (nextPerPage: number) =>
        updateSearchParams((params) => {
            params.set('per_page', String(nextPerPage));
            params.set('page', '1');
        });

    useEffect(() => {
        const meta = response?.meta;
        if (!meta || meta.last_page <= 1) return;

        const pagesToPrefetch = getPagesToPrefetch(page, meta.last_page);
        for (const pageNumber of pagesToPrefetch) {
            const params = {
                ...baseParams,
                page: pageNumber,
            };

            if (type === 'import') {
                void queryClient.prefetchQuery({
                    queryKey: trackingKeys.imports.list(params),
                    queryFn: () => trackingApi.getImports(params),
                    staleTime: 5 * 60 * 1000,
                });
            } else {
                void queryClient.prefetchQuery({
                    queryKey: trackingKeys.exports.list(params),
                    queryFn: () => trackingApi.getExports(params),
                    staleTime: 5 * 60 * 1000,
                });
            }
        }
    }, [baseParams, page, queryClient, response?.meta, type]);

    const totalRecords = response?.meta?.total ?? data.length;
    const totalPages = response?.meta?.last_page ?? 1;
    const startItem = totalRecords === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, totalRecords);

    return (
        <div className="space-y-4">
            {/* Table Container */}
            <div
                className={`overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs transition-opacity duration-200 ${
                    isFetching ? 'opacity-70' : 'opacity-100'
                }`}
            >
                {/* Header row */}
                <div
                    className="grid gap-3 py-2.5 px-4 border-b border-border/80 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    style={{ gridTemplateColumns, minWidth: minGridWidth }}
                >
                    {renderHeaders()}
                </div>

                {/* Data rows */}
                <div>
                    {isLoading ? (
                        <div className="divide-y divide-border/40 p-4 space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-10 skeleton-shimmer rounded-md animate-pulse"
                                />
                            ))}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-4">
                            <EmptyState
                                label={`${type} transactions`}
                                message={`No ${type} transactions match your current query.`}
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {data.map((row, index) => {
                                const rowKey =
                                    (row as { id?: number; ref?: string }).id ??
                                    (row as { ref?: string }).ref ??
                                    index;
                                const referenceId = (row as { ref?: string }).ref;

                                return (
                                    <div
                                        key={rowKey}
                                        className="grid gap-3 py-2.5 px-4 items-center cursor-pointer transition-colors hover:bg-muted/50 text-xs"
                                        style={{ gridTemplateColumns, minWidth: minGridWidth }}
                                        onClick={() => {
                                            if (!referenceId) return;
                                            navigate(
                                                appRoutes.trackingDetail.replace(
                                                    ':referenceId',
                                                    encodeURIComponent(referenceId),
                                                ),
                                            );
                                        }}
                                    >
                                        {renderRow(
                                            row,
                                            index,
                                            navigate,
                                            (id, ref) => setCancelTarget({ id, ref }),
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalRecords > 0 && (
                <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-card shadow-xs">
                    <span className="text-xs font-medium text-muted-foreground">
                        Showing <strong className="font-semibold text-foreground">{startItem}–{endItem}</strong> of{' '}
                        <strong className="font-semibold text-foreground">{totalRecords}</strong> transactions
                    </span>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Rows per page</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(value) => {
                                    setPerPage(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[76px] text-xs bg-background">
                                    <SelectValue placeholder={String(perPage)} />
                                </SelectTrigger>
                                <SelectContent side="top" className="min-w-[76px]">
                                    {[15, 20, 50].map((option) => (
                                        <SelectItem
                                            key={option}
                                            value={String(option)}
                                            className="text-xs"
                                        >
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="First page"
                                onClick={() => setPage(1)}
                                disabled={page <= 1}
                                className="size-8"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Previous page"
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="size-8"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>
                            <span className="px-2 text-xs font-medium text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Next page"
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                                className="size-8"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Last page"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                                className="size-8"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Encode modal */}
            <EncodeModal
                isOpen={isEncodeOpen}
                onClose={() => setIsEncodeOpen(false)}
                type={type}
                onSave={async (data) => {
                    await createMutation.mutateAsync(
                        type === 'import'
                            ? (data as CreateImportPayload)
                            : (data as CreateExportPayload),
                    );
                }}
            />

            {/* Cancel modal */}
            <CancelTransactionModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                transactionRef={cancelTarget?.ref ?? ''}
                isLoading={cancelMutation.isPending}
                onConfirm={(reason) => {
                    if (cancelTarget) {
                        cancelMutation.mutate(
                            { id: cancelTarget.id, reason },
                            { onSuccess: () => setCancelTarget(null) },
                        );
                    }
                }}
            />
        </div>
    );
}
