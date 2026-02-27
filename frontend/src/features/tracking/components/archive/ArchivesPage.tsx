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

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, subtitle, action }: {
    icon: string; title: string; subtitle?: string; action?: React.ReactNode;
}) => (
    <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
        <Icon name={icon} className="w-10 h-10 opacity-30" />
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs">{subtitle}</p>}
        {action}
    </div>
);

// ─── Folder row ───────────────────────────────────────────────────────────────
const FolderRow = ({
    icon, label, meta, onClick,
}: {
    icon: React.ReactNode; label: string; meta: string; onClick: () => void;
}) => (
    <button onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/60 hover:bg-hover transition-colors text-left group">
        {icon}
        <span className="text-sm font-semibold text-text-primary flex-1 truncate group-hover:underline underline-offset-2 decoration-border-strong">
            {label}
        </span>
        <span className="text-xs text-text-muted shrink-0 tabular-nums">{meta}</span>
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

// ─── Column header row ────────────────────────────────────────────────────────
const ColHeader = ({ cols, template }: { cols: string[]; template: string }) => (
    <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-secondary sticky top-0 z-10"
        style={{ gridTemplateColumns: template }}>
        {cols.map((h, i) => (
            <span key={i} className="text-[10px] font-bold text-text-muted uppercase tracking-widest truncate">{h}</span>
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

// ─── Archival divider ─────────────────────────────────────────────────────────
const ArchivalDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,159,10,0.2)' }} />
        {label && (
            <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: 'rgba(255,159,10,0.45)' }}>
                {label}
            </span>
        )}
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,159,10,0.2)' }} />
    </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
    const [globalSearch, setGlobalSearch]  = useState('');
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
            { label: String(drill.year.year) },
        ];
        if (drill.level === 'months') return [
            baseCrumb,
            { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) },
            { label: FOLDER_LABEL[drill.type] + '/' },
        ];
        if (drill.level === 'bls') return [
            baseCrumb,
            { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) },
            { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) },
            { label: MONTH_NAMES[drill.month - 1] + '/' },
        ];
        return [
            baseCrumb,
            { label: String(drill.year.year), onClick: () => nav({ level: 'types', year: drill.year }) },
            { label: FOLDER_LABEL[drill.type] + '/', onClick: () => nav({ level: 'months', year: drill.year, type: drill.type }) },
            { label: MONTH_NAMES[drill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: drill.year, type: drill.type, month: drill.month }) },
            { label: drill.bl + '/' },
        ];
    })();

    // ── Stats ──────────────────────────────────────────────────────────────────
    const totalDocs    = archiveData.reduce((s, y) => s + y.documents.length, 0);
    const uniqueBLs    = new Set(archiveData.flatMap(y => y.documents.map(d => d.bl_no))).size;
    const totalImports = archiveData.reduce((s, y) => s + y.imports, 0);
    const totalExports = archiveData.reduce((s, y) => s + y.exports, 0);
    const yearRange    = archiveData.length > 0
        ? `${Math.min(...archiveData.map(y => y.year))}–${Math.max(...archiveData.map(y => y.year))}`
        : '—';

    // ── Global search results ──────────────────────────────────────────────────
    const globalResults = globalSearch.trim()
        ? archiveData.flatMap(yr =>
            yr.documents.filter(d => {
                const q = globalSearch.toLowerCase();
                return d.bl_no?.toLowerCase().includes(q) ||
                    d.client?.toLowerCase().includes(q) ||
                    d.filename?.toLowerCase().includes(q);
            }).map(d => ({ ...d, year: yr.year }))
        )
        : [];

    return (
        <div className="space-y-5 p-4">

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
                        style={{ borderColor: 'rgba(255,159,10,0.35)', backgroundColor: 'rgba(255,159,10,0.07)' }}>
                        <svg className="w-6 h-6" fill="none" stroke="#ff9f0a" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-text-primary">Records Archive</h1>
                        <p className="text-xs text-text-muted mt-0.5">Historical records · past import & export transactions</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'BLs', value: uniqueBLs.toLocaleString(), accent: '#3b82f6',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />,
                    },
                    {
                        label: 'Import Entries', value: totalImports.toLocaleString(), accent: '#22c55e',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m10 8a4 4 0 11-8 0 4 4 0 018 0z" />,
                    },
                    {
                        label: 'Export Entries', value: totalExports.toLocaleString(), accent: '#0a84ff',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8V20m0 0l4-4m-4 4l-4-4M7 4a4 4 0 110 8 4 4 0 010-8z" />,
                    },
                    {
                        label: 'Years', value: yearRange, accent: '#ff9f0a',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                    },
                ].map(({ label, value, accent, icon }) => (
                    <div key={label} className="rounded-lg border border-border bg-surface p-4 relative overflow-hidden">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</p>
                                <p className="text-xl font-black text-text-primary tabular-nums mt-1">{value}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${accent}14` }}>
                                <svg className="w-4.5 h-4.5" fill="none" stroke={accent} viewBox="0 0 24 24">{icon}</svg>
                            </div>
                        </div>
                        {/* Subtle bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: `${accent}30` }} />
                    </div>
                ))}
            </div>

            {/* ── S3-style browser ─────────────────────────────────────────── */}
            <div className="rounded-lg border border-border overflow-hidden bg-surface">

                {/* Browser toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle">
                    <Breadcrumb parts={breadcrumbParts} />

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Global search — year level */}
                        {drill.level === 'years' && (
                            <div className="relative">
                                <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
                                    placeholder="Search BL / client / file…"
                                    className="pl-8 pr-3 h-8 w-52 rounded-md border border-border-strong bg-input-bg text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors" />
                            </div>
                        )}

                        {/* Search — BL folder level only */}
                        {drill.level === 'bls' && (
                            <div className="relative">
                                <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
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

                {/* ── Global search results ─────────────────────────────── */}
                {globalSearch.trim() && (() => {
                    if (globalResults.length === 0) return (
                        <EmptyState icon="search" title={`No results for "${globalSearch}"`} subtitle="Try a different BL number, client name, or filename." />
                    );
                    return (
                        <div>
                            <div className="px-4 py-2 border-b border-border bg-surface-subtle">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    {globalResults.length} result{globalResults.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {globalResults.map(doc => (
                                <ArchiveDocumentRow key={doc.id} doc={doc} onDelete={handleDeleteArchiveDoc} />
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 1: Year folders ─────────────────────────────── */}
                {!globalSearch.trim() && drill.level === 'years' && (() => {
                    if (archiveData.length === 0) return (
                        <EmptyState
                            icon="archive"
                            title="No archives yet"
                            subtitle="Upload legacy files to start building the archive."
                            action={
                                <button onClick={() => setShowLegacyUpload(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold text-white mt-2"
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
                            />
                            {archiveData.map(yr => (
                                <ArchiveYearCard key={yr.year} archive={yr} onClick={() => nav({ level: 'types', year: yr })} />
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 2: Type folders ─────────────────────────────── */}
                {!globalSearch.trim() && drill.level === 'types' && (() => {
                    const types: TransactionType[] = ['import', 'export'];
                    return (
                        <div>
                            <ColHeader cols={['', 'Name', 'Files', '']} template="24px 1fr 80px 24px" />
                            {types.map(txType => {
                                const count = drill.year.documents.filter(d => d.type === txType).length;
                                if (count === 0) return null;
                                return (
                                    <FolderRow key={txType}
                                        icon={<FolderSVG color={FOLDER_COLOR[txType]} />}
                                        label={FOLDER_LABEL[txType] + '/'}
                                        meta={`${count} ${count === 1 ? 'file' : 'files'}`}
                                        onClick={() => nav({ level: 'months', year: drill.year, type: txType })}
                                    />
                                );
                            })}
                        </div>
                    );
                })()}

                {/* ── LEVEL 3: Month folders ────────────────────────────── */}
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
                            <ColHeader cols={['', 'Name', 'Files', '']} template="24px 1fr 80px 24px" />
                            {sortedMonths.map(({ month, count }) => (
                                <FolderRow key={month}
                                    icon={<FolderSVG color={color} />}
                                    label={MONTH_NAMES[month - 1] + '/'}
                                    meta={`${count} ${count === 1 ? 'file' : 'files'}`}
                                    onClick={() => nav({ level: 'bls', year: drill.year, type: drill.type, month })}
                                />
                            ))}
                        </div>
                    );
                })()}

                {/* ── LEVEL 4: BL folders ───────────────────────────────── */}
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

                                        {/* Stages */}
                                        <StageCount stageList={stageList} uploadedKeys={uploadedKeys} />

                                        {/* Add document button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAddDocModal({ isOpen: true, blNo, type: drill.type, docs: blDocs });
                                            }}
                                            className="w-7 h-7 rounded-md flex items-center justify-center border border-border text-text-muted hover:bg-hover hover:text-text-primary transition-colors"
                                            title="Add document to this BL">
                                            <Icon name="plus" className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Chevron */}
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
                {!globalSearch.trim() && drill.level === 'files' && (() => {
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
