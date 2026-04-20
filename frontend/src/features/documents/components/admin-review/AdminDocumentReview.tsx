import { startTransition, useDeferredValue, useState } from 'react';

import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { useTransactionSyncSubscription } from '../../../../hooks/useTransactionSyncSubscription';
import { useDebounce } from '../../../../hooks/useDebounce';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { useDocumentPreview } from '../../../tracking/hooks/useDocumentPreview';

import { useEncoders } from '../../../oversight/hooks/useTransactions';
import {
    useArchiveReviewedTransaction,
    useReviewDetail,
    useReviewQueue,
    useReviewStats,
} from '../../hooks/useAdminReview';
import type {
    AdminReviewQueueItem,
    AdminReviewReadinessFilter,
    AdminReviewDocumentFile,
    AdminReviewStatusFilter,
    AdminReviewTypeFilter,
    AdminReviewStats,
} from '../../types/document.types';
import { AdminReviewDetailPane } from './AdminReviewDetailPane';
import { AdminReviewQueuePane } from './AdminReviewQueuePane';
import {
    extractErrorMessage,
    matchesSelection,
    type ReviewSelection,
    toPreviewDocument,
} from './adminReview.utils';

export const AdminDocumentReview = () => {

    const [selectedReview, setSelectedReview] = useState<ReviewSelection | null>(null);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<AdminReviewTypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<AdminReviewStatusFilter>('all');
    const [readinessFilter, setReadinessFilter] = useState<AdminReviewReadinessFilter>('all');
    const [assignedUserIdFilter, setAssignedUserIdFilter] = useState<number | 'all'>('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const deferredSearchQuery = useDeferredValue(searchQuery);
    const debouncedSearch = useDebounce(deferredSearchQuery, 300);
    const { handlePreviewDoc } = useDocumentPreview();
    const archiveMutation = useArchiveReviewedTransaction();
    const encodersQuery = useEncoders();
    const encoderOptions = (encodersQuery.data ?? []).filter((user) => user.role === 'encoder');

    const queueQuery = useReviewQueue({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        type: typeFilter,
        status: statusFilter,
        readiness: readinessFilter,
        assigned_user_id: assignedUserIdFilter === 'all' ? undefined : assignedUserIdFilter,
    });
    const statsQuery = useReviewStats();

    const transactions = queueQuery.data?.data ?? [];
    const selectedTransaction =
        transactions.find((transaction) => matchesSelection(selectedReview, transaction)) ?? null;
    const reviewStats: AdminReviewStats | undefined = statsQuery.data;
    const detailQuery = useReviewDetail(
        selectedTransaction?.type ?? null,
        selectedTransaction?.id ?? null,
    );

    useTransactionSyncSubscription({
        type: selectedTransaction?.type ?? null,
        id: selectedTransaction?.id ?? null,
        reference: selectedTransaction?.ref ?? null,
        enabled: selectedTransaction !== null,
    });

    const resetArchiveState = () => {
        setArchiveError(null);
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        resetArchiveState();
        startTransition(() => {
            setPage(1);
        });
    };

    const handleTypeFilterChange = (value: AdminReviewTypeFilter) => {
        resetArchiveState();
        startTransition(() => {
            setTypeFilter(value);
            setPage(1);
        });
    };

    const handleStatusFilterChange = (value: AdminReviewStatusFilter) => {
        resetArchiveState();
        startTransition(() => {
            setStatusFilter(value);
            setPage(1);
        });
    };

    const handleReadinessFilterChange = (value: AdminReviewReadinessFilter) => {
        resetArchiveState();
        startTransition(() => {
            setReadinessFilter(value);
            setPage(1);
        });
    };

    const handleAssignedUserFilterChange = (value: number | 'all') => {
        resetArchiveState();
        startTransition(() => {
            setAssignedUserIdFilter(value);
            setPage(1);
        });
    };

    const handleResetFilters = () => {
        resetArchiveState();
        startTransition(() => {
            setTypeFilter('all');
            setStatusFilter('all');
            setReadinessFilter('all');
            setAssignedUserIdFilter('all');
            setPage(1);
        });
    };

    const handleSelectTransaction = (
        transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>,
    ) => {
        resetArchiveState();
        startTransition(() => {
            setSelectedReview({
                id: transaction.id,
                type: transaction.type,
            });
        });
    };

    const handlePreview = async (file: AdminReviewDocumentFile, typeKey: string) => {
        const previewDocument = toPreviewDocument(file, typeKey);

        if (!previewDocument) {
            return;
        }

        await handlePreviewDoc(previewDocument);
    };

    const handleDownload = async (file: AdminReviewDocumentFile) => {
        await trackingApi.downloadDocument(file.id, file.filename);
    };

    const handleArchive = () => {
        if (!selectedTransaction || !detailQuery.data?.summary.archive_ready) {
            return;
        }

        setArchiveError(null);
        archiveMutation.mutate(
            {
                type: selectedTransaction.type,
                id: selectedTransaction.id,
            },
            {
                onSuccess: () => {
                    setSelectedReview(null);
                    setArchiveError(null);
                },
                onError: (error) => {
                    setArchiveError(extractErrorMessage(error));
                },
            },
        );
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-background overflow-hidden">
            <header className="flex-none px-6 pt-4 pb-3">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                            Completed Transactions Overview
                        </h1>
                        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
                            Inspect completed brokerage transactions, resolve exceptions, and manage records readiness.
                        </p>
                    </div>
                    <CurrentDateTime
                        className="text-right"
                        timeClassName="text-xl font-mono font-bold tracking-tight text-text-primary"
                        dateClassName="mt-0.5 text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary"
                    />
                </div>
            </header>

            <main className="min-h-0 flex-1 px-6 pb-6 text-text-primary">
                <div
                    className={`grid h-full min-h-0 gap-4 ${
                        selectedTransaction
                            ? '2xl:grid-cols-[minmax(28rem,0.82fr)_minmax(46rem,1.18fr)] xl:grid-cols-[minmax(26rem,0.9fr)_minmax(36rem,1.1fr)]'
                            : 'grid-cols-1'
                    }`}
                >
                    <AdminReviewQueuePane
                        summary={reviewStats}
                        isSummaryLoading={statsQuery.isLoading}
                        expanded={!selectedTransaction}
                        searchQuery={searchQuery}
                        typeFilter={typeFilter}
                        statusFilter={statusFilter}
                        readinessFilter={readinessFilter}
                        assignedUserIdFilter={assignedUserIdFilter}
                        assignedUsers={encoderOptions}
                        debouncedSearch={debouncedSearch}
                        selection={selectedReview}
                        transactions={transactions}
                        queueData={queueQuery.data}
                        isLoading={queueQuery.isLoading}
                        isError={queueQuery.isError}
                        isFetching={queueQuery.isFetching}
                        onSearchChange={handleSearchChange}
                        onTypeFilterChange={handleTypeFilterChange}
                        onStatusFilterChange={handleStatusFilterChange}
                        onReadinessFilterChange={handleReadinessFilterChange}
                        onAssignedUserFilterChange={handleAssignedUserFilterChange}
                        onRetry={() => {
                            void queueQuery.refetch();
                        }}
                        onSelect={handleSelectTransaction}
                        onResetFilters={handleResetFilters}
                        onPageChange={(nextPage) => {
                            startTransition(() => {
                                setPage(nextPage);
                            });
                        }}
                        onPerPageChange={(nextPerPage) => {
                            startTransition(() => {
                                setPerPage(nextPerPage);
                                setPage(1);
                            });
                        }}
                    />

                    {selectedTransaction ? (
                        <div
                            className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
                            data-testid="admin-review-workspace"
                        >
                            <AdminReviewDetailPane
                                selectedTransaction={selectedTransaction}
                                detailData={detailQuery.data}
                                archiveError={archiveError}
                                isDetailLoading={detailQuery.isLoading}
                                isDetailError={detailQuery.isError}
                                isArchiving={archiveMutation.isPending}
                                onClearSelection={() => {
                                    setSelectedReview(null);
                                    setArchiveError(null);
                                }}
                                onRetry={() => {
                                    void detailQuery.refetch();
                                }}
                                onArchive={handleArchive}
                                onPreview={(file, typeKey) => {
                                    void handlePreview(file, typeKey);
                                }}
                                onDownload={(file) => {
                                    void handleDownload(file);
                                }}
                            />
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
};
