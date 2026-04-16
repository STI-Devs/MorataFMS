import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Icon } from '../../../components/Icon';
import type { ArchiveDocument, ArchiveYear, TransactionType } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import { useArchives } from '../hooks/useArchives';
import type {
    ArchiveUploadSuccessTarget,
    DocStatusFilter,
    DrillState,
    SortKey,
    ViewMode,
} from '../utils/archive.utils';
import {
    computeGlobalCompleteness, countIncompleteBLs,
    FOLDER_LABEL, MONTH_NAMES,
    getArchiveBlCompletion,
    prefetchArchiveEditLookups,
    resolveArchiveDrillTarget,
    syncArchiveDrillState,
} from '../utils/archive.utils';
import { exportArchiveCSV } from '../utils/export.utils';
import { AddArchiveDocumentModal } from './AddArchiveDocumentModal';
import { EditArchiveRecordModal } from './EditArchiveRecordModal';
import { ReplaceArchiveDocumentModal } from './ReplaceArchiveDocumentModal';
import { ArchiveDocumentRow } from './ArchiveDocumentRow';
import { ArchiveLegacyUploadPage } from './ArchiveLegacyUploadPage';
import { ArchiveRecordOverview } from './ArchiveRecordOverview';
import { ArchivesFolderView } from './ArchivesFolderView';
import { ArchivesBLView, ArchivesDocumentView, GlobalSearchResults } from './ArchivesViews';
import { Breadcrumb } from './ui/Breadcrumb';
import { CircularProgress } from './ui/CircularProgress';

import { EmptyState } from './ui/EmptyState';
import { ViewToggle } from './ui/ViewToggle';

