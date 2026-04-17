import { Icon } from '../../../../components/Icon';
import type {
    AdminReviewDetailResponse,
    AdminReviewUploadedDocument,
    AdminReviewQueueItem,
    AdminReviewRemark,
    AdminReviewDocumentFile,
    AdminReviewRequiredDocument,
} from '../../types/document.types';
import { DetailSkeleton } from './AdminReviewShared';
import { STATUS_TONES, timeAgo } from './adminReview.utils';

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------

const SectionHeading = ({
    accentClassName,
    title,
    meta,
}: {
    accentClassName: string;
    title: string;
    meta?: string;
}) => (
    <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
            <div className={`h-3.5 w-1 rounded-full ${accentClassName}`} />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-secondary">{title}</h3>
        </div>
        {meta ? <p className="text-[11px] font-mono text-text-muted">{meta}</p> : null}
    </div>
);

const DocumentActions = ({
    file,
    typeKey,
    onPreview,
    onDownload,
}: {
    file: AdminReviewDocumentFile;
    typeKey: string;
    onPreview: (file: AdminReviewDocumentFile, typeKey: string) => void;
    onDownload: (file: AdminReviewDocumentFile) => void;
}) => (
        <div className="flex shrink-0 items-center gap-1.5">
            <button
                onClick={() => onPreview(file, typeKey)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                title="Preview"
            >
                <Icon name="eye" className="h-3.5 w-3.5" />
                Preview
            </button>
            <button
                onClick={() => onDownload(file)}
                className="inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
                title="Download"
            >
                <Icon name="download" className="h-3.5 w-3.5" />
            </button>
        </div>
);

// ---------------------------------------------------------------------------
// Sections — all live in the scrollable body
// ---------------------------------------------------------------------------

// ReadinessCard replaced with inline strip — see scrollable body usage

const DocumentChecklistSection = ({
    requiredDocuments,
    summary,
    onPreview,
    onDownload,
}: {
    requiredDocuments: AdminReviewRequiredDocument[];
    summary: AdminReviewDetailResponse['summary'];
    onPreview: (file: AdminReviewDocumentFile, typeKey: string) => void;
    onDownload: (file: AdminReviewDocumentFile) => void;
}) => (
    <section>
        <SectionHeading
            accentClassName="bg-blue-500"
            title="Document Checklist"
            meta={`${summary.required_completed}/${summary.required_total} required stages filled`}
        />
        <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
            {requiredDocuments.map((document) => {
                const files = normalizeRequiredDocumentFiles(document);
                const isMissing = !document.uploaded && !document.not_applicable;

                return (
                    <div
                        key={document.type_key}
                        className={`flex flex-col gap-3 px-4 py-3 ${
                            isMissing ? 'bg-red-500/5' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                                        document.uploaded
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : document.not_applicable
                                                ? 'bg-amber-500/10 text-amber-500'
                                                : 'bg-red-500/10 text-red-500'
                                    }`}
                                >
                                    <Icon
                                        name={document.uploaded ? 'check-circle' : document.not_applicable ? 'ban' : 'x'}
                                        className="h-3.5 w-3.5"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-sm font-semibold text-text-primary" title={document.label}>{document.label}</p>
                                    <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted" title={document.type_key}>
                                        {document.type_key}
                                    </span>
                                </div>
                            </div>
                            {document.not_applicable ? (
                                <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">
                                    N/A
                                </span>
                            ) : !document.uploaded ? (
                                <span className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                                    Missing
                                </span>
                            ) : null}
                        </div>

                        {files.length > 0 && (
                            <div className="pl-9 space-y-2">
                                {files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between gap-3 bg-surface-secondary/50 rounded-lg p-2.5 border border-border/50">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-text-primary" title={file.filename}>{file.filename}</p>
                                            <p className="truncate text-[10px] text-text-muted mt-0.5">
                                                {file.size}{file.uploaded_by ? ` · ${file.uploaded_by}` : ''}
                                            </p>
                                        </div>
                                        <DocumentActions file={file} typeKey={document.type_key} onPreview={onPreview} onDownload={onDownload} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </section>
);

const normalizeRequiredDocumentFiles = (document: AdminReviewRequiredDocument): AdminReviewDocumentFile[] => {
    if (!Array.isArray(document.files)) {
        return [];
    }

    return document.files.filter(
        (file): file is AdminReviewDocumentFile =>
            Boolean(file)
            && typeof file.id === 'number'
            && typeof file.filename === 'string'
            && typeof file.size === 'string',
    );
};

const toDocumentFile = (document: AdminReviewUploadedDocument): AdminReviewDocumentFile => ({
    id: document.id,
    filename: document.filename,
    size: document.size,
    uploaded_by: document.uploaded_by,
    uploaded_at: document.uploaded_at,
});

const AdditionalUploadsSection = ({
    documents,
    onPreview,
    onDownload,
}: {
    documents: AdminReviewUploadedDocument[];
    onPreview: (file: AdminReviewDocumentFile, typeKey: string) => void;
    onDownload: (file: AdminReviewDocumentFile) => void;
}) => {
    if (documents.length === 0) return null;

    return (
        <section>
            <SectionHeading
                accentClassName="bg-emerald-500"
                title="Additional Uploads"
                meta={`${documents.length} file${documents.length === 1 ? '' : 's'}`}
            />
            <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
                {documents.map((document) => (
                    <div
                        key={document.id}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-text-primary">{document.filename}</p>
                                <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                                    {document.label}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-text-secondary">
                                {document.size}
                                {document.uploaded_by ? ` · Uploaded by ${document.uploaded_by}` : ''}
                                {document.uploaded_at ? ` · ${timeAgo(document.uploaded_at)}` : ''}
                            </p>
                        </div>
                        <DocumentActions
                            file={toDocumentFile(document)}
                            typeKey={document.type_key}
                            onPreview={onPreview}
                            onDownload={onDownload}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

const RemarksSection = ({ remarks }: { remarks: AdminReviewRemark[] }) => {
    const openRemarks = remarks.filter((r) => !r.resolved);
    const resolvedRemarks = remarks.filter((r) => r.resolved);

    return (
        <section>
            <SectionHeading
                accentClassName="bg-red-500"
                title="Remarks & Exceptions"
                meta={`${openRemarks.length} open`}
            />
            {remarks.length === 0 ? (
                <p className="text-[11px] italic text-text-muted">No remarks recorded for this transaction.</p>
            ) : (
                <div className="space-y-2.5">
                    {openRemarks.map((remark) => (
                        <div key={remark.id} className="rounded-xl border border-red-500/15 bg-red-500/5 px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-600">
                                    Open
                                </span>
                                <span className="text-xs text-text-muted">
                                    {remark.author} · {timeAgo(remark.created_at)}
                                </span>
                            </div>
                            <p className="mt-2.5 text-sm leading-relaxed text-text-primary">{remark.body}</p>
                        </div>
                    ))}
                    {resolvedRemarks.map((remark) => (
                        <div key={remark.id} className="rounded-xl border border-border bg-surface px-5 py-4 opacity-70">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                                    Resolved
                                </span>
                                <span className="text-xs text-text-muted">
                                    {remark.author} · {timeAgo(remark.created_at)}
                                </span>
                            </div>
                            <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">{remark.body}</p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

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
    onPreview: (file: AdminReviewDocumentFile, typeKey: string) => void;
    onDownload: (file: AdminReviewDocumentFile) => void;
}) => {
    if (!selectedTransaction) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-text-muted">
                    <Icon name="file-text" className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-text-primary">Document Audit Panel</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
                    Select a transaction from the queue to inspect its documents, requirements, and compliance remarks.
                </p>
            </div>
        );
    }

    if (isDetailLoading) return <DetailSkeleton />;

    if (isDetailError || !detailData) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                <p className="text-sm font-medium text-red-500">Failed to load the transaction audit detail.</p>
                <button onClick={onRetry} className="mt-3 text-xs font-semibold text-blue-500 hover:underline">
                    Retry
                </button>
            </div>
        );
    }

    const summary = detailData.summary;
    const isArchiveReady = summary.archive_ready;

    const requiredFileIds = new Set(
        detailData.required_documents
            .flatMap((document) => normalizeRequiredDocumentFiles(document))
            .map((file) => file.id),
    );
    const additionalUploads = detailData.uploaded_documents.filter((d) => d.type_key === 'others' || !requiredFileIds.has(d.id));

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/*
             * ┌─────────────────────────────────────────────────────────┐
             * │  COMPACT FIXED HEADER — identity + action bar only      │
             * │  Target: ≈ 100–115px tall. Nothing more lives here.     │
             * └─────────────────────────────────────────────────────────┘
             */}
            <div
                className="flex-none border-b border-border bg-surface px-5 py-4 xl:px-6"
                data-testid="admin-review-detail-header"
            >
                {/* Row 1 — identity + actions pinned right */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate font-mono text-xl font-bold tracking-tight text-text-primary">
                            {detailData.transaction.bl_number ?? detailData.transaction.ref}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <p className="text-sm font-medium text-text-secondary">
                                {detailData.transaction.client ?? 'Unknown client'}
                            </p>
                            <span className="font-mono text-xs text-text-muted">{detailData.transaction.ref}</span>
                            <span className="text-xs text-text-muted">
                                {detailData.transaction.assigned_user ?? 'Unassigned'}
                            </span>
                        </div>
                    </div>

                    {/* Archive action — only action unique to this review pane */}
                    <div className="flex shrink-0 items-center">
                        <button
                            type="button"
                            onClick={onArchive}
                            disabled={!isArchiveReady || isArchiving}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                isArchiveReady
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-500/70'
                                    : 'cursor-not-allowed border border-border bg-surface text-text-muted'
                            }`}
                        >
                            <Icon name="archive" className="h-3.5 w-3.5" />
                            {isArchiving ? 'Archiving…' : 'Move to Archive'}
                        </button>
                    </div>
                </div>

                {/* Row 2 — status + finalized only (type & readiness already shown in queue selection) */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${(STATUS_TONES[detailData.transaction.status.toLowerCase()] ?? STATUS_TONES.completed).text} ${(STATUS_TONES[detailData.transaction.status.toLowerCase()] ?? STATUS_TONES.completed).bg}`}>
                        {detailData.transaction.status}
                    </span>
                    <span className="rounded border border-border bg-background px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                        Finalized {timeAgo(detailData.transaction.finalized_date)}
                    </span>
                </div>

                {archiveError ? (
                    <p className="mt-2 text-xs font-medium text-red-500">{archiveError}</p>
                ) : null}
            </div>

            {/*
             * ┌─────────────────────────────────────────────────────────┐
             * │  SCROLLABLE BODY — everything else lives here           │
             * └─────────────────────────────────────────────────────────┘
             */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 xl:px-6 xl:py-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    {/* Left column — document checklist (full width when no remarks/extras) */}
                    <div className="min-w-0 flex-1">
                        <DocumentChecklistSection
                            requiredDocuments={detailData.required_documents}
                            summary={detailData.summary}
                            onPreview={onPreview}
                            onDownload={onDownload}
                        />
                    </div>

                    {/* Right column — only renders when there is content to show */}
                    {(detailData.remarks.length > 0 || additionalUploads.length > 0) && (
                        <div className="lg:w-72 lg:shrink-0 space-y-5">
                            <RemarksSection remarks={detailData.remarks} />
                            <AdditionalUploadsSection
                                documents={additionalUploads}
                                onPreview={onPreview}
                                onDownload={onDownload}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
