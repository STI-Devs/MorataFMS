import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../../components/ConfirmationModal';
import { Icon } from '../../../../components/Icon';
import { trackingApi } from '../../api/trackingApi';
import { useArchives } from '../../hooks/useArchives';
import type { LayoutContext } from '../../types';
import type { ArchiveDocument, ArchiveYear, TransactionType } from '../../types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../types/document.types';
import { AddArchiveDocumentModal } from './AddArchiveDocumentModal';
import { ArchiveDocumentRow } from './ArchiveDocumentRow';
import { ArchiveLegacyUploadPage } from './ArchiveLegacyUploadPage';
import { ArchiveYearCard } from './ArchiveYearCard';

// ─── Drill-down state ─────────────────────────────────────────────────────────
// Mirrors S3 path: documents/{type}/{year}/{BL}/{files}
type DrillState =
    | { level: 'years' }
    | { level: 'types';  year: ArchiveYear }
    | { level: 'months'; year: ArchiveYear; type: TransactionType }
    | { level: 'bls';    year: ArchiveYear; type: TransactionType; month: number }
    | { level: 'files';  year: ArchiveYear; type: TransactionType; month: number; bl: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FOLDER_COLOR = { import: '#30d158', export: '#0a84ff' } as const;
const FOLDER_LABEL = { import: 'imports', export: 'exports' } as const;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

const FolderIcon = ({ color }: { color: string }) => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
);

const ChevronRight = () => (
    <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

// ─── Folder row — a single clickable "folder" in the browser ──────────────────

const FolderRow = ({
    icon, label, meta, onClick,
}: {
    icon: React.ReactNode;
    label: string;
    meta: string;
    onClick: () => void;
}) => (
    <button onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-hover transition-colors text-left group">
        {icon}
        <span className="text-sm font-semibold text-text-primary flex-1 truncate group-hover:underline underline-offset-2">
            {label}
        </span>
        <span className="text-xs text-text-muted shrink-0">{meta}</span>
        <ChevronRight />
    </button>
);

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const Breadcrumb = ({ parts }: { parts: { label: string; onClick?: () => void }[] }) => (
    <nav className="flex items-center gap-1 flex-wrap">
        {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-text-muted text-xs">/</span>}
                {p.onClick ? (
                    <button onClick={p.onClick}
                        className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
                        {p.label}
                    </button>
                ) : (
                    <span className="text-xs font-bold text-text-primary">{p.label}</span>
                )}
            </span>
        ))}
    </nav>
);

// ─── Archival divider ─────────────────────────────────────────────────────────

const ArchivalDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,159,10,0.2)' }} />
        <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: 'rgba(255,159,10,0.45)' }}>
            {label}
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,159,10,0.2)' }} />
    </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Convert ALL CAPS client names to Title Case for readability
const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

type SortKey = 'bl' | 'client' | 'period' | 'files';

// ─── Component ────────────────────────────────────────────────────────────────

