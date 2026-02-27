import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../../components/ConfirmationModal';
import type { IconName } from '../../../../components/Icon';
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
type DrillState =
    | { level: 'years' }
    | { level: 'types';  year: ArchiveYear }
    | { level: 'months'; year: ArchiveYear; type: TransactionType }
    | { level: 'bls';    year: ArchiveYear; type: TransactionType; month: number }
    | { level: 'files';  year: ArchiveYear; type: TransactionType; month: number; bl: string };

// ─── Constants ────────────────────────────────────────────────────────────────
const FOLDER_COLOR = { import: '#22c55e', export: '#3b82f6' } as const;
const FOLDER_LABEL = { import: 'imports', export: 'exports' } as const;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

type SortKey = 'bl' | 'client' | 'period' | 'files';

// ─── Small inline SVGs ────────────────────────────────────────────────────────
const FolderSVG = ({ color }: { color: string }) => (
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

// ─── KPI card ────────────────────────────────────────────────────────────────
const KpiCard = ({
    label, value, icon, accentColor, bgColor,
}: {
    label: string; value: string; icon: React.ReactNode;
    accentColor: string; bgColor: string;
}) => (
    <div className="relative flex flex-col gap-3 p-4 bg-surface rounded-xl border border-border overflow-hidden">
        {/* accent bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
        <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{label}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: bgColor }}>
                {icon}
            </div>
        </div>
        <p className="text-2xl font-black tabular-nums text-text-primary leading-none">{value}</p>
    </div>
);

// ─── Refined breadcrumb ───────────────────────────────────────────────────────
const Breadcrumb = ({ parts }: { parts: { label: string; onClick?: () => void }[] }) => (
    <nav className="flex items-center gap-1 flex-wrap min-w-0">
        {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <span className="text-border-strong text-xs select-none">/</span>}
                {p.onClick ? (
                    <button onClick={p.onClick}
                        className="text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-hover px-2 py-0.5 rounded-md transition-all duration-150">
                        {p.label}
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-text-primary px-2 py-0.5 bg-hover rounded-md">
                        {p.label}
                    </span>
                )}
            </span>
        ))}
    </nav>
);

// ─── Folder row ───────────────────────────────────────────────────────────────
const FolderRow = ({
    icon, label, meta, onClick, template,
}: {
    icon: React.ReactNode; label: string; meta: string; onClick: () => void;
    template: string;
}) => (
    <button onClick={onClick}
        className="w-full grid items-center gap-4 px-4 py-3.5 border-b border-border/60 hover:bg-hover transition-colors text-left group"
        style={{ gridTemplateColumns: template }}>
        {icon}
        <span className="text-sm font-semibold text-text-primary truncate group-hover:underline underline-offset-2 decoration-border-strong">
            {label}
        </span>
        <span className="text-xs text-text-muted tabular-nums text-right">{meta}</span>
        <ChevronRight />
    </button>
);

// ─── Column header row ────────────────────────────────────────────────────────
const ColHeader = ({ cols, template, alignRight }: { cols: string[]; template: string; alignRight?: Set<number> }) => (
    <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-secondary sticky top-0 z-10"
        style={{ gridTemplateColumns: template }}>
        {cols.map((h, i) => (
            <span key={i} className={`text-[10px] font-bold text-text-muted uppercase tracking-widest truncate ${alignRight?.has(i) ? 'text-right' : ''}`}>{h}</span>
        ))}
    </div>
);

// ─── Stage count ──────────────────────────────────────────────────────────────
const StageCount = ({
    stageList,
    uploadedKeys,
}: {
    stageList: ReadonlyArray<{ readonly key: string; readonly label: string }>;
    uploadedKeys: Set<string>;
}) => {
    const doneCount  = stageList.filter(s => uploadedKeys.has(s.key)).length;
    const isComplete = doneCount === stageList.length;
    const tooltip    = stageList
        .map(s => `${uploadedKeys.has(s.key) ? '✓' : '○'} ${s.label}`)
        .join('\n');

    return (
        <span
            title={tooltip}
            className={`text-xs font-semibold tabular-nums ${
                isComplete ? 'text-green-600' : doneCount === 0 ? 'text-text-muted' : 'text-amber-500'
            }`}
        >
            {doneCount}/{stageList.length}
        </span>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({
    icon, title, subtitle, action,
}: {
    icon: IconName; title: string; subtitle?: string; action?: React.ReactNode;
}) => (
    <div className="py-20 flex flex-col items-center gap-3 text-text-muted">
        <div className="w-14 h-14 rounded-2xl border border-border flex items-center justify-center bg-surface-secondary">
            <Icon name={icon} className="w-7 h-7 opacity-40" />
        </div>
        <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">{title}</p>
            {subtitle && <p className="text-xs mt-0.5 text-text-muted">{subtitle}</p>}
        </div>
        {action}
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export const ArchivesPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();

    const { data: archiveData = [], isLoading, isError } = useArchives();
    const [drill, setDrill]                     = useState<DrillState>({ level: 'years' });
    const [showLegacyUpload, setShowLegacyUpload] = useState(false);
    const [search, setSearch]                   = useState('');
    const [sortKey, setSortKey]                 = useState<SortKey>('period');
    const [sortDir, setSortDir]                 = useState<'asc' | 'desc'>('desc');

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

    const nav = (next: DrillState) => { setDrill(next); setSearch(''); setGlobalSearch(''); };

    // ── Global search ──────────────────────────────────────────────────────────
    const [globalSearch, setGlobalSearch] = useState('');

    const globalResults = useMemo(() => {
        const q = globalSearch.trim().toLowerCase();
        if (!q) return [];

        // Build a unique key per (bl_no, type, year, month)
        const seen = new Map<string, {
            blNo: string; client: string; type: TransactionType;
            year: ArchiveYear; month: number; fileCount: number;
        }>();

        for (const yearData of archiveData) {
            for (const doc of yearData.documents) {
                const blNo = doc.bl_no || '(no BL)';
                const key  = `${blNo}|${doc.type}|${yearData.year}|${doc.month}`;
                if (!seen.has(key)) {
                    seen.set(key, { blNo, client: doc.client, type: doc.type, year: yearData, month: doc.month, fileCount: 0 });
                }
                seen.get(key)!.fileCount++;
            }
        }

        return [...seen.values()].filter(r =>
            r.blNo.toLowerCase().includes(q) || r.client.toLowerCase().includes(q)
        );
    }, [globalSearch, archiveData]);

    const handleGlobalResultClick = (r: { blNo: string; type: TransactionType; year: ArchiveYear; month: number }) => {
        nav({ level: 'files', year: r.year, type: r.type, month: r.month, bl: r.blNo });
    };

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

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-amber-500/25 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-text-muted font-medium">Loading archives…</p>
        </div>
    );

    if (isError) return (
        <EmptyState
            icon="alert-circle"
            title="Failed to load archives"
            subtitle="Check your connection and try again."
        />
    );

    // ── Stats ──────────────────────────────────────────────────────────────────
    const uniqueBLs    = new Set(archiveData.flatMap(y => y.documents.map(d => d.bl_no))).size;
    const totalImports  = archiveData.reduce((s, y) => s + y.imports, 0);
    const totalExports  = archiveData.reduce((s, y) => s + y.exports, 0);
    const yearRange    = archiveData.length > 0
        ? `${Math.min(...archiveData.map(y => y.year))} – ${Math.max(...archiveData.map(y => y.year))}`
        : '—';

    // ── Breadcrumb ─────────────────────────────────────────────────────────────
    const baseCrumb = { label: 'Archives', onClick: drill.level !== 'years' ? () => nav({ level: 'years' }) : undefined };
    const breadcrumbParts = (() => {
        if (drill.level === 'years')  return [baseCrumb];
        if (drill.level === 'types')  return [baseCrumb, { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) }];
        if (drill.level === 'months') return [baseCrumb, { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) }, { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) }];
        if (drill.level === 'bls')    return [baseCrumb, { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) }, { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) }, { label: MONTH_NAMES[drill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: drill.year, type: drill.type, month: drill.month }) }];
        return [baseCrumb, { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) }, { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) }, { label: MONTH_NAMES[drill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: drill.year, type: drill.type, month: drill.month }) }, { label: drill.bl + '/' }];
    })();

    return (
        <div className="space-y-6 p-4 pb-8">

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="#ff9f0a" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black tracking-tight text-text-primary">Records Archive</h1>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">Historical records · past import &amp; export transactions</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-text-secondary">{dateTime.time}</p>
                    <p className="text-xs text-text-muted">{dateTime.date}</p>
                </div>
            </div>

            {/* ── Global search ───────────────────────────────────────────── */}
            <div className="relative">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={globalSearch}
                    onChange={e => setGlobalSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && setGlobalSearch('')}
                    placeholder="Search any BL number or client across all years…"
                    className="w-full pl-10 pr-10 h-10 rounded-xl border border-border-strong bg-surface text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all shadow-sm"
                />
                {globalSearch && (
                    <button
                        onClick={() => setGlobalSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                        title="Clear search (Esc)">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* ── KPI cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* BL Records — the primary unit of work for a customs broker */}
                <KpiCard
                    label="BL Records"
                    value={uniqueBLs.toLocaleString()}
                    accentColor="#ff9f0a"
                    bgColor="rgba(255,159,10,0.1)"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="#ff9f0a" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    }
                />
                {/* Import entries — inbound customs clearance */}
                <KpiCard
                    label="Import Entries"
                    value={totalImports.toLocaleString()}
                    accentColor="#22c55e"
                    bgColor="rgba(34,197,94,0.1)"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                d="M3 16l4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16" />
                        </svg>
                    }
                />
                {/* Export entries — outbound customs clearance */}
                <KpiCard
                    label="Export Entries"
                    value={totalExports.toLocaleString()}
                    accentColor="#3b82f6"
                    bgColor="rgba(59,130,246,0.1)"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                d="M21 16l-4 4-4-4m4 4V4M3 8l4-4 4 4M7 4v16" />
                        </svg>
                    }
                />
                {/* Years on record — archive depth */}
                <KpiCard
                    label="Years on Record"
                    value={yearRange}
                    accentColor="#f59e0b"
                    bgColor="rgba(245,158,11,0.1)"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                />
            </div>

            {/* ── File browser card ────────────────────────────────────────── */}
            <div className="rounded-xl border border-border overflow-hidden bg-surface shadow-sm">

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface">
                    <Breadcrumb parts={breadcrumbParts} />

                    <div className="flex items-center gap-2 ml-auto shrink-0">

                        {/* Sort — BL level only */}
                        {drill.level === 'bls' && (
                            <select
                                value={`${sortKey}:${sortDir}`}
                                onChange={e => {
                                    const [k, d] = e.target.value.split(':');
                                    setSortKey(k as SortKey);
                                    setSortDir(d as 'asc' | 'desc');
                                }}
                                className="h-8 px-2 rounded-lg border border-border-strong bg-input-bg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all"
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

                        {/* Upload CTA */}
                        <button onClick={() => setShowLegacyUpload(true)}
                            className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-bold text-white shrink-0 transition-opacity hover:opacity-90 active:opacity-80"
                            style={{ backgroundColor: '#ff9f0a' }}>
                            <Icon name="plus" className="w-3.5 h-3.5" />
                            Upload
                        </button>
                    </div>
                </div>

                {/* ── Global search results ──────────────────────────────────── */}
                {globalSearch.trim() && (() => {
                    if (globalResults.length === 0) return (
                        <div className="py-16 flex flex-col items-center gap-2 text-text-muted">
                            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-sm font-semibold text-text-primary">No matches found</p>
                            <p className="text-xs">No BL or client matches <span className="font-mono font-semibold">"{globalSearch}"</span></p>
                        </div>
                    );
                    return (
                        <div>
                            <div className="px-4 py-2 border-b border-border bg-surface-secondary">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                    {globalResults.length} result{globalResults.length !== 1 ? 's' : ''} across all years
                                </span>
                            </div>
                            {globalResults.map((r, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleGlobalResultClick(r)}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/60 hover:bg-hover transition-colors text-left group"
                                >
                                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                        r.type === 'import' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                                    }`}>
                                        {r.type === 'import' ? 'IMP' : 'EXP'}
                                    </span>
                                    <span className="font-mono text-sm font-bold text-text-primary group-hover:underline underline-offset-2 decoration-border-strong truncate">
                                        {r.blNo}
                                    </span>
                                    <span className="text-xs text-text-muted truncate flex-1">
                                        {toTitleCase(r.client || '—')}
                                    </span>
                                    <span className="text-xs text-text-muted shrink-0 tabular-nums">
                                        {MONTH_NAMES[r.month - 1].slice(0, 3)} {r.year.year}
                                    </span>
                                    <span className="text-[10px] font-semibold text-text-muted shrink-0 tabular-nums">
                                        {r.fileCount} {r.fileCount === 1 ? 'file' : 'files'}
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 1: Year folders ─────────────────────────────────── */}
                {!globalSearch.trim() && drill.level === 'years' && (() => {
                    if (archiveData.length === 0) return (
                        <EmptyState
                            icon="archive"
                            title="No archives yet"
                            subtitle="Upload legacy files to start building the archive."
                            action={
                                <button onClick={() => setShowLegacyUpload(true)}
                                    className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: '#ff9f0a' }}>
                                    <Icon name="plus" className="w-3.5 h-3.5" />
                                    Upload First Record
                                </button>
                            }
                        />
                    );
                    return (
                        <div>
                            <ColHeader
                                cols={['', 'Name', 'Files', 'BL Records', '']}
                                template="24px 1fr 80px 100px 24px"
                                alignRight={new Set([2, 3])}
                            />
                            {archiveData.map(yr => (
                                <ArchiveYearCard key={yr.year} archive={yr} onClick={() => nav({ level: 'types', year: yr })} />
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 2: Type folders ─────────────────────────────────── */}
                {!globalSearch.trim() && drill.level === 'types' && (() => {
                    const types: TransactionType[] = ['import', 'export'];
                    return (
                        <div>
                            <ColHeader cols={['', 'Name', 'Files', '']} template="24px 1fr 80px 24px" alignRight={new Set([2])} />
                            {types.map(txType => {
                                const count = drill.year.documents.filter(d => d.type === txType).length;
                                if (count === 0) return null;
                                return (
                                    <FolderRow key={txType}
                                        icon={<FolderSVG color={FOLDER_COLOR[txType]} />}
                                        label={FOLDER_LABEL[txType] + '/'}
                                        meta={`${count} ${count === 1 ? 'file' : 'files'}`}
                                        onClick={() => nav({ level: 'months', year: drill.year, type: txType })}
                                        template="24px 1fr 80px 24px"
                                    />
                                );
                            })}
                        </div>
                    );
                })()}

                {/* ── LEVEL 3: Month folders ────────────────────────────────── */}
                {!globalSearch.trim() && drill.level === 'months' && (() => {
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
                            <ColHeader cols={['', 'Name', 'Files', '']} template="24px 1fr 80px 24px" alignRight={new Set([2])} />
                            {sortedMonths.map(({ month, count }) => (
                                <FolderRow key={month}
                                    icon={<FolderSVG color={color} />}
                                    label={MONTH_NAMES[month - 1] + '/'}
                                    meta={`${count} ${count === 1 ? 'file' : 'files'}`}
                                    onClick={() => nav({ level: 'bls', year: drill.year, type: drill.type, month })}
                                    template="24px 1fr 80px 24px"
                                />
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 4: BL folders ───────────────────────────────────── */}
                {!globalSearch.trim() && drill.level === 'bls' && (() => {
                    const typeDocs = drill.year.documents.filter(d => d.type === drill.type && d.month === drill.month);
                    const blGroups = typeDocs.reduce<Record<string, ArchiveDocument[]>>((acc, d) => {
                        const key = d.bl_no || '(no BL)';
                        acc[key] = [...(acc[key] ?? []), d];
                        return acc;
                    }, {});

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
                            const aDate = aDocs[0]?.transaction_date ?? '';
                            const bDate = bDocs[0]?.transaction_date ?? '';
                            return aDate.localeCompare(bDate) * dir;
                        });

                    const color = FOLDER_COLOR[drill.type];

                    const formatPeriod = (dateStr: string) => {
                        const d = new Date(dateStr + 'T00:00:00');
                        const month = d.toLocaleString('en-US', { month: 'short' });
                        const day   = d.getDate();
                        const year  = d.getFullYear();
                        const lastDayOfMonth = new Date(year, d.getMonth() + 1, 0).getDate();
                        const isMonthOnly = day === 1 || day === lastDayOfMonth;
                        return isMonthOnly ? `${month} ${year}` : `${month} ${day}, ${year}`;
                    };

                    const isImport = drill.type === 'import';
                    const COL = isImport
                        ? '20px 1fr 1fr 80px 80px 100px 32px 20px'
                        : '20px 1fr 1fr 1fr 100px 100px 32px 20px';

                    return (
                        <div>
                            <ColHeader
                                cols={isImport
                                    ? ['', 'BL Number', 'Importer', 'BLSC', 'Period', 'Stages', '', '']
                                    : ['', 'BL Number', 'Shipper', 'Destination', 'Period', 'Stages', '', '']}
                                template={COL}
                            />
                            {filteredBlEntries.length === 0 ? (
                                <EmptyState
                                    icon="file-text"
                                    title={search ? `No BLs match "${search}"` : 'No records in this folder'}
                                />
                            ) : filteredBlEntries.map(([blNo, blDocs]) => {
                                const firstDoc     = blDocs[0];
                                const uploadedKeys = new Set(blDocs.map(d => d.stage));
                                const stageList    = isImport ? IMPORT_STAGES : EXPORT_STAGES;

                                return (
                                    <div key={blNo}
                                        className="grid items-center gap-4 px-4 py-3.5 border-b border-border/50 hover:bg-hover transition-colors group"
                                        style={{ gridTemplateColumns: COL }}>
                                        <FolderSVG color={color} />

                                        {/* BL Number */}
                                        <button
                                            onClick={() => nav({ level: 'files', year: drill.year, type: drill.type, month: drill.month, bl: blNo })}
                                            className="text-sm font-bold text-text-primary truncate text-left font-mono group-hover:underline underline-offset-2 decoration-border-strong">
                                            {blNo}/
                                        </button>

                                        {/* Client (Importer / Shipper) */}
                                        <span className="text-xs text-text-secondary truncate">
                                            {toTitleCase(firstDoc?.client ?? '—')}
                                        </span>

                                        {/* Type-specific column: BLSC or Destination */}
                                        {isImport ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold truncate">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                    firstDoc?.selective_color === 'red'    ? 'bg-red-500' :
                                                    firstDoc?.selective_color === 'yellow' ? 'bg-yellow-400' :
                                                    'bg-green-500'
                                                }`} />
                                                <span className="capitalize text-text-secondary">
                                                    {firstDoc?.selective_color ?? 'Green'}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-xs text-text-secondary truncate" title={firstDoc?.destination_country ?? undefined}>
                                                {firstDoc?.destination_country ?? '—'}
                                            </span>
                                        )}

                                        {/* Period */}
                                        <span className="text-xs text-text-muted tabular-nums">
                                            {firstDoc?.transaction_date ? formatPeriod(firstDoc.transaction_date) : '—'}
                                        </span>

                                        {/* Stage count */}
                                        <StageCount stageList={stageList} uploadedKeys={uploadedKeys} />

                                        {/* Add doc */}
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setAddDocModal({ isOpen: true, blNo, type: drill.type, docs: blDocs });
                                            }}
                                            title="Add document"
                                            className="w-7 h-7 rounded-lg flex items-center justify-center border border-border text-text-muted hover:bg-hover hover:text-text-primary hover:border-border-strong transition-all">
                                            <Icon name="plus" className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Open */}
                                        <button
                                            onClick={() => nav({ level: 'files', year: drill.year, type: drill.type, month: drill.month, bl: blNo })}
                                            title="Open folder"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}

                {/* ── LEVEL 5: Files ────────────────────────────────────────── */}
                {drill.level === 'files' && (() => {
                    const fileDocs = drill.year.documents
                        .filter(d => d.type === drill.type && d.month === drill.month && (d.bl_no || '(no BL)') === drill.bl);

                    if (fileDocs.length === 0) return (
                        <EmptyState icon="file-text" title="No files in this folder" />
                    );

                    return (
                        <div>
                            <ColHeader
                                cols={['', 'File', 'Stage', 'Uploaded', 'By', '']}
                                template="28px 1fr 1.4fr 80px 28px 48px"
                            />
                            {fileDocs.map(doc => (
                                <ArchiveDocumentRow key={doc.id} doc={doc} onDelete={handleDeleteArchiveDoc} />
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* ── Modals ──────────────────────────────────────────────────── */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmButtonClass={confirmModal.confirmButtonClass}
            />
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
