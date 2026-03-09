import type { Book } from '../types/lawFirm.types';

// Column grid: chevron | Book Name | Uploaded By | Files | Date | Actions
const COLS = '24px 1fr 160px 80px 120px 140px';

interface Props {
    book: Book;
    isOpen: boolean;
    onToggle: (id: number) => void;
    onUpload: (book: Book) => void;
}

export const BookRow = ({ book, isOpen, onToggle, onUpload }: Props) => (
    <div className="border-b border-border last:border-b-0">

        {/* Book row */}
        <div
            className={`grid items-center gap-3 px-5 py-4 cursor-pointer select-none transition-colors ${isOpen ? 'bg-blue-500/8' : 'bg-surface hover:bg-hover'}`}
            style={{ gridTemplateColumns: COLS }}
            onClick={() => onToggle(book.id)}>

            <svg className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            <div className={`text-sm font-semibold text-left ${isOpen ? 'text-blue-500' : 'text-text-primary'}`}>{book.name}</div>
            <div className="text-sm text-text-secondary text-center">{book.uploadedBy}</div>

            <div className={`text-sm font-semibold tabular-nums text-center ${book.files.length >= book.totalSlots ? 'text-emerald-500' : 'text-amber-500'}`}>
                {book.files.length}/{book.totalSlots}
            </div>

            <div className="text-sm text-text-muted tabular-nums text-center">{book.date}</div>

            <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                {/* Download */}
                <button title="Download"
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-input-bg text-text-secondary hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/10 transition-all shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                {/* Edit */}
                <button title="Edit"
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-input-bg text-text-secondary hover:border-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 transition-all shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                {/* Add / Upload */}
                <button title="Add file"
                    onClick={() => onUpload(book)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-all shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>

        {/* File list (expanded) */}
        {isOpen && (
            <div className="border-t border-border">
                {book.files.length === 0 ? (
                    <div className="pl-10 pr-5 py-5 flex items-center gap-2 text-text-muted">
                        <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs">No files uploaded yet.</span>
                    </div>
                ) : book.files.map(f => (
                    <div key={f.id}
                        className="flex items-center gap-3 pl-10 pr-5 py-3 border-b border-border/40 last:border-b-0 bg-surface-secondary/30 hover:bg-hover transition-colors cursor-pointer">
                        <svg className="w-4 h-4 text-red-400/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-text-primary">{f.name}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