export const ArchivesPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();

    const { data: archiveData = [], isLoading, isError } = useArchives();
    const [drill, setDrill]               = useState<DrillState>({ level: 'years' });
    const [showLegacyUpload, setShowLegacyUpload] = useState(false);
    const [search, setSearch]             = useState('');
    const [sortKey, setSortKey]           = useState<SortKey>('period');
    const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');

    // Add document to existing BL modal state
    const [addDocModal, setAddDocModal] = useState<{
        isOpen: boolean; blNo: string; type: TransactionType; docs: ArchiveDocument[];
    }>({ isOpen: false, blNo: '', type: 'import', docs: [] });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string;
        confirmText?: string; confirmButtonClass?: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const openConfirm = (title: string, message: string, onConfirm: () => void) =>
        setConfirmModal({ isOpen: true, title, message, confirmText: 'Delete', confirmButtonClass: 'bg-red-600 hover:bg-red-700', onConfirm });

    const handleDeleteArchiveDoc = (docId: number) =>
        openConfirm('Delete Archive Document', 'This will permanently remove this legacy document. Continue?', async () => {
            await trackingApi.deleteDocument(docId);
            queryClient.invalidateQueries({ queryKey: ['archives'] });
        });

    // Reset search when navigating
    const nav = (next: DrillState) => { setDrill(next); setSearch(''); };

    // ── Legacy upload sub-page ─────────────────────────────────────────────────
    if (showLegacyUpload) {
        const currentYear = drill.level !== 'years' ? drill.year.year : new Date().getFullYear() - 1;
        return (
            <ArchiveLegacyUploadPage
                defaultYear={currentYear}
                onBack={() => setShowLegacyUpload(false)}
                onSubmit={() => {
                    setShowLegacyUpload(false);
                    queryClient.invalidateQueries({ queryKey: ['archives'] });
                }}
            />
        );
    }

    // ── Loading / Error ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-sm text-text-muted font-semibold">Loading archives…</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
                <Icon name="alert-circle" className="w-10 h-10 opacity-40" />
                <p className="text-sm font-semibold">Failed to load archives</p>
                <p className="text-xs">Check your connection and try again.</p>
            </div>
        );
    }

    // ── Breadcrumb builder ─────────────────────────────────────────────────────
    const baseCrumb = { label: 'Archives', onClick: drill.level !== 'years' ? () => nav({ level: 'years' }) : undefined };

    const breadcrumbParts = (() => {
        if (drill.level === 'years') return [baseCrumb];
        if (drill.level === 'types') return [
            baseCrumb,
            { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) },
        ];
        if (drill.level === 'months') return [
            baseCrumb,
            { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) },
            { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) },
        ];
        if (drill.level === 'bls') return [
            baseCrumb,
            { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) },
            { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) },
            { label: MONTH_NAMES[drill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: drill.year, type: drill.type, month: drill.month }) },
        ];
        return [
            baseCrumb,
            { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) },
            { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) },
            { label: MONTH_NAMES[drill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: drill.year, type: drill.type, month: drill.month }) },
            { label: drill.bl + '/' },
        ];
    })();

    // ── Shared page chrome (header + stat bar remain constant) ─────────────────
    const totalDocs    = archiveData.reduce((s, y) => s + y.documents.length, 0);
    const uniqueBLs    = new Set(archiveData.flatMap(y => y.documents.map(d => d.bl_no))).size;
    const totalImports = archiveData.reduce((s, y) => s + y.imports, 0);
    const totalExports = archiveData.reduce((s, y) => s + y.exports, 0);
    const yearRange    = archiveData.length > 0
        ? `${Math.min(...archiveData.map(y => y.year))}–${Math.max(...archiveData.map(y => y.year))}`
        : '—';

    return (
        <div className="space-y-5 p-4">

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    {/* Archival stamp icon */}
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
                        style={{ borderColor: 'rgba(255,159,10,0.35)', backgroundColor: 'rgba(255,159,10,0.07)' }}>
                        <svg className="w-6 h-6" fill="none" stroke="#ff9f0a" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black tracking-tight text-text-primary">Records Archive</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"
                                style={{ backgroundColor: 'rgba(255,159,10,0.15)', color: '#ff9f0a' }}>
                                Records
                            </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">Legacy document vault · S3-backed storage</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* ── Archival index card ───────────────────────────────────────── */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(255,159,10,0.25)' }}>
                <div className="px-4 py-2 flex items-center gap-2 border-b"
                    style={{ backgroundColor: 'rgba(255,159,10,0.07)', borderColor: 'rgba(255,159,10,0.2)' }}>
                    <span className="text-[9px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(255,159,10,0.65)' }}>
                        Archival Index
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0"
                    style={{ borderColor: 'rgba(255,159,10,0.12)' }}>
                    {
                        [
                            { label: 'Total Documents', value: totalDocs.toLocaleString() },
                            { label: 'Unique BLs',      value: uniqueBLs.toLocaleString() },
                            { label: 'Imports / Exports', value: `${totalImports} / ${totalExports}` },
                            { label: 'Coverage',        value: yearRange },
                        ].map(({ label, value }) => (
                            <div key={label} className="px-4 py-3 bg-surface">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</p>
                                <p className="text-lg font-black text-text-primary tabular-nums mt-0.5">{value}</p>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* ── S3-style browser ─────────────────────────────────────────── */}
            <div className="rounded-lg border border-border overflow-hidden bg-surface">

                {/* Browser toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle">
                    {/* Breadcrumb path */}
                    <Breadcrumb parts={breadcrumbParts} />

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Search — BL folder level only */}
                        {drill.level === 'bls' && (
                            <div className="relative">
                                <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search BL / client…"
                                    className="pl-8 pr-3 h-8 w-44 rounded-md border border-border-strong bg-input-bg text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors" />
                            </div>
                        )}

                        {/* Sort — BL folder level only */}
                        {drill.level === 'bls' && (
                            <select
                                value={`${sortKey}:${sortDir}`}
                                onChange={e => {
                                    const [k, d] = e.target.value.split(':');
                                    setSortKey(k as SortKey);
                                    setSortDir(d as 'asc' | 'desc');
                                }}
                                className="h-8 px-2 rounded-md border border-border-strong bg-input-bg text-text-primary text-xs focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                <option value="period:desc">Period ↓ (Newest)</option>
                                <option value="period:asc">Period ↑ (Oldest)</option>
                                <option value="bl:asc">BL Number A→Z</option>
                                <option value="bl:desc">BL Number Z→A</option>
                                <option value="client:asc">Client A→Z</option>
                                <option value="files:desc">Most Files</option>
                                <option value="files:asc">Fewest Files</option>
                            </select>
                        )}
                        <button onClick={() => setShowLegacyUpload(true)}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: '#ff9f0a' }}>
                            <Icon name="plus" className="w-3.5 h-3.5" /> Upload
                        </button>
                    </div>
                </div>

                {/* ── LEVEL 1: Year folders ─────────────────────────────── */}
                {drill.level === 'years' && (() => {
                    if (archiveData.length === 0) return (
                        <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                            <Icon name="archive" className="w-10 h-10 opacity-30" />
                            <p className="text-sm font-semibold">No archives yet</p>
                            <p className="text-xs">Upload legacy files to start building the archive.</p>
                        </div>
                    );
                    return (
                        <div>
                            {/* Column header */}
                            <div className="grid px-4 py-2 border-b border-border bg-surface-subtle"
                                style={{ gridTemplateColumns: '24px 1fr 80px 80px 24px' }}>
                                {['', 'Name', 'Files', 'Transactions', ''].map((h, i) => (
                                    <span key={i} className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{h}</span>
                                ))}
                            </div>
                            {archiveData.map((yr, idx) => (
                                <div key={yr.year}>
                                    <ArchiveYearCard archive={yr} onClick={() => nav({ level: 'types', year: yr })} />
                                    {idx < archiveData.length - 1 && <ArchivalDivider label="" />}
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 2: Type folders (imports/ exports/) ─────────── */}
                {drill.level === 'types' && (() => {
                    const types: TransactionType[] = ['import', 'export'];
                    return (
                        <div>
                            {/* Column header */}
                            <div className="grid px-4 py-2 border-b border-border bg-surface-subtle"
                                style={{ gridTemplateColumns: '24px 1fr 80px 24px' }}>
                                {['', 'Name', 'Files', ''].map((h, i) => (
                                    <span key={i} className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{h}</span>
                                ))}
                            </div>
                            {types.map(txType => {
                                const count = drill.year.documents.filter(d => d.type === txType).length;
                                if (count === 0) return null;
                                const color = FOLDER_COLOR[txType];
                                return (
                                    <FolderRow key={txType}
                                        icon={<FolderIcon color={color} />}
                                        label={FOLDER_LABEL[txType] + '/'}
                                        meta={`${count} ${count === 1 ? 'file' : 'files'}`}
                                        onClick={() => nav({ level: 'months', year: drill.year, type: txType })}
                                    />
                                );
                            })}
                        </div>
                    );
                })()}

                {/* ── LEVEL 3: Month folders ─────────────────────────── */}
                {drill.level === 'months' && (() => {
                    const typeDocs = drill.year.documents.filter(d => d.type === drill.type);
                    const monthGroups = typeDocs.reduce<Record<number, number>>((acc, d) => {
                        acc[d.month] = (acc[d.month] ?? 0) + 1;
                        return acc;
                    }, {});
                    const color = FOLDER_COLOR[drill.type];

                    const sortedMonths = Object.entries(monthGroups)
                        .map(([m, count]) => ({ month: Number(m), count }))
                        .sort((a, b) => a.month - b.month);

                    return (
                        <div>
                            <div className="grid px-4 py-2 border-b border-border bg-surface-subtle"
                                style={{ gridTemplateColumns: '24px 1fr 80px 24px' }}>
                                {['', 'Name', 'Files', ''].map((h, i) => (
                                    <span key={i} className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{h}</span>
                                ))}
                            </div>
                            {sortedMonths.map(({ month, count }) => (
                                <FolderRow key={month}
                                    icon={<FolderIcon color={color} />}
                                    label={MONTH_NAMES[month - 1] + '/'}
                                    meta={`${count} ${count === 1 ? 'file' : 'files'}`}
                                    onClick={() => nav({ level: 'bls', year: drill.year, type: drill.type, month })}
                                />
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 4: BL number folders ───────────────────────── */}
                {drill.level === 'bls' && (() => {
                    const typeDocs = drill.year.documents.filter(d => d.type === drill.type && d.month === drill.month);
                    const blGroups = typeDocs.reduce<Record<string, ArchiveDocument[]>>((acc, d) => {
                        const key = d.bl_no || '(no BL)';
                        acc[key] = [...(acc[key] ?? []), d];
                        return acc;
                    }, {});

                    // Apply search filter at BL level (BL number or client name)
                    const filteredBlEntries = Object.entries(blGroups)
                        .filter(([blNo, blDocs]) => {
                            if (!search) return true;
                            const q = search.toLowerCase();
                            return blNo.toLowerCase().includes(q) || blDocs[0]?.client?.toLowerCase().includes(q);
                        })
                        .sort(([aNo, aDocs], [bNo, bDocs]) => {
                            const dir = sortDir === 'asc' ? 1 : -1;
                            if (sortKey === 'bl')     return aNo.localeCompare(bNo) * dir;
                            if (sortKey === 'client') return (aDocs[0]?.client ?? '').localeCompare(bDocs[0]?.client ?? '') * dir;
                            if (sortKey === 'files')  return (aDocs.length - bDocs.length) * dir;
                            // default: period (transaction_date)
                            const aDate = aDocs[0]?.transaction_date ?? '';
                            const bDate = bDocs[0]?.transaction_date ?? '';
                            return aDate.localeCompare(bDate) * dir;
                        });
                    const color = FOLDER_COLOR[drill.type];

                    // Format date: "Jan 2024" for archive (last day of month = month-only precision)
                    // or "Jan 15, 2024" for migrated live transactions with exact dates
                    const formatPeriod = (dateStr: string) => {
                        const d = new Date(dateStr + 'T00:00:00');
                        const month = d.toLocaleString('en-US', { month: 'short' });
                        const day = d.getDate();
                        const year = d.getFullYear();
                        // Legacy archives use last day of month (from month picker)
                        const lastDayOfMonth = new Date(year, d.getMonth() + 1, 0).getDate();
                        const isMonthOnly = day === 1 || day === lastDayOfMonth;
                        return isMonthOnly ? `${month} ${year}` : `${month} ${day}, ${year}`;
                    };

                    return (
                        <div>
                            <div className="grid items-center gap-4 px-4 py-2 border-b border-border bg-surface-subtle"
                                style={{ gridTemplateColumns: '24px 1fr 1fr 120px auto 32px 24px' }}>
                                {['', 'BL Number', 'Client', 'Period', 'Stages', '', ''].map((h, i) => (
                                    <span key={i} className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{h}</span>
                                ))}
                            </div>
                            {filteredBlEntries.length === 0 ? (
                                <div className="py-14 flex flex-col items-center gap-3 text-text-muted">
                                    <Icon name="file-text" className="w-9 h-9 opacity-30" />
                                    <p className="text-sm font-semibold">No BLs match &ldquo;{search}&rdquo;</p>
                                </div>
                            ) : filteredBlEntries.map(([blNo, blDocs]) => {
                                const firstDoc     = blDocs[0];
                                const uploadedKeys = new Set(blDocs.map(d => d.stage));
                                const stageList    = drill.type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
                                const doneCount    = stageList.filter(s => uploadedKeys.has(s.key)).length;
                                const isComplete   = doneCount === stageList.length;
                                return (
                                    <div key={blNo}
                                        className="w-full grid items-center gap-4 px-4 py-3 border-b border-border/50 hover:bg-hover transition-colors text-left group"
                                        style={{ gridTemplateColumns: '24px 1fr 1fr 120px auto 32px 24px' }}>
                                        <FolderIcon color={color} />
                                        <button onClick={() => nav({ level: 'files', year: drill.year, type: drill.type, month: drill.month, bl: blNo })}
                                            className="text-sm font-semibold text-text-primary truncate group-hover:underline underline-offset-2 text-left font-mono">
                                            {blNo}/
                                        </button>
                                        <span className="text-xs text-text-secondary truncate">
                                            {toTitleCase(firstDoc?.client ?? '—')}
                                        </span>
                                        <span className="text-xs text-text-muted tabular-nums">
                                            {firstDoc?.transaction_date ? formatPeriod(firstDoc.transaction_date) : '—'}
                                        </span>

                                        {/* Stage completeness dots */}
                                        <div className="flex items-center gap-1" title={`${doneCount}/${stageList.length} stages uploaded`}>
                                            {stageList.map(s => (
                                                <span key={s.key}
                                                    className={`w-2 h-2 rounded-full transition-colors ${
                                                        uploadedKeys.has(s.key)
                                                            ? 'bg-green-500'
                                                            : 'bg-border-strong'
                                                    }`}
                                                    title={s.label}
                                                />
                                            ))}
                                            <span className={`text-[10px] font-bold ml-1 ${
                                                isComplete ? 'text-green-500' : 'text-amber-500'
                                            }`}>
                                                {doneCount}/{stageList.length}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAddDocModal({ isOpen: true, blNo, type: drill.type, docs: blDocs });
                                            }}
                                            className="w-7 h-7 rounded-md flex items-center justify-center border border-border text-text-muted hover:bg-hover hover:text-text-primary transition-colors"
                                            title="Add document to this BL">
                                            <Icon name="plus" className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => nav({ level: 'files', year: drill.year, type: drill.type, month: drill.month, bl: blNo })}>
                                            <ChevronRight />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}

                {/* ── LEVEL 5: Files ───────────────────────────────────── */}
                {drill.level === 'files' && (() => {
                    const fileDocs = drill.year.documents
                        .filter(d => d.type === drill.type && d.month === drill.month && (d.bl_no || '(no BL)') === drill.bl);

                    if (fileDocs.length === 0) return (
                        <div className="py-14 flex flex-col items-center gap-3 text-text-muted">
                            <Icon name="file-text" className="w-9 h-9 opacity-30" />
                            <p className="text-sm font-semibold">No files in this folder</p>
                        </div>
                    );

                    return (
                        <div>
                            {/* Column headers */}
                            <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-subtle"
                                style={{ gridTemplateColumns: '28px 1fr 1.4fr 80px 28px 48px' }}>
                                {['', 'File', 'Stage', 'Uploaded', 'By', ''].map((h, i) => (
                                    <span key={i} className="text-[10px] font-bold text-text-muted uppercase tracking-wider last:text-right">{h}</span>
                                ))}
                            </div>
                            {fileDocs.map(doc => (
                                <ArchiveDocumentRow key={doc.id} doc={doc} onDelete={handleDeleteArchiveDoc} />
                            ))}
                        </div>
                    );
                })()}
            </div>

            <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
                onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message}
                confirmText={confirmModal.confirmText} confirmButtonClass={confirmModal.confirmButtonClass} />

            <AddArchiveDocumentModal
                isOpen={addDocModal.isOpen}
                onClose={() => setAddDocModal(m => ({ ...m, isOpen: false }))}
                blNo={addDocModal.blNo}
                type={addDocModal.type}
                existingDocs={addDocModal.docs}
            />
        </div>
    );
};
