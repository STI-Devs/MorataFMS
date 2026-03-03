import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Icon } from '../../../components/Icon';
import { trackingApi } from '../api/trackingApi';
import { useArchives } from '../hooks/useArchives';
import type { LayoutContext } from '../types';
import type { ArchiveDocument, ArchiveYear, TransactionType } from '../types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../types/document.types';
import { AddArchiveDocumentModal } from './archive/AddArchiveDocumentModal';
import { ArchiveDocumentRow } from './archive/ArchiveDocumentRow';
import { ArchiveLegacyUploadPage } from './archive/ArchiveLegacyUploadPage';
import { ArchivesFolderView } from './archive/ArchivesFolderView';
import { ArchivesBLView, ArchivesDocumentView, GlobalSearchResults } from './archive/ArchivesViews';
import { ExportReportDropdown } from './archive/ExportReportDropdown';
import { Breadcrumb } from './archive/ui/Breadcrumb';
import { CircularProgress } from './archive/ui/CircularProgress';
import { ColHeader } from './archive/ui/ColHeader';
import { EmptyState } from './archive/ui/EmptyState';
import { ViewToggle } from './archive/ui/ViewToggle';
import type { DocStatusFilter, DrillState, SortKey, ViewMode } from './archive/utils/archive.utils';
import {
    computeGlobalCompleteness, countIncompleteBLs,
    FOLDER_LABEL, MONTH_NAMES,
} from './archive/utils/archive.utils';

