import { startTransition, useDeferredValue, useState } from 'react';

import { useTransactionSyncSubscription } from '../../../../hooks/useTransactionSyncSubscription';
import { useDebounce } from '../../../../hooks/useDebounce';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { useDocumentPreview } from '../../../tracking/hooks/useDocumentPreview';

import { useEncoders } from '../../../oversight/hooks/useTransactions';
import {
    useArchiveReviewedTransaction,
    useArchiveReviewedTransactions,
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
    const bulkArchiveMutation = useArchiveReviewedTransactions();
    const encodersQuery = useEncoders();
    const encoderOptions = encodersQuery.data ?? [];
    const [bulkArchiveError, setBulkArchiveError] = useState<string | null>(null);
    const [archivingGroupKey, setArchivingGroupKey] = useState<string | null>(null);

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
        setBulkArchiveError(null);
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

    const handleArchiveGroup = (groupKey: string, transactions: AdminReviewQueueItem[]) => {
        if (transactions.length === 0 || transactions.some((transaction) => !transaction.archive_ready)) {
            setBulkArchiveError('All transactions in the vessel group must be ready before sending to records.');
            return;
        }

        setArchiveError(null);
        setBulkArchiveError(null);
        setArchivingGroupKey(groupKey);
        bulkArchiveMutation.mutate(
            {
                transactions: transactions.map((transaction) => ({
                    id: transaction.id,
                    type: transaction.type,
                })),
            },
            {
                onSuccess: () => {
                    setSelectedReview(null);
                    setBulkArchiveError(null);
                },
                onError: (error) => {
                    setBulkArchiveError(extractErrorMessage(error, 'Failed to send vessel group to records.'));
                    void queueQuery.refetch();
                },
                onSettled: () => {
                    setArchivingGroupKey(null);
                },
            },
        );
    };

    const isSplitView = selectedTransaction !== null;

    return (
        <div className={`${isSplitView ? 'flex flex-col xl:absolute xl:inset-0 xl:overflow-hidden' : 'min-h-screen'} bg-background font-sans selection:bg-primary selection:text-primary-foreground`}>
            <div className={`relative z-10 ${isSplitView ? 'flex flex-col xl:h-full' : ''}`}>
                <main className={`${isSplitView ? 'flex w-full flex-1 flex-col p-0 xl:min-h-0' : 'w-full space-y-4 pb-8 pt-1 p-0'} text-foreground`}>
                    {!isSplitView ? (
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Documents</h1>
                            <p className="text-sm text-muted-foreground">
                                Review finalized brokerage transactions, check document readiness, and send complete records into the archive.
                            </p>
                        </div>
                    ) : null}
                    <div
                        data-testid="admin-review-split-grid"
                        className={`grid ${
                            isSplitView
                                ? 'grid-cols-1 min-h-0 flex-1 xl:grid-cols-[minmax(26rem,0.9fr)_minmax(36rem,1.1fr)] xl:overflow-hidden'
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
                            onArchiveGroup={handleArchiveGroup}
                            archivingGroupKey={archivingGroupKey}
                            bulkArchiveError={bulkArchiveError}
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
                                className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-surface"
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
        </div>
    );
};
