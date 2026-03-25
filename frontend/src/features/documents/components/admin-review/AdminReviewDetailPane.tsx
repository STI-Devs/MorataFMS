import { Icon } from '../../../../components/Icon';
import type {
    AdminReviewDetailResponse,
    AdminReviewQueueItem,
    AdminReviewRemark,
    AdminReviewRequiredDocument,
} from '../../types/document.types';
import { DetailSkeleton, DocumentMeta, SummaryCard } from './AdminReviewShared';
import { STATUS_TONES, timeAgo, TYPE_TONES } from './adminReview.utils';

const RequiredDocumentsSection = ({
    requiredDocuments,
    onPreview,
    onDownload,
}: {
    requiredDocuments: AdminReviewRequiredDocument[];
    onPreview: (document: AdminReviewRequiredDocument) => void;
    onDownload: (document: AdminReviewRequiredDocument) => void;
}) => (
    <section>
        <div className="mb-4 flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">
                Required Documents
            </h3>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {requiredDocuments.map((document, index) => (
                <div
                    key={document.type_key}
                    className={`flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center ${
                        index !== requiredDocuments.length - 1 ? 'border-b border-border' : ''
                    } ${!document.uploaded ? 'bg-red-500/5' : ''}`}
                >
                    <div className="flex min-w-0 items-start gap-3">
                        {document.uploaded ? (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
                                <Icon name="check-circle" className="h-4 w-4" />
                            </div>
                        ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-500/10 text-red-500">
                                <Icon name="x" className="h-4 w-4" />
                            </div>
                        )}

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-text-primary">{document.label}</p>
                                <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                                    {document.type_key}
                                </span>
                            </div>
                            {document.file ? (
                                <DocumentMeta file={document.file} />
                            ) : (
                                <p className="mt-1 text-xs text-red-500">No uploaded file found for this required slot.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {document.file ? (
                            <>
                                <button
                                    onClick={() => onPreview(document)}
                                    className="rounded p-2 text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                                    title="Preview"
                                >
                                    <Icon name="eye" className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onDownload(document)}
                                    className="rounded p-2 text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                                    title="Download"
                                >
                                    <Icon name="download" className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
                                Missing
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </section>
);

const RemarksSection = ({ remarks }: { remarks: AdminReviewRemark[] }) => {
    const openRemarks = remarks.filter((remark) => !remark.resolved);
    const resolvedRemarks = remarks.filter((remark) => remark.resolved);

    return (
        <section>
            <div className="mb-4 flex items-center gap-3">
                <div className="h-4 w-1 rounded-full bg-red-500" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">
                    Remarks & Exceptions
                </h3>
            </div>

            {remarks.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">
                    No remarks have been recorded for this transaction.
                </div>
            ) : (
                <div className="space-y-3">
                    {openRemarks.map((remark) => (
                        <div key={remark.id} className="rounded-lg border border-red-500/15 bg-red-500/5 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-sm border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                                    Open
                                </span>
                                <span className="text-xs text-text-muted">
                                    {remark.author} · {timeAgo(remark.created_at)}
                                </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-text-primary">{remark.body}</p>
                        </div>
                    ))}

                    {resolvedRemarks.map((remark) => (
                        <div key={remark.id} className="rounded-lg border border-border bg-surface p-4 opacity-70">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-sm border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                    Resolved
                                </span>
                                <span className="text-xs text-text-muted">
                                    {remark.author} · {timeAgo(remark.created_at)}
                                </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{remark.body}</p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export const AdminReviewDetailPane = ({
    selectedTransaction,
    detailData,
    archiveError,
    isDetailLoading,
    isDetailError,
    isArchiving,
    onRetry,
    onArchive,
    onPreview,
    onDownload,
}: {
    selectedTransaction: AdminReviewQueueItem | null;
    detailData: AdminReviewDetailResponse | undefined;
    archiveError: string | null;
    isDetailLoading: boolean;
    isDetailError: boolean;
    isArchiving: boolean;
    onRetry: () => void;
    onArchive: () => void;
    onPreview: (document: AdminReviewRequiredDocument) => void;
    onDownload: (document: AdminReviewRequiredDocument) => void;
}) => {
    if (!selectedTransaction) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-text-muted">
                    <Icon name="file-text" className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Document Audit Panel</h3>
                <p className="mt-2 max-w-md text-sm text-text-secondary">
                    Select a finalized transaction from the queue to inspect uploaded documents, missing requirements,
                    and open compliance remarks.
                </p>
            </div>
        );
    }

    if (isDetailLoading) {
        return <DetailSkeleton />;
    }

    if (isDetailError || !detailData) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <p className="text-sm font-medium text-red-500">Failed to load the transaction audit detail.</p>
                <button onClick={onRetry} className="mt-3 text-xs font-semibold text-blue-500 hover:underline">
                    Retry
                </button>
            </div>
        );
    }

    const summary = detailData.summary;
    const requiredDocuments = detailData.required_documents;
    const remarks = detailData.remarks;
    const hasMissingDocs = summary.missing_count > 0;
    const hasExceptions = summary.flagged_count > 0;
    const isArchiveReady = summary.archive_ready;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-col gap-4 border-b border-border bg-surface p-6 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h2 className="text-2xl font-mono font-bold tracking-tight text-text-primary">
                        {detailData.transaction.bl_number ?? detailData.transaction.ref}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-text-secondary">
                            {detailData.transaction.client ?? 'Unknown client'}
                        </p>
                        <span className="border-l border-border pl-2 text-xs font-mono text-text-muted">
                            {detailData.transaction.ref}
                        </span>
                        <span className="border-l border-border pl-2 text-xs text-text-muted">
                            {detailData.transaction.assigned_user ?? 'Unassigned'}
                        </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${TYPE_TONES[detailData.transaction.type].text} ${TYPE_TONES[detailData.transaction.type].bg}`}>
                            {detailData.transaction.type}
                        </span>
                        <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${(STATUS_TONES[detailData.transaction.status.toLowerCase()] ?? STATUS_TONES.completed).text} ${(STATUS_TONES[detailData.transaction.status.toLowerCase()] ?? STATUS_TONES.completed).bg}`}>
                            {detailData.transaction.status}
                        </span>
                        <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                            Finalized {timeAgo(detailData.transaction.finalized_date)}
                        </span>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-background px-4 py-3 xl:min-w-[14rem]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Archive Status</p>
                    <p className={`mt-2 text-lg font-bold ${isArchiveReady ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isArchiveReady ? 'Ready for Archive' : 'Needs Review'}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                        {isArchiveReady
                            ? 'All required document slots are filled and no open remarks remain.'
                            : 'Resolve missing documents and open remarks before archiving.'}
                    </p>
                    <button
                        type="button"
                        onClick={onArchive}
                        disabled={!isArchiveReady || isArchiving}
                        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                            isArchiveReady
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-500/70'
                                : 'cursor-not-allowed border border-border bg-surface text-text-muted'
                        }`}
                    >
                        <Icon name="archive" className="h-4 w-4" />
                        {isArchiving ? 'Archiving...' : 'Move to Archive'}
                    </button>
                    {archiveError ? (
                        <p className="mt-2 text-xs font-medium text-red-500">{archiveError}</p>
                    ) : null}
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                    <SummaryCard label="Uploaded Files" value={summary.total_uploaded} />
                    <SummaryCard label="Required Done" value={summary.required_completed} />
                    <SummaryCard label="Required Total" value={summary.required_total} />
                    <SummaryCard label="Missing Docs" value={summary.missing_count} />
                    <SummaryCard label="Open Remarks" value={summary.flagged_count} />
                </div>

                {hasMissingDocs ? (
                    <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                        <Icon name="alert-circle" className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                            <p className="text-sm font-bold text-amber-600">Missing Required Documents</p>
                            <p className="mt-1 text-sm text-amber-700/80">
                                This file is not archive-ready until every required document slot has at least one upload.
                            </p>
                        </div>
                    </div>
                ) : null}

                {hasExceptions ? (
                    <div className="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                        <Icon name="flag" className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div>
                            <p className="text-sm font-bold text-red-600">Open Compliance Remarks</p>
                            <p className="mt-1 text-sm text-red-700/80">
                                Outstanding remarks still need resolution before the transaction can be archived.
                            </p>
                        </div>
                    </div>
                ) : null}

                <RequiredDocumentsSection
                    requiredDocuments={requiredDocuments}
                    onPreview={onPreview}
                    onDownload={onDownload}
                />

                <RemarksSection remarks={remarks} />
            </div>
        </div>
    );
};
