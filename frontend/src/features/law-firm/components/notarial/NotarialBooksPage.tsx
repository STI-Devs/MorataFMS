import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { useAuth } from '../../../auth';
import {
    useCreateNotarialBook,
    useLegalBooks,
    useUpdateNotarialBook,
} from '../../hooks/useLegalWorkspace';
import type {
    LegalBook,
    LegalBookStatus,
} from '../../types/legalRecords.types';
import { BookPageScansPanel } from './BookPageScansPanel';
import { LegacyBookFilesPanel } from './LegacyBookFilesPanel';

const getErrorMessage = (error: unknown): string => {
    const responseData = (error as {
        response?: {
            data?: {
                message?: string;
                errors?: Record<string, string[]>;
            };
        };
    })?.response?.data;

    const firstValidationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : null;

    return firstValidationMessage ?? responseData?.message ?? 'Unable to save the notarial book.';
};

const SummaryCard = ({ label, value, description }: { label: string; value: string; description: string }) => (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
        <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{value}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
    </div>
);

const statusBadgeStyles: Record<LegalBookStatus, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    full: 'border-amber-200 bg-amber-50 text-amber-700',
    archived: 'border-slate-200 bg-slate-100 text-slate-700',
};

const sortBooks = (books: LegalBook[]) =>
    [...books].sort((left, right) => {
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
    });

