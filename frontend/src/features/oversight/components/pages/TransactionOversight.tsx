import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import type { SortDirection } from '../../../../components/data-table/DataTableColumnHeader';
import { EmptyState } from '../../../../components/EmptyState';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { useOversightWorkspace } from '../../hooks/useOversightWorkspace';
import { TransactionDetailDrawer } from '../details/TransactionDetailDrawer';
import { DeleteCancelledTransactionModal } from '../modals/DeleteCancelledTransactionModal';
import { RemarkModal } from '../modals/RemarkModal';
import { StatusOverrideModal } from '../modals/StatusOverrideModal';
import { OversightHeader } from './OversightHeader';
import { OversightKpiCards } from './OversightKpiCards';
import { OversightPagination } from './OversightPagination';
import { OversightSkeleton } from './OversightSkeleton';
import { OversightTable } from './OversightTable';
import { OversightToolbar, type ViewMode } from './OversightToolbar';

export const TransactionOversight = () => {
    const ws = useOversightWorkspace();
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>(null);

    const sortedTransactions = useMemo(() => {
        if (!sortKey || !sortDir) return ws.transactions;
        return [...ws.transactions].sort((a, b) => {
            let valA = '';
            let valB = '';
            if (sortKey === 'reference') {
                valA = a.reference_no || a.bl_no || '';
                valB = b.reference_no || b.bl_no || '';
            } else if (sortKey === 'client') {
                valA = a.client || '';
                valB = b.client || '';
            } else if (sortKey === 'vessel') {
                valA = a.vessel || '';
                valB = b.vessel || '';
            } else if (sortKey === 'status') {
                valA = a.status || '';
                valB = b.status || '';
            } else if (sortKey === 'date') {
                valA = a.date || a.created_at || '';
                valB = b.date || b.created_at || '';
            }
            const cmp = valA.localeCompare(valB);
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [ws.transactions, sortKey, sortDir]);

    const handleSort = (key: string, dir: SortDirection) => {
        setSortKey(dir ? key : null);
        setSortDir(dir);
    };

    if (ws.isLoading) {
        return <OversightSkeleton />;
    }

    if (ws.isError) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load transactions. Please try again.
                </p>
                <Button variant="outline" onClick={() => ws.refetch()}>
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    if (ws.transactions.length === 0) {
        const hasActiveFilters =
            ws.searchTerm.trim() !== '' || ws.typeFilter !== 'all' || ws.statusFilter !== 'all';
        return (
            <Card>
                <EmptyState
                    label="transactions"
                    message={
                        hasActiveFilters
                            ? 'No transactions match your filters.'
                            : 'No transactions found.'
                    }
                />
            </Card>
        );
    }

    return (
        <div className="w-full space-y-4 pb-6">
            <OversightHeader />
            <OversightKpiCards stats={ws.stats} />

            <div className="flex flex-col gap-3">
                <OversightToolbar
                    searchTerm={ws.searchTerm}
                    onSearchChange={ws.setSearchTerm}
                    typeFilter={ws.typeFilter}
                    onTypeChange={ws.setTypeFilter}
                    statusFilter={ws.statusFilter}
                    onStatusChange={ws.setStatusFilter}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    resultCount={ws.stats.total}
                    onReset={() => {
                        ws.setSearchTerm('');
                        ws.setTypeFilter('all');
                        ws.setStatusFilter('all');
                        setSortKey(null);
                        setSortDir(null);
                    }}
                />

                <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                    <OversightTable
                        transactions={sortedTransactions}
                        groups={ws.groups}
                        expandedGroups={ws.expandedGroups}
                        toggleGroup={ws.toggleGroup}
                        viewMode={viewMode}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                        onSelectTransaction={ws.setDetailTarget}
                        onStatus={ws.setStatusTarget}
                        onRemarks={ws.setRemarkTarget}
                        onDelete={ws.handleDelete}
                        onVesselFilter={(vessel) => ws.setSearchTerm(vessel)}
                        deletingTargetKey={ws.deletingTargetKey}
                    />
                    {ws.meta && ws.meta.last_page > 1 ? (
                        <div className="border-t border-border">
                            <OversightPagination
                                currentPage={ws.page}
                                totalPages={ws.meta.last_page}
                                perPage={ws.perPage}
                                totalRecords={ws.meta.total_records}
                                onPageChange={ws.setPage}
                                onPerPageChange={(value) => {
                                    ws.setPerPage(value);
                                    ws.setPage(1);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                            Showing {ws.transactions.length} of {ws.stats.total} transactions
                        </div>
                    )}
                </div>
            </div>

            <StatusOverrideModal
                isOpen={!!ws.statusTarget}
                onClose={() => ws.setStatusTarget(null)}
                transaction={ws.statusTarget}
                onSuccess={ws.handleStatusSuccess}
            />
            <RemarkModal
                isOpen={!!ws.remarkTarget}
                onClose={() => ws.setRemarkTarget(null)}
                transactionType={ws.remarkTarget?.type ?? 'import'}
                transactionId={ws.remarkTarget?.id ?? null}
                transactionLabel={`${ws.remarkTarget?.type === 'import' ? 'Import' : 'Export'} — ${ws.remarkTarget?.bl_no || ws.remarkTarget?.reference_no || `#${ws.remarkTarget?.id}`}`}
            />
            <TransactionDetailDrawer
                transaction={ws.detailTarget}
                onClose={() => ws.setDetailTarget(null)}
            />
            {ws.deleteTarget && (
                <DeleteCancelledTransactionModal
                    transaction={ws.deleteTarget}
                    open={!!ws.deleteTarget}
                    onCancel={() => ws.setDeleteTarget(null)}
                    onConfirm={() => ws.confirmDelete()}
                />
            )}
        </div>
    );
};