export const ArchivesPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const queryClient  = useQueryClient();
    const { data: archiveData = [], isLoading, isError } = useArchives();

    // ── State ──────────────────────────────────────────────────────────────────
    const [drill, setDrill]                       = useState<DrillState>({ level: 'years' });
    const [showLegacyUpload, setShowLegacyUpload] = useState(false);
    const [search, setSearch]                     = useState('');
    const [globalSearch, setGlobalSearch]         = useState('');
    const [sortKey, setSortKey]                   = useState<SortKey>('period');
    const [sortDir, setSortDir]                   = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode]                 = useState<ViewMode>('folder');
    const [filterYear, setFilterYear]             = useState<string>('all');
    const [filterType, setFilterType]             = useState<string>('all');
    const [filterStatus, setFilterStatus]         = useState<DocStatusFilter>('all');
    const [incompleteFilterActive, setIncompleteFilterActive] = useState(false);
    const [expandedYears, setExpandedYears]       = useState<Set<number>>(new Set());
    const [openMenuKey, setOpenMenuKey]           = useState<string | null>(null);

    const [addDocModal, setAddDocModal] = useState<{
        isOpen: boolean; blNo: string; type: TransactionType; docs: ArchiveDocument[];
    }>({ isOpen: false, blNo: '', type: 'import', docs: [] });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string;
        confirmText?: string; confirmButtonClass?: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // ── Helpers ────────────────────────────────────────────────────────────────
    const toggleYear = (year: number) =>
        setExpandedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) {
                next.delete(year);
            } else {
                next.add(year);
            }
            return next;
        });

    const openConfirm = (title: string, message: string, onConfirm: () => void) =>
        setConfirmModal({ isOpen: true, title, message, confirmText: 'Delete', confirmButtonClass: 'bg-red-600 hover:bg-red-700', onConfirm });

    const handleDeleteArchiveDoc = (docId: number) =>
        openConfirm('Delete Archive Document', 'This will permanently remove this legacy document. Continue?', async () => {
            await trackingApi.deleteDocument(docId);
            queryClient.invalidateQueries({ queryKey: ['archives'] });
        });

    const nav = (next: DrillState) => { setDrill(next); setSearch(''); setGlobalSearch(''); setIncompleteFilterActive(false); };

    // ── Computed ───────────────────────────────────────────────────────────────
    const globalResults = useMemo(() => {
        const q = globalSearch.trim().toLowerCase();
        if (!q) return [];
        const seen = new Map<string, { blNo: string; client: string; type: TransactionType; year: ArchiveYear; month: number; fileCount: number; }>();
        for (const yearData of archiveData) {
            for (const doc of yearData.documents) {
                const blNo = doc.bl_no || '(no BL)';
                const key  = `${blNo}|${doc.type}|${yearData.year}|${doc.month}`;
                if (!seen.has(key)) seen.set(key, { blNo, client: doc.client, type: doc.type, year: yearData, month: doc.month, fileCount: 0 });
                seen.get(key)!.fileCount++;
            }
        }
        return [...seen.values()].filter(r => r.blNo.toLowerCase().includes(q) || r.client.toLowerCase().includes(q));
    }, [globalSearch, archiveData]);

    const flatDocumentList = useMemo(() => {
        const blMap = new Map<string, { blNo: string; client: string; type: TransactionType; year: number; month: number; stages: Set<string>; yearData: ArchiveYear }>();
        for (const yearData of archiveData) {
            for (const doc of yearData.documents) {
                const blNo = doc.bl_no || '(no BL)';
                const key  = `${blNo}|${doc.type}|${yearData.year}`;
                if (!blMap.has(key)) blMap.set(key, { blNo, client: doc.client, type: doc.type, year: yearData.year, month: doc.month, stages: new Set(), yearData });
                blMap.get(key)!.stages.add(doc.stage);
            }
        }
        return [...blMap.values()].filter(r => {
            const q = globalSearch.trim().toLowerCase();
            if (q && !r.blNo.toLowerCase().includes(q) && !r.client.toLowerCase().includes(q)) return false;
            if (filterYear !== 'all' && String(r.year) !== filterYear) return false;
            if (filterType !== 'all' && r.type !== filterType) return false;
            const required = r.type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
            const isComplete = required.every(s => r.stages.has(s.key));
            if (filterStatus === 'complete'   && !isComplete) return false;
            if (filterStatus === 'incomplete' &&  isComplete) return false;
            if (incompleteFilterActive && isComplete) return false;
            return true;
        });
    }, [archiveData, globalSearch, filterYear, filterType, filterStatus, incompleteFilterActive]);

    // ── Early returns ──────────────────────────────────────────────────────────
    if (showLegacyUpload) {
        const currentYear = drill.level !== 'years' ? drill.year.year : new Date().getFullYear() - 1;
        return (
            <ArchiveLegacyUploadPage
                defaultYear={currentYear}
                onBack={() => setShowLegacyUpload(false)}
                onSubmit={() => { setShowLegacyUpload(false); queryClient.invalidateQueries({ queryKey: ['archives'] }); }}
            />
        );
    }

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-orange-400/25 border-t-orange-400 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading archives…</p>
        </div>
    );

    if (isError) return (
        <EmptyState icon="alert-circle" title="Failed to load archives" subtitle="Check your connection and try again." />
    );

    // ── Stats ──────────────────────────────────────────────────────────────────
    const globalPct     = computeGlobalCompleteness(archiveData);
    const incompleteBLs = countIncompleteBLs(archiveData);
    const totalBLs      = new Set(archiveData.flatMap(y => y.documents.map(d => `${d.bl_no}|${d.type}|${y.year}`))).size;
    const completedBLs  = totalBLs - incompleteBLs;
    const totalImports  = archiveData.reduce((s, y) => s + y.imports, 0);
    const totalExports  = archiveData.reduce((s, y) => s + y.exports, 0);
    const totalDocs     = archiveData.reduce((s, y) => s + y.documents.length, 0);
    const totalStorageBytes = archiveData.reduce(
        (s, y) => s + y.documents.reduce((ds, d) => ds + (d.size_bytes ?? 0), 0), 0
    );
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
    };
    const availableYears = archiveData.map(y => y.year);
    const oldestYear = availableYears.length ? Math.min(...availableYears) : null;
    const newestYear = availableYears.length ? Math.max(...availableYears) : null;

    // ── Breadcrumb ─────────────────────────────────────────────────────────────
    // navToYear: go back to the year accordion AND auto-expand that year so
    // the sub-folders are immediately visible (avoids the empty 'types'/'months' states).
    const navToYear = (yr: ArchiveYear) => {
        nav({ level: 'years' });
        setExpandedYears(prev => new Set([...prev, yr.year]));
    };

    const baseCrumb = { label: 'Archives', onClick: drill.level !== 'years' ? () => nav({ level: 'years' }) : undefined };
    const breadcrumbParts = (() => {
        if (drill.level === 'years')  return [baseCrumb];
        if (drill.level === 'types')  return [baseCrumb, { label: String(drill.year.year) }];
        if (drill.level === 'months') return [baseCrumb, { label: String(drill.year.year), onClick: () => navToYear(drill.year) }, { label: FOLDER_LABEL[drill.type as keyof typeof FOLDER_LABEL] + '/' }];
        if (drill.level === 'bls')    return [baseCrumb, { label: String(drill.year.year), onClick: () => navToYear(drill.year) }, { label: FOLDER_LABEL[drill.type as keyof typeof FOLDER_LABEL] + '/', onClick: () => navToYear(drill.year) }, { label: MONTH_NAMES[drill.month - 1] + '/' }];
        return [baseCrumb, { label: String(drill.year.year), onClick: () => navToYear(drill.year) }, { label: FOLDER_LABEL[drill.type as keyof typeof FOLDER_LABEL] + '/', onClick: () => navToYear(drill.year) }, { label: MONTH_NAMES[drill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: drill.year, type: drill.type, month: drill.month }) }, { label: drill.bl + '/' }];
    })();

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-10 space-y-5">

            {/* Page header */}
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-xl font-black tracking-tight text-gray-800">Archive Dashboard</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Historical import &amp; export document storage</p>
                </div>
                <div className="ml-auto text-right hidden sm:block">
                    <p className="text-sm font-semibold tabular-nums text-gray-600">{dateTime.time}</p>
                    <p className="text-xs text-gray-400">{dateTime.date}</p>
                </div>
            </div>

            {/* Top summary card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {/* Left: completeness ring + KPIs */}
                    <div className="p-5 flex items-start gap-5 min-w-0">
                        <div className="shrink-0 flex flex-col items-center">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Archive Completeness</p>
                            <CircularProgress pct={globalPct} />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total BL Records</p>
                                <p className="text-2xl font-black text-gray-800 tabular-nums leading-tight mt-0.5">{totalBLs.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{oldestYear && newestYear ? `${oldestYear} – ${newestYear}` : 'No records'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fully Documented</p>
                                <p className="text-2xl font-black text-emerald-600 tabular-nums leading-tight mt-0.5">{completedBLs.toLocaleString()}</p>
                                <p className="text-[10px] text-emerald-500 mt-0.5">Compliant records</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Missing Documents</p>
                                <p className="text-2xl font-black text-red-500 tabular-nums leading-tight mt-0.5">{incompleteBLs.toLocaleString()}</p>
                                <p className="text-[10px] text-red-400 mt-0.5">Incomplete records</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">I/E Split</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-lg font-black text-blue-600 tabular-nums">{totalImports}</span>
                                    <span className="text-[10px] font-bold text-blue-400 uppercase">Import</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-black text-indigo-600 tabular-nums">{totalExports}</span>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Export</span>
                                </div>
                            </div>
                            {/* Storage — spans full row */}
                            <div className="col-span-2 pt-2.5 mt-1 border-t border-gray-100 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Storage Used</p>
                                    <p className="text-2xl font-black text-gray-800 tabular-nums leading-tight mt-0.5">
                                        {formatBytes(totalStorageBytes)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{totalDocs.toLocaleString()} files stored in cloud</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                    </svg>
                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Cloud Storage</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: filters */}
                    <div className="p-5 flex-1">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Year</p>
                                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 cursor-pointer shadow-sm appearance-none">
                                    <option value="all">All Years</option>
                                    {availableYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                                {filterYear !== 'all' && (
                                    <button onClick={() => setFilterYear('all')}
                                        className="mt-1.5 text-[10px] text-orange-500 hover:text-orange-700 font-semibold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear filter
                                    </button>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">I/E Type</p>
                                <div className="flex flex-col gap-1.5">
                                    {(['all', 'import', 'export'] as const).map(t => (
                                        <button key={t} onClick={() => setFilterType(t)}
                                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all w-full ${filterType === t ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                            {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Document Status</p>
                                <div className="flex flex-col gap-1.5">
                                    {([{ value: 'all', label: 'All' }, { value: 'complete', label: 'Complete' }, { value: 'incomplete', label: 'Incomplete' }] as const).map(({ value, label }) => (
                                        <button key={value}
                                            onClick={() => { setFilterStatus(value); setIncompleteFilterActive(false); }}
                                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all w-full ${filterStatus === value ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search + Upload row */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={globalSearch}
                        onChange={e => setGlobalSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Escape' && setGlobalSearch('')}
                        placeholder="Search BL No., Importer, Exporter, Year…"
                        className="w-full pl-10 pr-10 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/60 transition-all shadow-sm" />
                    {globalSearch && (
                        <button onClick={() => setGlobalSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <ExportReportDropdown archiveData={archiveData} availableYears={availableYears} />
                <button onClick={() => setShowLegacyUpload(true)}
                    className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-bold text-white shrink-0 hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: '#f97316' }}>
                    <Icon name="plus" className="w-4 h-4" />
                    Upload Document
                </button>
            </div>

            {/* Browser card */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">

                {/* Toolbar: breadcrumb + sort + view toggle */}
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                        {viewMode === 'document' ? (
                            <>
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-700">All BL Records</span>
                                <span className="text-xs text-gray-400 font-medium">· {flatDocumentList.length} entries</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                </svg>
                                <Breadcrumb parts={breadcrumbParts} />
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        {drill.level === 'bls' && viewMode === 'folder' && (
                            <select value={`${sortKey}:${sortDir}`}
                                onChange={e => { const [k, d] = e.target.value.split(':'); setSortKey(k as SortKey); setSortDir(d as 'asc' | 'desc'); }}
                                className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400/40">
                                <option value="period:desc">Period ↓ (Newest)</option>
                                <option value="period:asc">Period ↑ (Oldest)</option>
                                <option value="bl:asc">BL Number A→Z</option>
                                <option value="bl:desc">BL Number Z→A</option>
                                <option value="client:asc">Client A→Z</option>
                                <option value="files:desc">Most Files</option>
                                <option value="files:asc">Fewest Files</option>
                            </select>
                        )}
                        <ViewToggle mode={viewMode} onChange={m => { setViewMode(m); if (m === 'folder') { setFilterStatus('all'); setIncompleteFilterActive(false); } }} />
                    </div>
                </div>

                {/* Flat document view */}
                {viewMode === 'document' && (
                    <ArchivesDocumentView
                        flatDocumentList={flatDocumentList}
                        nav={nav}
                        setViewMode={setViewMode}
                    />
                )}

                {/* Global search results */}
                {viewMode === 'folder' && globalSearch.trim() && (
                    <GlobalSearchResults
                        globalSearch={globalSearch}
                        globalResults={globalResults}
                        nav={nav}
                        setGlobalSearch={setGlobalSearch}
                    />
                )}

                {/* Year accordion (folder view) */}
                {viewMode === 'folder' && !globalSearch.trim() && drill.level === 'years' && (
                    <ArchivesFolderView
                        archiveData={archiveData}
                        filterYear={filterYear}
                        filterType={filterType}
                        filterStatus={filterStatus}
                        expandedYears={expandedYears}
                        toggleYear={toggleYear}
                        nav={nav}
                        openMenuKey={openMenuKey}
                        setOpenMenuKey={setOpenMenuKey}
                        onOpenUpload={() => setShowLegacyUpload(true)}
                    />
                )}

                {/* BL folder view (drill level: bls) */}
                {viewMode === 'folder' && !globalSearch.trim() && drill.level === 'bls' && (
                    <ArchivesBLView
                        drill={drill}
                        search={search}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        nav={nav}
                        onAddDoc={(blNo, type, docs) => setAddDocModal({ isOpen: true, blNo, type, docs })}
                    />
                )}

                {/* File view (drill level: files) */}
                {drill.level === 'files' && (() => {
                    const fileDocs = drill.year.documents
                        .filter((d: ArchiveDocument) => d.type === drill.type && d.month === drill.month && (d.bl_no || '(no BL)') === drill.bl);
                    if (fileDocs.length === 0) return <EmptyState icon="file-text" title="No files in this folder" />;
                    return (
                        <div>
                            <ColHeader cols={['', 'File', 'Stage', 'Uploaded', 'By', '']} template="28px 1fr 1.4fr 80px 28px 48px" />
                            {fileDocs.map((doc: ArchiveDocument) => (
                                <ArchiveDocumentRow key={doc.id} doc={doc} onDelete={handleDeleteArchiveDoc} />
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Modals */}
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
