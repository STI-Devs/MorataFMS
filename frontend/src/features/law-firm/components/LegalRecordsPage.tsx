import { useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { RecordUploadModal } from './RecordUploadModal';

type RecordEntry = {
    id: number;
    name: string;
    type: string;
    uploadedBy: string;
    date: string;
    status: 'active' | 'archived' | 'pending';
};

const STATUS_COLORS: Record<RecordEntry['status'], string> = {
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800/50',
    archived: 'text-text-muted bg-surface-secondary border-border',
    pending: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800/50',
};

const RECORD_TYPES = [
    'All Record Types',
    'Case File',
    'Court Order',
    'Legal Opinion',
    'Notarial Certificate',
    'Power of Attorney',
    'Resolution',
    'Summons',
    'Subpoena',
];

// Placeholder rows — will be replaced by real API data
const PLACEHOLDER_RECORDS: RecordEntry[] = [];

export const LegalRecordsPage = () => {
    const [search, setSearch] = useState('');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [recordType, setRecordType] = useState('All Record Types');

    const filtered = PLACEHOLDER_RECORDS.filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = recordType === 'All Record Types' || r.type === recordType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="w-full p-8 pb-12 space-y-7">

            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Records</h1>
                    <p className="text-base text-text-muted mt-1">F.M. Morata — Legal Records</p>
                </div>
                <CurrentDateTime
                    className="text-right shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            {/* Card container */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-surface-secondary/40">
                    <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <svg
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                        <input
                            id="records-search"
                            type="text"
                            placeholder="Search records…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg text-sm bg-input-bg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-56"
                        />
                    </div>

                    {/* Type filter */}
                    <div className="relative flex items-center gap-2">
                        <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                        </svg>
                        <div className="relative">
                            <select
                                id="records-type-filter"
                                value={recordType}
                                onChange={(e) => setRecordType(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                            >
                                {RECORD_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    </div>

                    {/* Upload Record button */}
                    <button
                        id="records-upload-btn"
                        type="button"
                        onClick={() => setUploadModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all shadow-sm shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Record
                    </button>
                </div>

                {/* List header — only shown when records exist */}
                {filtered.length > 0 && (
                    <div
                        className="hidden sm:grid items-center gap-3 px-5 py-3 border-b border-border bg-surface-secondary/20"
                        style={{ gridTemplateColumns: '1fr 160px 140px 120px 100px' }}
                    >
                        {['Record Name', 'Type', 'Uploaded By', 'Date', 'Status'].map((col) => (
                            <p key={col} className="text-xs font-bold uppercase tracking-widest text-text-muted">{col}</p>
                        ))}
                    </div>
                )}

                {/* Record rows or empty state */}
                {filtered.length > 0 ? (
                    <div>
                        {filtered.map((record, idx) => (
                            <div
                                key={record.id}
                                className={`grid items-center gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-hover ${idx < filtered.length - 1 ? 'border-b border-border' : ''}`}
                                style={{ gridTemplateColumns: '1fr 160px 140px 120px 100px' }}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-semibold text-text-primary truncate">{record.name}</span>
                                </div>
                                <span className="text-sm text-text-secondary">{record.type}</span>
                                <span className="text-sm text-text-secondary">{record.uploadedBy}</span>
                                <span className="text-sm text-text-muted tabular-nums">{record.date}</span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[record.status]} capitalize`}>
                                    {record.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Simple empty state */
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center">
                            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                            <p className="text-sm font-semibold text-text-primary">No records yet</p>
                            <p className="text-sm text-text-muted">
                                Legal records will appear here once they are uploaded.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <RecordUploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
        </div>
    );
};
