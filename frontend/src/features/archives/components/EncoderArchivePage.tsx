import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon } from '../../../components/Icon';
import type { ArchiveDocument, ArchiveYear, TransactionType } from '../../documents/types/document.types';
import { useMyArchives } from '../hooks/useMyArchives';
import { useAuth } from '../../auth/hooks/useAuth';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { DrillState, SortKey, ViewMode } from '../utils/archive.utils';
import {
    FOLDER_LABEL,
    MONTH_NAMES,
    prefetchArchiveEditLookups,
    syncArchiveDrillState,
} from '../utils/archive.utils';
import { AddArchiveDocumentModal } from './AddArchiveDocumentModal';
import { ArchiveDocumentRow } from './ArchiveDocumentRow';
import { ArchiveLegacyUploadPage } from './ArchiveLegacyUploadPage';
import { ArchiveRecordOverview } from './ArchiveRecordOverview';
import { ArchivesFolderView } from './ArchivesFolderView';
import { ArchivesBLView, ArchivesDocumentView, GlobalSearchResults } from './ArchivesViews';
import { LegacyBatchesPage } from './LegacyBatchesPage';
import { LegacyFolderUploadView } from './LegacyFolderUploadView';
import { Breadcrumb } from './ui/Breadcrumb';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { ReplaceArchiveDocumentModal } from './ReplaceArchiveDocumentModal';
import { EditArchiveRecordModal } from './EditArchiveRecordModal';
import { EmptyState } from './ui/EmptyState';
import { ViewToggle } from './ui/ViewToggle';

type EncoderArchiveSection = 'archive' | 'legacyUpload' | 'legacyBatches';
type MountedEncoderSections = {
    legacyUpload: boolean;
    legacyBatches: boolean;
};

