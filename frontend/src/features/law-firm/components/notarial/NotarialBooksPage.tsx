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

const SummaryCard = ({ label, value, description, accentColor }: { label: string; value: string; description: string, accentColor?: string }) => (
    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-[13px] font-medium text-neutral-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
        <p className="mt-2 text-[12px] text-neutral-400">{description}</p>
        {accentColor && (
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${accentColor} transition-transform group-hover:scale-110`} />
        )}
    </div>
);

const StatusBadge = ({ status }: { status: LegalBookStatus }) => {
    const styles = {
        active: { bg: 'bg-emerald-50', border: 'border-emerald-200/50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        full: { bg: 'bg-amber-50', border: 'border-amber-200/50', text: 'text-amber-700', dot: 'bg-amber-500' },
        archived: { bg: 'bg-neutral-50', border: 'border-neutral-200/60', text: 'text-neutral-600', dot: 'bg-neutral-400' },
    }[status];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border ${styles.border} ${styles.bg} px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${styles.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
            {status}
        </span>
    );
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
        <div className="relative min-h-full w-full bg-[#FAFAFA] font-sans selection:bg-neutral-900 selection:text-white">
            {/* Subtle Top Gradient background */}
            <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-neutral-100 to-transparent pointer-events-none" />
            
            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 p-8 pb-16">
                {/* 21st.dev Style Header */}
                <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/60 bg-white px-3 py-1 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                            <p className="text-[11px] font-medium tracking-wide text-neutral-600">Archival & Scans</p>
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
                            Book Register
                        </h1>
                        <p className="text-[15px] leading-relaxed text-neutral-500">
                            Keep each physical legal book in the register, then add scans, page-indexed scans, and folder-based files under the matching book record.
                        </p>
                    </div>
                    
                    <div className="flex shrink-0 items-center justify-end">
                        <CurrentDateTime
                            className="text-right"
                            timeClassName="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums"
                            dateClassName="text-[13px] font-medium text-neutral-500"
                        />
                    </div>
                </header>

                {/* Metrics Bento Grid */}
                <div className="grid gap-4 lg:grid-cols-4">
                    <SummaryCard
                        label="Registered Books"
                        value={String(books.length)}
                        description="Physical books already saved."
                        accentColor="bg-blue-500/5"
                    />
                    <SummaryCard
                        label="Current Book"
                        value={activeBook ? `Book ${activeBook.book_number}` : 'None'}
                        description={activeBook ? `Active book for ${activeBook.year}.` : 'No book active.'}
                        accentColor="bg-emerald-500/5"
                    />
                    <SummaryCard
                        label="Closed Books"
                        value={String(archivedBooks)}
                        description="Books kept for reference."
                        accentColor="bg-neutral-500/5"
                    />
                    <SummaryCard
                        label="Books With Files"
                        value={String(scannedBooks)}
                        description="Books containing uploads."
                        accentColor="bg-amber-500/5"
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] items-start">
                    {/* INTAKE FORM - Sleek Card */}
                    <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="border-b border-neutral-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
                            <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                                {canManageBooks ? 'Register a Physical Book' : 'Book Setup Overview'}
                            </h2>
                            <p className="mt-1 text-[13px] text-neutral-500">Save the book header first, then attach scans.</p>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="notarial-book-number" className="text-[13px] font-medium text-neutral-700">Book No.</label>
                                    <input
                                        id="notarial-book-number"
                                        type="number"
                                        min={1}
                                        value={bookNumber}
                                        onChange={(event) => setBookNumber(event.target.value)}
                                        placeholder="Enter number"
                                        disabled={!canManageBooks}
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="notarial-book-year" className="text-[13px] font-medium text-neutral-700">Year</label>
                                    <input
                                        id="notarial-book-year"
                                        type="number"
                                        min={2000}
                                        max={2100}
                                        value={year}
                                        onChange={(event) => setYear(event.target.value)}
                                        disabled={!canManageBooks}
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="notarial-book-status" className="text-[13px] font-medium text-neutral-700">Status</label>
                                <div className="relative">
                                    <select
                                        id="notarial-book-status"
                                        value={status}
                                        onChange={(event) => setStatus(event.target.value as LegalBookStatus)}
                                        disabled={!canManageBooks}
                                        className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option value="active">Active</option>
                                        <option value="full">Full</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                        <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="notarial-book-notes" className="text-[13px] font-medium text-neutral-700">Notes</label>
                                <textarea
                                    id="notarial-book-notes"
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    rows={3}
                                    disabled={!canManageBooks}
                                    placeholder="Optional archive note..."
                                    className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </div>

                            {/* UPLOAD ZONE */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-medium text-neutral-700">Primary Scan</label>
                                <div className={`relative overflow-hidden rounded-2xl border border-dashed ${!canManageBooks ? 'border-neutral-200 bg-neutral-50/30' : 'border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 hover:bg-neutral-50'} p-1 transition-all`}>
                                    <label className="flex cursor-pointer flex-col items-center justify-center px-6 py-8 text-center">
                                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/60">
                                            <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <p className="text-[13px] font-medium text-neutral-900">Attach Primary Scan</p>
                                        <p className="mt-1 text-[12px] text-neutral-500">Optional. You can add files later.</p>
                                        
                                        <input
                                            id="notarial-book-file"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            disabled={!canManageBooks}
                                            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                                            className="hidden"
                                        />
                                        
                                        {selectedFile && (
                                            <div className="mt-4 flex items-center gap-3 rounded-full border border-neutral-200 bg-white py-1.5 pl-3 pr-1.5 shadow-sm">
                                                <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="max-w-[150px] truncate text-[12px] font-medium text-neutral-900">{selectedFile.name}</span>
                                                {canManageBooks && (
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                                                        className="ml-1 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none"
                                                    >
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {canManageBooks && (
                                <button
                                    type="button"
                                    id="notarial-book-save"
                                    onClick={() => void handleCreateBook()}
                                    disabled={createBook.isPending}
                                    className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 px-6 py-3.5 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0" />
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {createBook.isPending ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : 'Save Book'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </section>

                    {/* LIBRARY LIST - Vercel / Linear Style Stack */}
                    <section className="flex flex-col overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
                            <div>
                                <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Saved Books</h2>
                                <p className="mt-1 text-[13px] text-neutral-500">Open a book to manage its files and scans.</p>
                            </div>
                            <div className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-neutral-100 px-2 text-[12px] font-semibold text-neutral-600">
                                {books.length}
                            </div>
                        </div>
                        
                        <div className="flex-1 p-6 space-y-6 bg-[#FAFAFA]/30">
                            {books.length > 0 ? (
                                books.map((book) => (
                                    <div 
                                        key={book.id} 
                                        className="group relative flex flex-col gap-5 rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                    >
                                        {/* Book Header Row */}
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-[18px] font-bold tracking-tight text-neutral-900">
                                                        Book {book.book_number}
                                                    </h3>
                                                    <StatusBadge status={book.status} />
                                                </div>
                                                <p className="mt-1.5 flex items-center gap-2 text-[13px] font-medium text-neutral-500">
                                                    <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {book.year}
                                                </p>
                                                {book.notes && (
                                                    <p className="mt-3 text-[13px] leading-relaxed text-neutral-500 italic border-l-2 border-neutral-200 pl-3">
                                                        "{book.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {book.scan_file ? (
                                                <a
                                                    href={book.scan_file.download_url}
                                                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                                                >
                                                    <svg className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download Scan
                                                </a>
                                            ) : (
                                                <span className="shrink-0 text-[13px] font-medium text-neutral-400">No primary scan</span>
                                            )}
                                        </div>

                                        {/* Meta Stats row */}
                                        <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-neutral-500">
                                            {book.scan_file && (
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {book.scan_file.filename} • {book.scan_file.formatted_size}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 bg-neutral-100/80 px-2 py-0.5 rounded-md text-neutral-600">
                                                {book.page_scan_count ?? 0} page scan{book.page_scan_count === 1 ? '' : 's'}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-neutral-100/80 px-2 py-0.5 rounded-md text-neutral-600">
                                                {book.legacy_file_count ?? 0} archive file{book.legacy_file_count === 1 ? '' : 's'}
                                            </span>
                                            {book.closed_at && (
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Closed: {new Date(book.closed_at).toLocaleDateString('en-PH')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Control Actions */}
                                        {canManageBooks && (
                                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                                {book.status !== 'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleStatusChange(book, 'active')}
                                                        className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[12px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 focus:outline-none"
                                                    >
                                                        Set Active
                                                    </button>
                                                )}
                                                {book.status !== 'full' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleStatusChange(book, 'full')}
                                                        className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[12px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 focus:outline-none"
                                                    >
                                                        Mark Full
                                                    </button>
                                                )}
                                                {book.status !== 'archived' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleStatusChange(book, 'archived')}
                                                        className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[12px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none"
                                                    >
                                                        Archive
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Inner Panels (Unchanged functionally, styling inherits their internal styles but container is clean) */}
                                        <div className="grid gap-4 xl:grid-cols-2 pt-2">
                                            <BookPageScansPanel book={book} canManage={canManageBooks} />
                                            <LegacyBookFilesPanel book={book} canManage={canManageBooks} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/60">
                                        <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <p className="text-[15px] font-medium text-neutral-900">No books registered yet</p>
                                    <p className="mt-1 text-[13px] text-neutral-500">Register your first physical book to start tracking.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
