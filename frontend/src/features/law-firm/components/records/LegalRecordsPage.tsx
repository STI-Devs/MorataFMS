import { useDeferredValue, useMemo, useState } from 'react';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import {
    useLegalBooks,
    useLegalCatalog,
    useNotarialTemplateRecords,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';
import type {
    LegalDocumentCategoryCode,
    NotarialActTypeCode,
} from '../../types/legalRecords.types';

const ALL_CATEGORIES = 'all';
const ALL_BOOKS = 'all';
const ALL_ACT_TYPES = 'all';
const PAGE_SIZE_OPTIONS = [12, 25, 50, 100] as const;

const formatTimestamp = (value: string | null) => {
    if (!value) {
        return 'No generated date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

const SummaryCard = ({ label, value, description }: { label: string; value: string; description: string }) => (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
        <p className="mt-1.5 text-sm text-text-muted">{description}</p>
    </div>
);

export const LegalRecordsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
    const [bookFilter, setBookFilter] = useState<string>(ALL_BOOKS);
    const [actTypeFilter, setActTypeFilter] = useState<string>(ALL_ACT_TYPES);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(12);

    const deferredSearchTerm = useDeferredValue(searchTerm);

    const catalogQuery = useLegalCatalog();
    const booksQuery = useLegalBooks({ per_page: 100 });
    const recordsQuery = useNotarialTemplateRecords({
        search: deferredSearchTerm.trim() || undefined,
        document_category:
            categoryFilter !== ALL_CATEGORIES
                ? (categoryFilter as LegalDocumentCategoryCode)
                : undefined,
        notarial_act_type:
            actTypeFilter !== ALL_ACT_TYPES
                ? (actTypeFilter as NotarialActTypeCode)
                : undefined,
        book_id: bookFilter !== ALL_BOOKS ? Number(bookFilter) : undefined,
        page,
        per_page: perPage,
    });
    const readyTemplatesQuery = useNotarialTemplates({
        template_status: 'ready',
        per_page: 1,
        page: 1,
    });

    const categories = catalogQuery.data?.categories ?? [];
    const notarialActTypes = catalogQuery.data?.notarial_act_types ?? [];
    const books = useMemo(
        () =>
            [...(booksQuery.data?.data ?? [])].sort((left, right) => {
                if (left.status === 'active' && right.status !== 'active') {
                    return -1;
                }

                if (left.status !== 'active' && right.status === 'active') {
                    return 1;
                }

                if (left.year !== right.year) {
                    return right.year - left.year;
                }

                return right.book_number - left.book_number;
            }),
        [booksQuery.data?.data],
    );
    const records = recordsQuery.data?.data ?? [];
    const pagination = recordsQuery.data?.meta;
    const totalRecords = recordsQuery.data?.meta.total ?? 0;
    const readyTemplates = readyTemplatesQuery.data?.meta.total ?? 0;
    const activeBook = books.find((book) => book.status === 'active') ?? null;

    return (
        <div className="w-full space-y-6 p-8 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Generated Notarial Records</h1>
                    <p className="mt-2 max-w-3xl text-sm text-text-muted">
                        Search generated Word documents by template, party name, or file name, then narrow the list by document category, notarial act, or linked book archive.
                    </p>
                </div>
                <CurrentDateTime
                    className="shrink-0 text-right"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
                <SummaryCard
                    label="Generated Records"
                    value={String(totalRecords)}
                    description="Generated Word documents matching the current records filter."
                />
                <SummaryCard
                    label="Ready Templates"
                    value={String(readyTemplates)}
                    description="Templates with an uploaded master Word file ready for generation."
                />
                <SummaryCard
                    label="Book Archive"
                    value={String(books.length)}
                    description="Registered physical books available for optional archive linkage."
                />
                <SummaryCard
                    label="Current Book"
                    value={activeBook ? `Book ${activeBook.book_number}` : 'None'}
                    description={activeBook ? `${activeBook.year} physical book is marked active.` : 'No current physical book marked active.'}
                />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="border-b border-border px-5 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Generated Records</p>
                            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">Notarial Output History</h2>
                            <p className="mt-1 text-sm text-text-muted">
                                Start with the party, template, or file name, then refine the generated outputs with compact filters.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                id="generated-records-search"
                                type="text"
                                placeholder="Search template, party, or file..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-black/10 xl:w-80"
                            />

                            <select
                                id="generated-records-category-filter"
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
                                id="generated-records-book-filter"
                                value={bookFilter}
                                onChange={(event) => {
                                    setBookFilter(event.target.value);
                                    setPage(1);
                                }}
                                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value={ALL_BOOKS}>All Books</option>
                                {books.map((book) => (
                                    <option key={book.id} value={String(book.id)}>
                                        {`Book ${book.book_number} • ${book.year}`}
                                    </option>
                                ))}
                            </select>

                            <select
                                id="generated-records-act-type-filter"
                                value={actTypeFilter}
                                onChange={(event) => {
                                    setActTypeFilter(event.target.value);
                                    setPage(1);
                                }}
                                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value={ALL_ACT_TYPES}>All Notarial Acts</option>
                                {notarialActTypes.map((actType) => (
                                    <option key={actType.code} value={actType.code}>
                                        {actType.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-text-muted">
                        <p>{totalRecords} matching generated records</p>
                        <p>Newest generated file first</p>
                    </div>
                </div>

                <div className="divide-y divide-border">
                    {records.length > 0 ? (
                        records.map((record) => (
                            <div
                                key={record.id}
                                className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_200px_200px_220px_180px]"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                        {record.template_label}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-text-muted">
                                        {record.document_code_label ?? record.document_code}
                                    </p>
                                    {record.notes ? (
                                        <p className="mt-2 line-clamp-2 text-xs text-text-muted">{record.notes}</p>
                                    ) : null}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm text-text-primary">{record.party_name}</p>
                                    <p className="mt-1 truncate text-xs text-text-muted">
                                        {record.created_by?.name ?? 'No recorded user'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-text-primary">
                                        {record.notarial_act_type_label ?? record.notarial_act_type}
                                    </p>
                                    <p className="mt-1 text-xs text-text-muted">
                                        {record.document_category_label ?? 'Notarial'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-text-primary">
                                        {record.book?.book_number ? `Book ${record.book.book_number}` : 'No linked book'}
                                    </p>
                                    <p className="mt-1 text-xs text-text-muted">
                                        {record.book?.year ? String(record.book.year) : 'Archive link optional'}
                                    </p>
                                    <p className="mt-1 text-xs text-text-muted">{formatTimestamp(record.generated_at)}</p>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-text-primary">{record.generated_file.filename}</p>
                                        <p className="mt-1 text-xs text-text-muted">{record.generated_file.formatted_size}</p>
                                    </div>
                                    <a
                                        href={record.generated_file.download_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-secondary/20"
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                            <p className="text-base font-semibold text-text-primary">No matching generated records</p>
                            <p className="mt-2 max-w-sm text-sm text-text-muted">
                                Try another search term or remove one of the generated-record filters to widen the result.
                            </p>
                        </div>
                    )}
                </div>

                {pagination ? (
                    <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-secondary/20 px-5 py-4 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <label
                                htmlFor="generated-records-per-page"
                                className="text-sm font-medium text-text-muted"
                            >
                                Show
                            </label>
                            <select
                                id="generated-records-per-page"
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