export const ArchivesPage = () => {
    const queryClient = useQueryClient();
    const { data: archiveData = [], isLoading, isError } = useArchives();

    const [drill, setDrill] = useState<DrillState>({ level: 'years' });
    const [showLegacyUpload, setShowLegacyUpload] = useState(false);
    const [search, setSearch] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('period');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<ViewMode>('folder');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<DocStatusFilter>('all');
    const [incompleteFilterActive, setIncompleteFilterActive] = useState(false);
    const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
    const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

    const [addDocModal, setAddDocModal] = useState<{
        isOpen: boolean; blNo: string; type: TransactionType; docs: ArchiveDocument[];
    }>({ isOpen: false, blNo: '', type: 'import', docs: [] });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string;
        confirmText?: string; confirmButtonClass?: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [replaceDocModal, setReplaceDocModal] = useState<{
        isOpen: boolean; document: ArchiveDocument | null;
    }>({ isOpen: false, document: null });

    const [editRecordModal, setEditRecordModal] = useState<{
        isOpen: boolean; record: ArchiveDocument | null;
    }>({ isOpen: false, record: null });

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

    const handleArchiveUploadSuccess = async (target: ArchiveUploadSuccessTarget) => {
        await queryClient.invalidateQueries({ queryKey: ['archives'] });

        const refreshedArchiveData = queryClient.getQueryData<ArchiveYear[]>(['archives']) ?? [];
        const nextDrill = resolveArchiveDrillTarget(refreshedArchiveData, target);

        setShowLegacyUpload(false);
        setViewMode('folder');
        setGlobalSearch('');
        setSearch('');
        setFilterYear(String(target.year));
        setFilterType(target.type);
        setExpandedYears(new Set([target.year]));

        if (nextDrill) {
            setDrill(nextDrill);
            return;
        }

        setDrill({ level: 'years' });
    };

    const handleDeleteArchiveDoc = (docId: number) =>
        openConfirm('Delete Archive Document', 'This will permanently remove this legacy document. Continue?', async () => {
            await trackingApi.deleteDocument(docId);
            queryClient.invalidateQueries({ queryKey: ['archives'] });
        });

    const handleReplaceArchiveDoc = (doc: ArchiveDocument) => {
        setReplaceDocModal({ isOpen: true, document: doc });
    };

    const handleEditArchiveRecord = (doc: ArchiveDocument) => {
        void prefetchArchiveEditLookups(queryClient, doc);
        setEditRecordModal({ isOpen: true, record: doc });
    };

    const currentDrill = useMemo(
        () => syncArchiveDrillState(drill, archiveData),
        [drill, archiveData],
    );

    useEffect(() => {
        if (currentDrill.level !== 'files') {
            return;
        }

        const currentRecord = currentDrill.year.documents.find((doc) =>
            doc.type === currentDrill.type
            && doc.month === currentDrill.month
            && (doc.bl_no || '(no BL)') === currentDrill.bl,
        );

        if (!currentRecord) {
            return;
        }

        void prefetchArchiveEditLookups(queryClient, currentRecord);
    }, [currentDrill, queryClient]);

    const nav = (next: DrillState) => { setDrill(next); setSearch(''); setGlobalSearch(''); setIncompleteFilterActive(false); };

    const globalResults = useMemo(() => {
        const q = globalSearch.trim().toLowerCase();
        if (!q) return [];
        const seen = new Map<string, { blNo: string; client: string; type: TransactionType; year: ArchiveYear; month: number; fileCount: number; }>();
        for (const yearData of archiveData) {
            for (const doc of yearData.documents) {
                const blNo = doc.bl_no || '(no BL)';
                const key = `${blNo}|${doc.type}|${yearData.year}|${doc.month}`;
                if (!seen.has(key)) seen.set(key, { blNo, client: doc.client, type: doc.type, year: yearData, month: doc.month, fileCount: 0 });
                seen.get(key)!.fileCount++;
            }
        }
        return [...seen.values()].filter(r => r.blNo.toLowerCase().includes(q) || r.client.toLowerCase().includes(q));
    }, [globalSearch, archiveData]);

    const flatDocumentList = useMemo(() => {
        const blMap = new Map<string, { blNo: string; client: string; type: TransactionType; year: number; month: number; docs: ArchiveDocument[]; yearData: ArchiveYear }>();
        for (const yearData of archiveData) {
            for (const doc of yearData.documents) {
                const blNo = doc.bl_no || '(no BL)';
                const key = `${blNo}|${doc.type}|${yearData.year}`;
                if (!blMap.has(key)) blMap.set(key, { blNo, client: doc.client, type: doc.type, year: yearData.year, month: doc.month, docs: [], yearData });
                blMap.get(key)!.docs.push(doc);
            }
        }
        return [...blMap.values()].filter(r => {
            const q = globalSearch.trim().toLowerCase();
            if (q && !r.blNo.toLowerCase().includes(q) && !r.client.toLowerCase().includes(q)) return false;
            if (filterYear !== 'all' && String(r.year) !== filterYear) return false;
            if (filterType !== 'all' && r.type !== filterType) return false;
            const completion = getArchiveBlCompletion(r.docs, r.type);
            if (filterStatus === 'complete' && !completion.isComplete) return false;
            if (filterStatus === 'incomplete' && completion.isComplete) return false;
            if (incompleteFilterActive && completion.isComplete) return false;
            return true;
        });
    }, [archiveData, globalSearch, filterYear, filterType, filterStatus, incompleteFilterActive]);

    if (showLegacyUpload) {
        const currentYear = currentDrill.level !== 'years' ? currentDrill.year.year : new Date().getFullYear() - 1;
        return (
            <div className="flex justify-center py-10 px-6">
                <div className="w-full max-w-2xl">
                    <ArchiveLegacyUploadPage
                        defaultYear={currentYear}
                        onBack={() => setShowLegacyUpload(false)}
                        onSubmit={handleArchiveUploadSuccess}
                    />
                </div>
            </div>
        );
    }

    if (isError) return (
        <EmptyState icon="alert-circle" title="Failed to load archives" subtitle="Check your connection and try again." />
    );

    const globalPct = computeGlobalCompleteness(archiveData);
    const incompleteBLs = countIncompleteBLs(archiveData);
    const totalBLs = new Set(archiveData.flatMap(y => y.documents.map(d => `${d.bl_no}|${d.type}|${y.year}`))).size;
    const completedBLs = totalBLs - incompleteBLs;
    const totalImports = archiveData.reduce((s, y) => s + y.imports, 0);
    const totalExports = archiveData.reduce((s, y) => s + y.exports, 0);
    const totalDocs = archiveData.reduce((s, y) => s + y.documents.length, 0);
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

    // navToYear: go back to the year accordion AND auto-expand that year so
    // the sub-folders are immediately visible (avoids the empty 'types'/'months' states).
    const navToYear = (yr: ArchiveYear) => {
        nav({ level: 'years' });
        setExpandedYears(prev => new Set([...prev, yr.year]));
    };

    const baseCrumb = { label: 'Archives', onClick: currentDrill.level !== 'years' ? () => nav({ level: 'years' }) : undefined };
    const breadcrumbParts = (() => {
        if (currentDrill.level === 'years') return [baseCrumb];
        if (currentDrill.level === 'types') return [baseCrumb, { label: String(currentDrill.year.year) }];
        if (currentDrill.level === 'months') return [baseCrumb, { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) }, { label: FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL] + '/' }];
        if (currentDrill.level === 'bls') return [baseCrumb, { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) }, { label: FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL] + '/', onClick: () => navToYear(currentDrill.year) }, { label: MONTH_NAMES[currentDrill.month - 1] + '/' }];
        return [baseCrumb, { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) }, { label: FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL] + '/', onClick: () => navToYear(currentDrill.year) }, { label: MONTH_NAMES[currentDrill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: currentDrill.year, type: currentDrill.type, month: currentDrill.month }) }, { label: currentDrill.bl + '/' }];
    })();

    return (
        <div className="w-full p-8 pb-12 space-y-7">

            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Archive Dashboard</h1>
                    <p className="text-base text-text-muted mt-1">Historical import &amp; export document storage</p>
                </div>
                <CurrentDateTime
                    className="text-right shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            {/* Stats cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Archive Completeness */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex items-center gap-6">
                    {isLoading ? (
                        <div className="w-16 h-16 rounded-full bg-surface-secondary animate-pulse" />
                    ) : (
                        <CircularProgress pct={globalPct} />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Completeness</p>
                        {isLoading ? (
                            <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse mt-1" />
                        ) : (
                            <p className="text-sm text-text-muted mt-1">{totalBLs.toLocaleString()} total BLs</p>
                        )}
                    </div>
                </div>
                {/* Fully Documented */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Fully Documented</p>
                    {isLoading ? (
                        <>
                            <div className="h-10 w-24 bg-surface-secondary rounded animate-pulse" />
                            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse mt-2" />
                        </>
                    ) : (
                        <>
                            <p className="text-4xl font-black text-emerald-500 tabular-nums">{completedBLs.toLocaleString()}</p>
                            <p className="text-sm text-emerald-500 mt-1">Compliant records</p>
                        </>
                    )}
                </div>
                {/* Missing Documents */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Missing Documents</p>
                    {isLoading ? (
                        <>
                            <div className="h-10 w-24 bg-surface-secondary rounded animate-pulse" />
                            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse mt-2" />
                        </>
                    ) : (
                        <>
                            <p className="text-4xl font-black text-red-500 tabular-nums">{incompleteBLs.toLocaleString()}</p>
                            <p className="text-sm text-red-400 mt-1">Incomplete records</p>
                        </>
                    )}
                </div>
                {/* Storage + I/E Split */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Storage Used</p>
                    {isLoading ? (
                        <>
                            <div className="h-10 w-32 bg-surface-secondary rounded animate-pulse" />
                            <div className="h-4 w-48 bg-surface-secondary rounded animate-pulse mt-3" />
                        </>
                    ) : (
                        <>
                            <p className="text-4xl font-black text-text-primary tabular-nums">{formatBytes(totalStorageBytes)}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm font-bold text-blue-500 tabular-nums">{totalImports} <span className="text-blue-400 font-normal">imp</span></span>
                                <span className="text-text-muted text-sm">/</span>
                                <span className="text-sm font-bold text-indigo-500 tabular-nums">{totalExports} <span className="text-indigo-400 font-normal">exp</span></span>
                                <span className="text-sm text-text-muted ml-auto">{totalDocs} files</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Filter row + action buttons (compact) */}
            <div className="bg-surface rounded-xl border border-border shadow-sm p-4 text-xs">
                <div className="flex flex-wrap gap-x-6 gap-y-4 items-center">
                    {/* Year */}
                    <div className="min-w-[140px]">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Year</p>
                        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-border-strong bg-input-bg text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/70 cursor-pointer shadow-sm appearance-none">
                            <option value="all">All Years</option>
                            {availableYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                        {filterYear !== 'all' && (
                            <button onClick={() => setFilterYear('all')}
                                className="mt-1.5 text-xs text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear
                            </button>
                        )}
                    </div>

                    {/* I/E Type */}
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">I/E Type</p>
                        <div className="flex items-center gap-2">
                            {(['all', 'import', 'export'] as const).map(t => (
                                <button key={t} onClick={() => setFilterType(t)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${filterType === t
                                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-500'
                                        : 'bg-surface-secondary border-border text-text-secondary hover:bg-hover'
                                        }`}>
                                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Document Status */}
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Document Status</p>
                        <div className="flex items-center gap-2">
                            {([{ value: 'all', label: 'All' }, { value: 'complete', label: 'Complete' }, { value: 'incomplete', label: 'Incomplete' }] as const).map(({ value, label }) => (
                                <button key={value}
                                    onClick={() => { setFilterStatus(value); setIncompleteFilterActive(false); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${filterStatus === value
                                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-500'
                                        : 'bg-surface-secondary border-border text-text-secondary hover:bg-hover'
                                        }`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons — pushed to the right */}
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={() => exportArchiveCSV(archiveData)}
                            title="Export all BL records as CSV"
                            className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold text-white shrink-0 shadow-sm hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                        <button onClick={() => setShowLegacyUpload(true)}
                            className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold text-white shrink-0 shadow-sm hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <Icon name="plus" className="w-3.5 h-3.5" />
                            Upload Document
                        </button>
                    </div>
                </div>
            </div>

            {/* Browser card */}
            <div className="mt-8">

                <div className="rounded-xl border border-border overflow-hidden bg-surface shadow-sm">

                    {/* Toolbar: breadcrumb + search + sort + view toggle */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-subtle">
                        {/* Breadcrumb — only shown when drilled or in document view */}
                        {(viewMode === 'document' || currentDrill.level !== 'years') && (
                            <div className="flex items-center gap-2 shrink-0 pr-1 border-r border-border mr-1">
                                {viewMode === 'document' ? (
                                    <>
                                        <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-xs font-semibold text-text-primary whitespace-nowrap">All BL Records</span>
                                        <span className="text-xs text-text-muted">· {flatDocumentList.length}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                        </svg>
                                        <Breadcrumb parts={breadcrumbParts} />
                                    </>
                                )}
                            </div>
                        )}
                        {/* Search */}
                        <div className="relative flex-1">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" value={globalSearch}
                                onChange={e => setGlobalSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Escape' && setGlobalSearch('')}
                                placeholder="Search BL No., Importer, Exporter, Year…"
                                className="w-full pl-9 pr-9 h-9 rounded-md border border-border-strong bg-input-bg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all" />
                            {globalSearch && (
                                <button onClick={() => setGlobalSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {/* Sort — only at BL level */}
                        {currentDrill.level === 'bls' && viewMode === 'folder' && (
                            <select value={`${sortKey}:${sortDir}`}
                                onChange={e => { const [k, d] = e.target.value.split(':'); setSortKey(k as SortKey); setSortDir(d as 'asc' | 'desc'); }}
                                className="h-9 px-2 rounded-md border border-border-strong bg-input-bg text-text-secondary text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40 shrink-0">
                                <option value="period:desc">Period ↓</option>
                                <option value="period:asc">Period ↑</option>
                                <option value="bl:asc">BL A→Z</option>
                                <option value="bl:desc">BL Z→A</option>
                                <option value="client:asc">Client A→Z</option>
                                <option value="files:desc">Most Files</option>
                                <option value="files:asc">Fewest Files</option>
                            </select>
                        )}
                        {/* View toggle */}
                        <ViewToggle mode={viewMode} onChange={m => { setViewMode(m); if (m === 'folder') { setFilterStatus('all'); setIncompleteFilterActive(false); } }} />
                    </div>

                {/* Flat document view */}
                {isLoading ? (
                    <div className="divide-y divide-border/50">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 px-6 border-b border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-surface-secondary animate-pulse" />
                                    <div>
                                        <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
                                        <div className="h-3 w-20 bg-surface-secondary rounded animate-pulse mt-2" />
                                    </div>
                                </div>
                                <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
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
                    </>
                )}

                {/* BL folder view (drill level: bls) */}
                {viewMode === 'folder' && !globalSearch.trim() && currentDrill.level === 'bls' && (
                    <ArchivesBLView
                        drill={currentDrill as Extract<DrillState, { level: 'bls' }>}
                        search={search}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        nav={nav}
                    />
                )}

                {/* File view (drill level: files) */}
                {currentDrill.level === 'files' && (() => {
                    const d = currentDrill as Extract<DrillState, { level: 'files' }>;
                    const fileDocs = d.year.documents
                        .filter((doc: ArchiveDocument) => doc.type === d.type && doc.month === d.month && (doc.bl_no || '(no BL)') === d.bl);
                    if (fileDocs.length === 0) return <EmptyState icon="file-text" title="No files in this folder" />;
                    return (
                        <div>
                            <ArchiveRecordOverview docs={fileDocs} canEdit onEdit={handleEditArchiveRecord} />
                            <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface sticky top-0 z-10"
                                style={{ gridTemplateColumns: '32px 1fr 1.4fr 80px 32px 80px' }}>
                                <span />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">File</span>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Stage</span>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Uploaded</span>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">By</span>
                                <span />
                            </div>
                            {fileDocs.map((doc: ArchiveDocument) => (
                                <ArchiveDocumentRow key={doc.id} doc={doc} onDelete={handleDeleteArchiveDoc} onReplace={handleReplaceArchiveDoc} canReplace={true} />
                            ))}
                            <button
                                onClick={() => setAddDocModal({ isOpen: true, blNo: d.bl, type: d.type, docs: fileDocs })}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-4 border-t-2 border-dashed border-border text-sm font-bold text-text-muted hover:text-blue-500 hover:border-blue-400/50 hover:bg-blue-500/5 transition-all group">
                                <svg className="w-4 h-4 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Add document to this BL
                            </button>
                        </div>
                    );
                })()}
                </div>{/* end browser card (rounded-xl) */}
            </div>{/* end relative wrapper (mt-8) */}

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
            <ReplaceArchiveDocumentModal
                isOpen={replaceDocModal.isOpen}
                onClose={() => setReplaceDocModal(m => ({ ...m, isOpen: false }))}
                document={replaceDocModal.document}
            />
            <EditArchiveRecordModal
                isOpen={editRecordModal.isOpen}
                onClose={() => setEditRecordModal(m => ({ ...m, isOpen: false }))}
                record={editRecordModal.record}
            />
        </div>
    );
};