export const EncoderArchivePage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { data: archiveData = [], isLoading, isError } = useMyArchives();

    const [drill, setDrill] = useState<DrillState>({ level: 'years' });
    const [activeSection, setActiveSection] = useState<EncoderArchiveSection>('archive');
    const [mountedLegacySections, setMountedLegacySections] = useState<MountedEncoderSections>({
        legacyUpload: false,
        legacyBatches: false,
    });
    const [showLegacyUpload, setShowLegacyUpload] = useState(false);
    const [resumeBatchId, setResumeBatchId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('period');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<ViewMode>('folder');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
    const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

    const [addDocModal, setAddDocModal] = useState<{
        isOpen: boolean; blNo: string; type: TransactionType; docs: ArchiveDocument[];
    }>({ isOpen: false, blNo: '', type: 'import', docs: [] });
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string; confirmText: string;
        confirmButtonClass: string; onConfirm: () => void | Promise<void>;
    }>({ isOpen: false, title: '', message: '', confirmText: 'Confirm', confirmButtonClass: 'bg-red-600 hover:bg-red-700', onConfirm: () => {} });
    const [replaceDocModal, setReplaceDocModal] = useState<{ isOpen: boolean; document: ArchiveDocument | null }>({
        isOpen: false, document: null,
    });
    const [editRecordModal, setEditRecordModal] = useState<{ isOpen: boolean; record: ArchiveDocument | null }>({
        isOpen: false, record: null,
    });

    const handleDeleteArchiveDoc = (docId: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Document',
            message: 'Are you sure you want to delete this document? This action cannot be undone.',
            confirmText: 'Delete',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                await trackingApi.deleteDocument(docId);
                await queryClient.invalidateQueries({ queryKey: ['my-archives'] });
            },
        });
    };
    const handleReplaceArchiveDoc = (doc: ArchiveDocument) => {
        setReplaceDocModal({ isOpen: true, document: doc });
    };
    const handleEditArchiveRecord = (record: ArchiveDocument) => {
        void prefetchArchiveEditLookups(queryClient, record);
        setEditRecordModal({ isOpen: true, record });
    };

    const showSection = (section: EncoderArchiveSection) => {
        if (section === 'archive') {
            setActiveSection(section);
            return;
        }

        setMountedLegacySections((current) => ({
            ...current,
            [section]: true,
        }));
        setActiveSection(section);
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

    const toggleYear = (year: number) =>
        setExpandedYears(prev => {
            const next = new Set(prev);
            if (next.has(year)) next.delete(year);
            else next.add(year);
            return next;
        });

    const nav = (next: DrillState) => { setDrill(next); setSearch(''); setGlobalSearch(''); };

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
            return true;
        });
    }, [archiveData, globalSearch, filterYear, filterType]);

    if (activeSection === 'archive' && showLegacyUpload) {
        const currentYear = currentDrill.level !== 'years' ? currentDrill.year.year : new Date().getFullYear() - 1;
        return (
            <div className="flex justify-center py-10 px-6">
                <div className="w-full max-w-2xl">
                    <ArchiveLegacyUploadPage
                        defaultYear={currentYear}
                        onBack={() => setShowLegacyUpload(false)}
                        onSubmit={async () => {
                            await queryClient.invalidateQueries({ queryKey: ['my-archives'] });
                            setShowLegacyUpload(false);
                        }}
                    />
                </div>
            </div>
        );
    }

    if (isError) return (
        <EmptyState icon="alert-circle" title="Failed to load your archive" subtitle="Check your connection and try again." />
    );

    // ── Encoder-specific stats ───────────────────────────────────────────────────
    // Count only docs the encoder personally uploaded — the response now also includes
    // accounting/processor uploads on the same assigned transactions.
    const totalMyUploads = archiveData.reduce(
        (s, y) => s + y.documents.filter(d => d.uploader?.id === user?.id).length, 0,
    );
    const uniqueBLs = new Set(archiveData.flatMap(y => y.documents.map(d => `${d.bl_no}|${d.type}|${y.year}`))).size;

    const now = new Date();
    const thisMonthUploads = archiveData.reduce((s, y) =>
        s + y.documents.filter(d => {
            if (d.uploader?.id !== user?.id) return false;
            try {
                const dt = new Date(d.uploaded_at);
                return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
            } catch { return false; }
        }).length, 0);

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

    const navToYear = (yr: ArchiveYear) => {
        nav({ level: 'years' });
        setExpandedYears(prev => new Set([...prev, yr.year]));
    };

    const baseCrumb = { label: 'My Archive', onClick: currentDrill.level !== 'years' ? () => nav({ level: 'years' }) : undefined };
    const breadcrumbParts = (() => {
        if (currentDrill.level === 'years') return [baseCrumb];
        if (currentDrill.level === 'types') return [baseCrumb, { label: String(currentDrill.year.year) }];
        if (currentDrill.level === 'months') return [baseCrumb, { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) }, { label: FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL] + '/' }];
        if (currentDrill.level === 'bls') return [baseCrumb, { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) }, { label: FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL] + '/', onClick: () => navToYear(currentDrill.year) }, { label: MONTH_NAMES[currentDrill.month - 1] + '/' }];
        return [baseCrumb, { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) }, { label: FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL] + '/', onClick: () => navToYear(currentDrill.year) }, { label: MONTH_NAMES[currentDrill.month - 1] + '/', onClick: () => nav({ level: 'bls', year: currentDrill.year, type: currentDrill.type, month: currentDrill.month }) }, { label: currentDrill.bl + '/' }];
    })();

    const sectionTabs = (
        <div className="flex items-end gap-0 border-b border-border">
            <button
                type="button"
                onClick={() => showSection('archive')}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                    activeSection === 'archive'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                }`}
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Archive Records
            </button>
            <button
                type="button"
                onClick={() => showSection('legacyUpload')}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                    activeSection === 'legacyUpload'
                        ? 'border-amber-500 text-amber-700'
                        : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                }`}
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Legacy Folder Upload
            </button>
            <button
                type="button"
                onClick={() => showSection('legacyBatches')}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                    activeSection === 'legacyBatches'
                        ? 'border-amber-500 text-amber-700'
                        : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                }`}
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 5h8m-8 4h5" />
                </svg>
                Legacy Batches
            </button>
        </div>
    );

    return (
        <div className="w-full p-8 pb-12 space-y-7">

            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">My Archive</h1>
                    <p className="text-base text-text-muted mt-1">Your uploaded document history</p>
                </div>
                <CurrentDateTime
                    className="text-right shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            {sectionTabs}

            {mountedLegacySections.legacyUpload && (
                <div hidden={activeSection !== 'legacyUpload'}>
                    <LegacyFolderUploadView
                        onOpenBatches={() => {
                            setResumeBatchId(null);
                            showSection('legacyBatches');
                        }}
                        resumeBatchId={resumeBatchId}
                        onResumeCleared={() => setResumeBatchId(null)}
                    />
                </div>
            )}

            {mountedLegacySections.legacyBatches && (
                <div hidden={activeSection !== 'legacyBatches'}>
                    <LegacyBatchesPage
                        onResumeBatch={(batchId) => {
                            setResumeBatchId(batchId);
                            showSection('legacyUpload');
                        }}
                    />
                </div>
            )}

            {activeSection === 'archive' && (
                <>

            {/* Stats cards row — encoder-specific */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* My Uploads */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">My Uploads</p>
                    {isLoading ? (
                        <>
                            <div className="h-10 w-24 bg-surface-secondary rounded animate-pulse" />
                            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse mt-2" />
                        </>
                    ) : (
                        <>
                            <p className="text-4xl font-black text-teal-500 tabular-nums">{totalMyUploads.toLocaleString()}</p>
                            <p className="text-sm text-teal-400 mt-1">Total files uploaded</p>
                        </>
                    )}
                </div>
                {/* BL Records */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">BL Records</p>
                    {isLoading ? (
                        <>
                            <div className="h-10 w-24 bg-surface-secondary rounded animate-pulse" />
                            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse mt-2" />
                        </>
                    ) : (
                        <>
                            <p className="text-4xl font-black text-blue-500 tabular-nums">{uniqueBLs.toLocaleString()}</p>
                            <p className="text-sm text-blue-400 mt-1">Across all transactions</p>
                        </>
                    )}
                </div>
                {/* This Month */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col justify-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">This Month</p>
                    {isLoading ? (
                        <>
                            <div className="h-10 w-24 bg-surface-secondary rounded animate-pulse" />
                            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse mt-2" />
                        </>
                    ) : (
                        <>
                            <p className="text-4xl font-black text-orange-500 tabular-nums">{thisMonthUploads.toLocaleString()}</p>
                            <p className="text-sm text-orange-400 mt-1">Files uploaded this month</p>
                        </>
                    )}
                </div>
                {/* Storage Used */}
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
                                <span className="text-sm font-bold text-blue-500 tabular-nums">{archiveData.reduce((s, y) => s + y.imports, 0)} <span className="text-blue-400 font-normal">imp</span></span>
                                <span className="text-text-muted text-sm">/</span>
                                <span className="text-sm font-bold text-indigo-500 tabular-nums">{archiveData.reduce((s, y) => s + y.exports, 0)} <span className="text-indigo-400 font-normal">exp</span></span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Filter row — simplified for encoder (no document status/incomplete filter) */}
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

                    {/* Upload button only — no CSV export for encoders */}
                    <div className="flex items-center gap-2 ml-auto">
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
                        {(viewMode === 'document' || currentDrill.level !== 'years') && (
                            <div className="flex items-center gap-2 shrink-0 pr-1 border-r border-border mr-1">
                                {viewMode === 'document' ? (
                                    <>
                                        <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-xs font-semibold text-text-primary whitespace-nowrap">My BL Records</span>
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
                                placeholder="Search BL No., Client…"
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
                        <ViewToggle mode={viewMode} onChange={m => { setViewMode(m); }} />
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
                                    filterStatus="all"
                                    expandedYears={expandedYears}
                                    toggleYear={toggleYear}
                                    nav={nav}
                                    openMenuKey={openMenuKey}
                                    setOpenMenuKey={setOpenMenuKey}
                                    onOpenUpload={() => setShowLegacyUpload(true)}
                                    showAuditButton={false}
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

                    {/* File view (drill level: files) — no delete for encoder */}
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
                                {fileDocs.map((doc: ArchiveDocument) => {
                                    const isOwner = user?.id === doc.uploader?.id;
                                    return (
                                        <ArchiveDocumentRow
                                            key={doc.id}
                                            doc={doc}
                                            canDelete={isOwner}
                                            onDelete={handleDeleteArchiveDoc}
                                            canReplace={isOwner}
                                            onReplace={handleReplaceArchiveDoc}
                                        />
                                    );
                                })}
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
                </div>{/* end browser card */}
            </div>{/* end wrapper */}

            {/* Modals */}
            <AddArchiveDocumentModal
                isOpen={addDocModal.isOpen}
                onClose={() => setAddDocModal(m => ({ ...m, isOpen: false }))}
                blNo={addDocModal.blNo}
                type={addDocModal.type}
                existingDocs={addDocModal.docs}
            />
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmButtonClass={confirmModal.confirmButtonClass}
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
                </>
            )}
        </div>
    );
};
