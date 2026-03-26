import { startTransition, useDeferredValue, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { useDebounce } from '../../../../hooks/useDebounce';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { useDocumentPreview } from '../../../tracking/hooks/useDocumentPreview';
import { appRoutes } from '../../../../lib/appRoutes';
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
    AdminReviewRequiredDocument,
    AdminReviewStatusFilter,
    AdminReviewTypeFilter,
} from '../../types/document.types';
import { AdminReviewDetailPane } from './AdminReviewDetailPane';
import { AdminReviewQueuePane } from './AdminReviewQueuePane';
import { KpiMetric } from './AdminReviewShared';
import {
    extractErrorMessage,
    matchesSelection,
    type ReviewSelection,
    toPreviewDocument,
} from './adminReview.utils';

export const AdminDocumentReview = () => {
    const navigate = useNavigate();
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
    const detailQuery = useReviewDetail(
        selectedTransaction?.type ?? null,
        selectedTransaction?.id ?? null,
    );

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

    const handlePreview = async (document: AdminReviewRequiredDocument) => {
        const previewDocument = toPreviewDocument(document);

        if (!previewDocument) {
            return;
        }

        await handlePreviewDoc(previewDocument);
    };

    const handleDownload = async (document: AdminReviewRequiredDocument) => {
        if (!document.file) {
            return;
        }

        await trackingApi.downloadDocument(document.file.id, document.file.filename);
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
        <div className="flex h-full flex-col -m-6">
            <header className="flex-none border-b border-border bg-background px-6 py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">
                            Audit & Compliance
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                            Admin Document Review
                        </h1>
                        <p className="mt-2 text-sm text-text-secondary">
                            Verify finalized import and export files before they move into the archive.
                        </p>
                    </div>
                    <CurrentDateTime
                        className="text-left sm:text-right"
                        timeClassName="text-xl font-mono font-bold tracking-tight text-text-primary"
                        dateClassName="mt-1 text-[11px] font-mono uppercase tracking-[0.2em] text-text-secondary"
                    />
                </div>
            </header>

            <div className="grid flex-none grid-cols-2 border-b border-border md:grid-cols-4">
                <KpiMetric
                    title="Completed Files"
                    value={statsQuery.data?.completed_count ?? '—'}
                    isLoading={statsQuery.isLoading}
                />
                <KpiMetric
                    title="Cancelled Files"
                    value={statsQuery.data?.cancelled_count ?? '—'}
                    isLoading={statsQuery.isLoading}
                />
                <KpiMetric
                    title="Missing Final Docs"
                    value={statsQuery.data?.missing_docs_count ?? '—'}
                    tone="warning"
                    isLoading={statsQuery.isLoading}
                />
                <KpiMetric
                    title="Archive Ready"
                    value={statsQuery.data?.archive_ready_count ?? '—'}
                    tone="success"
                    isLoading={statsQuery.isLoading}
                />
            </div>

            <main className="flex min-h-0 flex-1 flex-col bg-background text-text-primary lg:flex-row">
                <AdminReviewQueuePane
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

                <div className="flex min-h-[28rem] flex-1 flex-col bg-background">
                    <AdminReviewDetailPane
                        selectedTransaction={selectedTransaction}
                        detailData={detailQuery.data}
                        archiveError={archiveError}
                        isDetailLoading={detailQuery.isLoading}
                        isDetailError={detailQuery.isError}
                        isArchiving={archiveMutation.isPending}
                        onRetry={() => {
                            void detailQuery.refetch();
                        }}
                        onArchive={handleArchive}
                        onPreview={(document) => {
                            void handlePreview(document);
                        }}
                        onDownload={(document) => {
                            void handleDownload(document);
                        }}
                        onOpenTransaction={() => {
                            if (!selectedTransaction) {
                                return;
                            }

                            navigate(
                                generatePath(appRoutes.documentDetail, {
                                    ref: selectedTransaction.ref,
                                }),
                                {
                                    state: {
                                        backTo: appRoutes.adminDocumentReview,
                                        backLabel: 'Back to Admin Review',
                                    },
                                },
                            );
                        }}
                    />
                </div>
            </main>
        </div>
    );
};
