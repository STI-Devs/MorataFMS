import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { ViewToggle } from '../../archives/components/ui/ViewToggle';
import type { LayoutContext } from '../../tracking/types';
import type { Book } from '../types/lawFirm.types';
import { BookRow } from './BookRow';
import { UploadModal } from './UploadModal';

// ── Column header grid (must match BookRow's COLS) ────────────────────────────
const COLS = '24px 1fr 160px 80px 120px 140px';
const ATTORNEYS = ['Atty. Reyes', 'Atty. Santos', 'Atty. Cruz'];

// 11 files per book × 50 pages = 550 pages total
const BOOKS: Book[] = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    const month = String((i % 9) + 1).padStart(2, '0');
    const day = String((i % 28) + 1).padStart(2, '0');
    const TOTAL = 11;
    const PAGES_EACH = 50;
    const fileCount = Math.min((n % TOTAL) + 1, TOTAL);
    return {
        id: n,
        name: `Folder ${n}`,
        uploadedBy: ATTORNEYS[i % 3],
        date: `2025-${month}-${day}`,
        totalSlots: TOTAL,
        files: Array.from({ length: fileCount }, (_, k) => ({
            id: n * 100 + k,
            name: `Book${n}_Page${k * PAGES_EACH + 1}-${(k + 1) * PAGES_EACH}.pdf`,
            uploadedBy: ATTORNEYS[(n + k) % 3],
            date: `2025-${month}-${String(k + 1).padStart(2, '0')}`,
        })),
    };
});

type ViewMode = 'folder' | 'document';

export const LawFirmPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('folder');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [uploadBook, setUploadBook] = useState<Book | null>(null);

    const toggle = (id: number) =>
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            return next;
        });

    const q = search.trim().toLowerCase();
    const filtered = BOOKS.filter(b => !q || b.name.toLowerCase().includes(q));

    return (
        <div className="w-full p-8 pb-12 space-y-7">

            {uploadBook && <UploadModal bookName={uploadBook.name} onClose={() => setUploadBook(null)} />}

            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Law Firm</h1>
                    <p className="text-base text-text-muted mt-1">F.M. Morata — Legal Book Registry</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-muted">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                    { label: 'Total Folders', value: BOOKS.length, sub: 'All registries', color: 'text-text-primary' },
                    { label: 'Total Files', value: BOOKS.reduce((s, b) => s + b.files.length, 0), sub: 'Uploaded files', color: 'text-blue-500' },
                    { label: 'Attorneys', value: ATTORNEYS.length, sub: 'Active counsel', color: 'text-indigo-400' },
                ].map(s => (
                    <div key={s.label} className="bg-surface rounded-xl border border-border shadow-sm p-6">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{s.label}</p>
                        <p className={`text-4xl font-black tabular-nums mt-2 ${s.color}`}>{s.value}</p>
                        <p className="text-sm text-text-muted mt-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Browser card */}
            <div className="mt-8">
                <div className="flex items-center justify-end mb-3">
                    <button className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold text-white shrink-0 shadow-sm hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <Icon name="plus" className="w-3.5 h-3.5" />
                        New Folder
                    </button>
                </div>

                <div className="rounded-xl border border-border overflow-hidden bg-surface shadow-sm">

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-subtle">
                        <div className="relative flex-1">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Escape' && setSearch('')}
                                placeholder="Search folder name…"
                                className="w-full pl-9 pr-9 h-9 rounded-md border border-border-strong bg-input-bg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all" />
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <ViewToggle mode={viewMode} onChange={setViewMode} />
                    </div>

                    {/* Column header */}
                    <div className="grid items-center px-5 py-2.5 border-b border-border bg-surface-secondary/50"
                        style={{ gridTemplateColumns: COLS }}>
                        <span />
                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest text-left">Folder Name</div>
                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest text-center">Uploaded By</div>
                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest text-center">Files</div>
                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest text-center">Date</div>
                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest text-center">Actions</div>
                    </div>

                    {/* Book rows */}
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                            <p className="text-sm font-medium">No folders found</p>
                        </div>
                    )}
                    {filtered.map(book => (
                        <BookRow
                            key={book.id}
                            book={book}
                            isOpen={expanded.has(book.id)}
                            onToggle={toggle}
                            onUpload={setUploadBook}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