export const NotarialBooksPage = () => {
    const { user } = useAuth();
    const canManageBooks = Boolean(user?.permissions.manage_notarial_books);

    const [bookNumber, setBookNumber] = useState('');
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [status, setStatus] = useState<LegalBookStatus>('archived');
    const [notes, setNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const booksQuery = useLegalBooks({ per_page: 100 });
    const createBook = useCreateNotarialBook();
    const updateBook = useUpdateNotarialBook();

    const books = useMemo(
        () => sortBooks(booksQuery.data?.data ?? []),
        [booksQuery.data?.data],
    );

    const activeBook = books.find((book) => book.status === 'active') ?? null;
    const archivedBooks = books.filter((book) => book.status === 'archived').length;
    const scannedBooks = books.filter(
        (book) => Boolean(book.scan_file) || (book.page_scan_count ?? 0) > 0 || (book.legacy_file_count ?? 0) > 0,
    ).length;

    const handleCreateBook = async () => {
        if (!canManageBooks) {
            return;
        }

        try {
            await createBook.mutateAsync({
                book_number: Number(bookNumber),
                year: Number(year),
                status,
                notes: notes.trim() || undefined,
                file: selectedFile,
            });

            toast.success('Book archive saved.');
            setBookNumber('');
            setNotes('');
            setSelectedFile(null);
            setStatus(activeBook ? 'archived' : 'active');
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleStatusChange = async (book: LegalBook, nextStatus: LegalBookStatus) => {
        if (!canManageBooks || book.status === nextStatus) {
            return;
        }

        try {
            await updateBook.mutateAsync({
                bookId: book.id,
                data: { status: nextStatus },
            });

            toast.success(`Book ${book.book_number} updated.`);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="w-full space-y-6 p-8 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Book Archive</h1>
                    <p className="mt-2 max-w-3xl text-sm text-text-muted">
                        Keep each physical notarial book in one archive workspace, then add book scans, page-indexed scans, and folder-based legacy files under the matching book record.
                    </p>
                </div>
                <CurrentDateTime
                    className="shrink-0 text-right"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
                <SummaryCard
                    label="Registered Books"
                    value={String(books.length)}
                    description="Physical notarial books already saved in the archive."
                />
                <SummaryCard
                    label="Current Book"
                    value={activeBook ? `Book ${activeBook.book_number}` : 'None'}
                    description={activeBook ? `${activeBook.year} is marked as the current physical book.` : 'No book is currently marked active.'}
                />
                <SummaryCard
                    label="Archived Books"
                    value={String(archivedBooks)}
                    description="Books kept for reference and historical lookup."
                />
                <SummaryCard
                    label="Books With Files"
                    value={String(scannedBooks)}
                    description="Books that already contain uploaded scans or archived files."
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Book Setup</p>
                        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">
                            {canManageBooks ? 'Register a Physical Book' : 'Book Archive Overview'}
                        </h2>
                        <p className="mt-1 text-sm text-text-muted">
                            Save the book header first. Files and scans can be added after the book exists.
                        </p>
                    </div>

                    <div className="space-y-4 p-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Book No.</span>
                                <input
                                    id="notarial-book-number"
                                    type="number"
                                    min={1}
                                    value={bookNumber}
                                    onChange={(event) => setBookNumber(event.target.value)}
                                    placeholder="Enter book number"
                                    disabled={!canManageBooks}
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </label>

                            <label className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Year</span>
                                <input
                                    id="notarial-book-year"
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={year}
                                    onChange={(event) => setYear(event.target.value)}
                                    disabled={!canManageBooks}
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </label>
                        </div>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Status</span>
                            <select
                                id="notarial-book-status"
                                value={status}
                                onChange={(event) => setStatus(event.target.value as LegalBookStatus)}
                                disabled={!canManageBooks}
                                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <option value="active">Active</option>
                                <option value="full">Full</option>
                                <option value="archived">Archived</option>
                            </select>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Notes</span>
                            <textarea
                                id="notarial-book-notes"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                rows={4}
                                disabled={!canManageBooks}
                                placeholder="Optional archive note about this physical book."
                                className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Primary Scan</span>
                            <div className="rounded-2xl border border-dashed border-border p-4">
                                <input
                                    id="notarial-book-file"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={!canManageBooks}
                                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-text-primary file:mr-4 file:rounded-lg file:border-0 file:bg-surface-secondary file:px-3 file:py-2 file:text-sm file:font-semibold disabled:cursor-not-allowed"
                                />
                                <p className="mt-2 text-xs text-text-muted">
                                    Optional at creation. Add more book files after the archive record is saved.
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-secondary/20 px-5 py-4">
                        <p className="text-xs text-text-muted">Book numbers stay unique per year.</p>
                        {canManageBooks ? (
                            <button
                                type="button"
                                id="notarial-book-save"
                                onClick={() => void handleCreateBook()}
                                disabled={createBook.isPending}
                                className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save Book
                            </button>
                        ) : null}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Archive Library</p>
                        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">Saved Books</h2>
                        <p className="mt-1 text-sm text-text-muted">
                            Open a book to manage the files and scans stored under that physical archive.
                        </p>
                    </div>

                    <div className="divide-y divide-border">
                        {books.length > 0 ? (
                            books.map((book) => (
                                <div key={book.id} className="space-y-4 px-5 py-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-lg font-bold tracking-tight text-text-primary">
                                                    Book {book.book_number}
                                                </p>
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeStyles[book.status]}`}>
                                                    {book.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-text-muted">
                                                {book.year}
                                                {book.generated_record_count !== undefined ? ` • ${book.generated_record_count} generated record${book.generated_record_count === 1 ? '' : 's'} linked` : ''}
                                            </p>
                                            {book.notes ? (
                                                <p className="mt-2 max-w-2xl text-sm text-text-muted">{book.notes}</p>
                                            ) : null}
                                        </div>

                                        {book.scan_file ? (
                                            <a
                                                href={book.scan_file.download_url}
                                                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary/20"
                                            >
                                                Download Primary Scan
                                            </a>
                                        ) : (
                                            <span className="text-sm text-text-muted">No primary scan uploaded</span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                                        {book.scan_file ? (
                                            <span>{book.scan_file.filename} • {book.scan_file.formatted_size}</span>
                                        ) : null}
                                        <span>{book.page_scan_count ?? 0} page scan{book.page_scan_count === 1 ? '' : 's'}</span>
                                        <span>{book.legacy_file_count ?? 0} archive file{book.legacy_file_count === 1 ? '' : 's'}</span>
                                        {book.closed_at ? <span>Closed: {new Date(book.closed_at).toLocaleDateString('en-PH')}</span> : null}
                                    </div>

                                    {canManageBooks ? (
                                        <div className="flex flex-wrap gap-2">
                                            {book.status !== 'active' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleStatusChange(book, 'active')}
                                                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary/20"
                                                >
                                                    Set Active
                                                </button>
                                            ) : null}
                                            {book.status !== 'full' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleStatusChange(book, 'full')}
                                                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary/20"
                                                >
                                                    Mark Full
                                                </button>
                                            ) : null}
                                            {book.status !== 'archived' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleStatusChange(book, 'archived')}
                                                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary/20"
                                                >
                                                    Archive
                                                </button>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        <BookPageScansPanel book={book} canManage={canManageBooks} />
                                        <LegacyBookFilesPanel book={book} canManage={canManageBooks} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                                <p className="text-base font-semibold text-text-primary">No archived books yet</p>
                                <p className="mt-2 max-w-md text-sm text-text-muted">
                                    Save the first physical book to start the archive.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
