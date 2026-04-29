import { useDeferredValue, useState } from 'react';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import {
    useLegalArchive,
    useLegalCatalog,
} from '../../hooks/useLegalWorkspace';
import type {
    LegalDigitalStatus,
    LegalFileCategoryCode,
} from '../../types/legalRecords.types';

const ALL_CATEGORIES = 'all';
const ALL_STATUSES = 'all';
const PAGE_SIZE_OPTIONS = [12, 25, 50, 100] as const;

const SummaryCard = ({ label, value, description }: { label: string; value: string; description: string }) => (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
        <p className="mt-1.5 text-sm text-text-muted">{description}</p>
    </div>
);

const STATUS_STYLES: Record<LegalDigitalStatus, string> = {
    missing_upload: 'border-amber-200 bg-amber-50 text-amber-700',
    uploaded: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const formatDate = (value: string | null) => {
    if (! value) {
        return 'No document date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
};

const UploadStatusBadge = ({ status }: { status: LegalDigitalStatus }) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
        {status === 'uploaded' ? 'Uploaded' : 'Pending Upload'}
    </span>
);

export const LegalArchiveRecordsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
    const [uploadStatusFilter, setUploadStatusFilter] = useState<string>(ALL_STATUSES);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(12);

    const deferredSearchTerm = useDeferredValue(searchTerm);
    const catalogQuery = useLegalCatalog();
    const archiveQuery = useLegalArchive({
        search: deferredSearchTerm.trim() || undefined,
        file_category:
            categoryFilter !== ALL_CATEGORIES
                ? categoryFilter as LegalFileCategoryCode
                : undefined,
        upload_status:
            uploadStatusFilter !== ALL_STATUSES
                ? uploadStatusFilter as LegalDigitalStatus
                : undefined,
        page,
        per_page: perPage,
    });
    const pendingUploadsQuery = useLegalArchive({
        upload_status: 'missing_upload',
        page: 1,
        per_page: 1,
    });

    const categories = catalogQuery.data?.legal_file_categories ?? [];
    const records = archiveQuery.data?.data ?? [];
    const pagination = archiveQuery.data?.meta;
    const totalRecords = archiveQuery.data?.meta.total ?? 0;
    const pendingUploads = pendingUploadsQuery.data?.meta.total ?? 0;

    return (
        <div className="w-full space-y-6 p-8 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Legal File Records</h1>
                    <p className="mt-2 max-w-3xl text-sm text-text-muted">
                        Search archived legal files by title or related name, then narrow the list by file category and upload status.
                    </p>
                </div>
                <CurrentDateTime
                    className="shrink-0 text-right"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <SummaryCard
                    label="Archive Records"
                    value={String(totalRecords)}
                    description="Records matching the current legal-file search and filter set."
                />
                <SummaryCard
                    label="Pending Upload"
                    value={String(pendingUploads)}
                    description="Archive records already encoded but still missing the digital file."
                />
                <SummaryCard
                    label="Categories"
                    value={String(categories.length)}
                    description="Available archive-only legal file groupings."
                />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="border-b border-border px-5 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Archive Records</p>
                            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">Legal File Records</h2>
                            <p className="mt-1 text-sm text-text-muted">
                                Search by file title or related name first, then refine the archive with compact filters.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                id="legal-archive-records-search"
                                type="text"
                                placeholder="Search title or related name..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-black/10 xl:w-80"
                            />

                            <select
                                id="legal-archive-records-category-filter"
                                value={categoryFilter}
                                onChange={(event) => {
                                    setCategoryFilter(event.target.value);
                                    setPage(1);
                                }}
                                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value={ALL_CATEGORIES}>All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.code} value={category.code}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                id="legal-archive-records-status-filter"
                                value={uploadStatusFilter}
                                onChange={(event) => {
                                    setUploadStatusFilter(event.target.value);
                                    setPage(1);
                                }}
                                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value={ALL_STATUSES}>All Upload Status</option>
                                <option value="uploaded">Uploaded</option>
                                <option value="missing_upload">Pending Upload</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-text-muted">
                        <p>{totalRecords} matching archive records</p>
                        <p>Newest archive entry first</p>
                    </div>
                </div>

                <div className="divide-y divide-border">
                    {records.length > 0 ? (
                        records.map((record) => (
                            <div
                                key={record.id}
                                className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_180px_180px_160px]"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                        {record.file_code_label ?? record.title}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-text-muted">{record.title}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-text-primary">{record.related_name}</p>
                                    <p className="mt-1 truncate text-xs text-text-muted">{record.file_category_label ?? 'Legal file'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-primary">{formatDate(record.document_date)}</p>
                                    <p className="mt-1 text-xs text-text-muted">{record.file?.filename ?? 'No uploaded file'}</p>
                                </div>
                                <div className="flex flex-col items-start gap-2">
                                    <UploadStatusBadge status={record.upload_status} />
                                    <p className="text-xs text-text-muted">
                                        {record.file ? record.file.formatted_size : 'No file yet'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                            <p className="text-base font-semibold text-text-primary">No matching legal file records</p>
                            <p className="mt-2 max-w-sm text-sm text-text-muted">
                                Try another search term or remove one of the archive filters to widen the result.
                            </p>
                        </div>
                    )}
                </div>

                {pagination ? (
                    <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-secondary/20 px-5 py-4 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <label
                                htmlFor="legal-archive-records-per-page"
                                className="text-sm font-medium text-text-muted"
                            >
                                Show
                            </label>
                            <select
                                id="legal-archive-records-per-page"
                                value={String(perPage)}
                                onChange={(event) => {
                                    setPerPage(Number(event.target.value));
                                    setPage(1);
                                }}
                                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                {PAGE_SIZE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <p className="text-text-muted">
                                Page {pagination.current_page} of {pagination.last_page}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                                disabled={pagination.current_page <= 1}
                                className="rounded-lg border border-border px-3 py-2 text-text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((currentPage) => Math.min(pagination.last_page, currentPage + 1))}
                                disabled={pagination.current_page >= pagination.last_page}
                                className="rounded-lg border border-border px-3 py-2 text-text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : null}
            </section>
        </div>
    );
};
