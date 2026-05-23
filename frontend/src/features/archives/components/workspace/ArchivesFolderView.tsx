import { useState } from 'react';
import type {
    ArchiveDocument,
    ArchiveFolderSummary,
    ArchiveYear,
    TransactionType,
} from '../../../documents/types/document.types';
import type { ArchiveZipRequestInput } from '../../hooks/useArchiveZipRequests';
import type { DocStatusFilter, DrillState } from '../../utils/archive.utils';
import {
    FOLDER_COLOR,
    MONTH_NAMES,
    computeGlobalCompleteness,
    getArchiveBlCompletion,
} from '../../utils/archive.utils';
import { UploadHistoryPanel } from '../legacy-upload/UploadHistoryPanel';
import { FolderSVG } from '../ui/FolderSVG';

interface FolderRowMenuProps {
    menuKey: string;
    openMenuKey: string | null;
    setOpenMenuKey: (key: string | null) => void;
    isDownloading: boolean;
    onDownloadFolder: () => void;
    onViewHistory: () => void;
}

export const FolderRowMenu = ({
    menuKey,
    openMenuKey,
    setOpenMenuKey,
    isDownloading,
    onDownloadFolder,
    onViewHistory,
}: FolderRowMenuProps) => (
    <div className="relative">
        <button
            title="More options"
            onClick={e => { e.stopPropagation(); setOpenMenuKey(openMenuKey === menuKey ? null : menuKey); }}
            className={`w-7 h-7 flex items-center justify-center rounded-md border bg-input-bg transition-all shadow-sm ${openMenuKey === menuKey
                ? 'border-border-strong text-text-primary bg-hover'
                : 'border-border text-text-muted hover:border-border-strong hover:text-text-secondary hover:bg-hover'
                }`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx={5} cy={12} r={1.5} />
                <circle cx={12} cy={12} r={1.5} />
                <circle cx={19} cy={12} r={1.5} />
            </svg>
        </button>

        {openMenuKey === menuKey && (
            <>
                <div className="fixed inset-0 z-20" onClick={() => setOpenMenuKey(null)} />
                <div className="absolute right-0 top-8 z-30 w-56 bg-surface rounded-xl border border-border shadow-lg py-1 overflow-hidden animate-dropdown-in">
                    {/* Download */}
                    <button
                        disabled={isDownloading}
                        onClick={() => { setOpenMenuKey(null); onDownloadFolder(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-hover transition-colors disabled:cursor-wait disabled:opacity-60">
                        <svg className="w-4 h-4 shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <div>
                            <p className="text-xs font-semibold text-text-primary">
                                {isDownloading ? 'Preparing ZIP...' : 'Prepare folder ZIP'}
                            </p>
                            <p className="text-[10px] text-text-muted">Track it in ZIP requests</p>
                        </div>
                    </button>

                    <div className="my-1 border-t border-border" />

                    {/* Upload History */}
                    <button
                        onClick={() => { setOpenMenuKey(null); onViewHistory(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-hover transition-colors">
                        <svg className="w-4 h-4 shrink-0 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-xs font-semibold text-text-primary">View Folder Activity</p>
                            <p className="text-[10px] text-text-muted">Uploads, gaps, and latest activity</p>
                        </div>
                    </button>

                </div>
            </>
        )}
    </div>
);

interface SubFolderRowProps {
    groupKey: string;
    docs?: ArchiveDocument[];
    folder?: ArchiveFolderSummary;
    yr: ArchiveYear;
    filterStatus: DocStatusFilter;
    nav: (next: DrillState) => void;
    openMenuKey: string | null;
    setOpenMenuKey: (key: string | null) => void;
    onViewHistory: (folderName: string, year: number, month: number, type: TransactionType) => void;
    onDownloadFolder: (request: ArchiveZipRequestInput) => void;
    preparingZipRequestKeys: Set<string>;
}

export const SubFolderRow = ({
    groupKey,
    docs = [],
    folder,
    yr,
    filterStatus,
    nav,
    openMenuKey,
    setOpenMenuKey,
    onViewHistory,
    onDownloadFolder,
    preparingZipRequestKeys,
}: SubFolderRowProps) => {
    const [monthStr, txType] = groupKey.split('|') as [string, TransactionType];
    const month = Number(monthStr);

    const blMap = new Map<string, ArchiveDocument[]>();
    for (const d of docs) {
        const bk = d.bl_no || '(no BL)';
        if (!blMap.has(bk)) blMap.set(bk, []);
        blMap.get(bk)!.push(d);
    }
    const blCount = folder?.bl_count ?? blMap.size;
    const fileCount = folder?.file_count ?? docs.length;
    const completedBLs = folder?.completed_bl_count
        ?? [...blMap.values()].filter((blDocs) => getArchiveBlCompletion(blDocs, txType).isComplete).length;
    const folderPct = blCount === 0 ? 0 : Math.round((completedBLs / blCount) * 100);

    const statusLabel = folderPct >= 90 ? 'Complete' : folderPct >= 50 ? 'Partial' : 'Incomplete';
    if (filterStatus === 'complete' && statusLabel !== 'Complete') return null;
    if (filterStatus === 'incomplete' && statusLabel === 'Complete') return null;

    const latestUploadedAt = folder?.latest_uploaded_at
        ?? docs.reduce<ArchiveDocument | null>((latest, doc) => {
            if (latest === null) return doc;
            return (doc.uploaded_at ?? '') > (latest.uploaded_at ?? '') ? doc : latest;
        }, null)?.uploaded_at;
    const lastUpd = latestUploadedAt
        ? new Date(latestUploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    const folderName = `${MONTH_NAMES[month - 1].slice(0, 3).toUpperCase()} ${yr.year} ${txType.toUpperCase()}S`;
    const filename = `${folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.zip`;
    const iconColor = txType === 'import' ? FOLDER_COLOR.import : FOLDER_COLOR.export;
    const statusTone = statusLabel === 'Complete'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
        : statusLabel === 'Partial'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
            : 'border-red-500/30 bg-red-500/10 text-red-500';

    return (
        <div
            key={groupKey}
            data-testid={`archive-subfolder-row-${groupKey}`}
            className="border-b border-border/70 bg-surface/90 px-5 py-3 transition-colors last:border-b-0 hover:bg-hover"
        >
            <div className="flex items-center gap-4">
                <FolderSVG color={iconColor} />

                <button
                    aria-label={folderName}
                    onClick={() => nav({ level: 'bls', year: yr, type: txType, month })}
                    className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[15px] font-black text-text-primary transition-colors hover:text-blue-500 hover:underline hover:decoration-blue-400/50 hover:underline-offset-2">
                        {folderName}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-text-muted">
                        <span>{fileCount.toLocaleString()} files</span>
                        <span className="h-1 w-1 rounded-full bg-text-muted/40" />
                        <span>{blCount.toLocaleString()} BL{blCount === 1 ? '' : 's'}</span>
                        <span className="h-1 w-1 rounded-full bg-text-muted/40" />
                        <span>Updated {lastUpd}</span>
                    </span>
                </button>

                <div className="hidden min-w-[190px] items-center gap-3 md:flex">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                        <div
                            className={`h-full rounded-full ${folderPct >= 90 ? 'bg-emerald-500' : folderPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${folderPct}%` }}
                        />
                    </div>
                    <span className={`w-10 text-right text-xs font-black tabular-nums ${folderPct >= 90 ? 'text-emerald-500' : folderPct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {folderPct}%
                    </span>
                </div>

                <span className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-xs font-black md:inline-flex ${statusTone}`}>
                    {statusLabel === 'Incomplete' ? 'Needs documents' : statusLabel}
                </span>

                <div className="relative ml-auto flex shrink-0 items-center gap-2">
                    <button
                        onClick={() => nav({ level: 'bls', year: yr, type: txType, month })}
                        className="hidden h-7 rounded-lg border border-border bg-input-bg px-3 text-xs font-bold text-text-secondary shadow-sm transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-500 sm:inline-flex sm:items-center">
                        Open
                    </button>
                    <FolderRowMenu
                        menuKey={groupKey}
                        openMenuKey={openMenuKey}
                        setOpenMenuKey={setOpenMenuKey}
                        isDownloading={preparingZipRequestKeys.has(groupKey)}
                        onDownloadFolder={() => onDownloadFolder({
                            requestKey: groupKey,
                            folderName,
                            year: yr.year,
                            month,
                            type: txType,
                            fileCount,
                            blCount,
                            filename,
                        })}
                        onViewHistory={() => onViewHistory(folderName, yr.year, month, txType)}
                    />
                </div>
            </div>
        </div>
    );
};

interface YearRowProps {
    yr: ArchiveYear;
    isOpen: boolean;
    toggleYear: (y: number) => void;
    filterType: string;
    filterStatus: DocStatusFilter;
    nav: (next: DrillState) => void;
    openMenuKey: string | null;
    setOpenMenuKey: (key: string | null) => void;
    onViewHistory: (folderName: string, year: number, month: number, type: TransactionType) => void;
    onDownloadFolder: (request: ArchiveZipRequestInput) => void;
    preparingZipRequestKeys: Set<string>;
}

const YearRow = ({
    yr,
    isOpen,
    toggleYear,
    filterType,
    filterStatus,
    nav,
    openMenuKey,
    setOpenMenuKey,
    onViewHistory,
    onDownloadFolder,
    preparingZipRequestKeys,
}: YearRowProps) => {
    const grouped = new Map<string, ArchiveDocument[]>();
    for (const doc of yr.documents) {
        const k = `${doc.month}|${doc.type}`;
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k)!.push(doc);
    }

    const allGroups = (yr.folders?.length
        ? yr.folders.map((folder): [string, { docs: ArchiveDocument[]; folder?: ArchiveFolderSummary }] => [
            `${folder.month}|${folder.type}`,
            { docs: grouped.get(`${folder.month}|${folder.type}`) ?? [], folder },
        ])
        : [...grouped.entries()].map(([key, docs]): [string, { docs: ArchiveDocument[]; folder?: ArchiveFolderSummary }] => [
            key,
            { docs },
        ])
    ).sort(([a], [b]) => {
        const [mA, tA] = a.split('|');
        const [mB, tB] = b.split('|');
        return Number(mA) - Number(mB) || tA.localeCompare(tB);
    });

    const visibleGroups = filterType === 'all' ? allGroups : allGroups.filter(([k]) => k.split('|')[1] === filterType);

    const totalFiles = yr.file_count ?? yr.documents.length;
    const totalBLs = yr.bl_count ?? (yr.imports + yr.exports);
    const yearPct = yr.bl_count
        ? Math.round(((yr.completed_bl_count ?? 0) / yr.bl_count) * 100)
        : computeGlobalCompleteness([yr]);
    const yearRequestKey = `year|${yr.year}`;
    const isPreparingYearZip = preparingZipRequestKeys.has(yearRequestKey);

    const incompleteSubCount = allGroups.filter(([k, group]) => {
        if (group.folder) {
            return group.folder.incomplete_bl_count > 0;
        }

        const txType = k.split('|')[1] as TransactionType;
        const bm = new Map<string, ArchiveDocument[]>();
        for (const d of group.docs) {
            const bk = d.bl_no || '(no BL)';
            if (!bm.has(bk)) bm.set(bk, []);
            bm.get(bk)!.push(d);
        }
        const pct = bm.size === 0
            ? 0
            : Math.round(([...bm.values()].filter((blDocs) => getArchiveBlCompletion(blDocs, txType).isComplete).length / bm.size) * 100);
        return pct < 90;
    }).length;

    return (
        <div className="border-b border-border last:border-b-0">
            <div
                className="flex items-center gap-3 border-b border-border bg-surface px-5 py-3.5 transition-colors hover:bg-hover cursor-pointer select-none"
                onClick={() => toggleYear(yr.year)}>

                <svg className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-base font-black text-text-primary">FY {yr.year}</span>
                <span className="text-[11px] font-semibold text-text-secondary bg-surface-elevated px-2 py-0.5 rounded-full border border-border">
                    {allGroups.length} {allGroups.length === 1 ? 'folder' : 'folders'}
                </span>

                <div className="ml-auto flex items-center gap-4 text-xs text-text-secondary">
                    <span className="tabular-nums">{totalFiles.toLocaleString()} files</span>
                    <span className="tabular-nums">{totalBLs.toLocaleString()} BLs</span>
                    <span className="font-bold tabular-nums text-text-primary">{yearPct}% complete</span>
                    {incompleteSubCount > 0 && (
                        <span className="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-md font-bold text-[11px]">
                            {incompleteSubCount} Folder{incompleteSubCount !== 1 ? 's' : ''} Incomplete
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 ml-2" onClick={e => e.stopPropagation()}>
                        <button title="Download ZIP"
                            aria-label={`Prepare FY ${yr.year} ZIP`}
                            disabled={isPreparingYearZip}
                            onClick={e => {
                                e.stopPropagation();
                                onDownloadFolder({
                                    scope: 'year',
                                    requestKey: yearRequestKey,
                                    folderName: `FY ${yr.year}`,
                                    year: yr.year,
                                    fileCount: totalFiles,
                                    blCount: totalBLs,
                                    filename: `fy-${yr.year}-archive.zip`,
                                });
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-input-bg text-text-secondary hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/10 transition-all shadow-sm disabled:cursor-wait disabled:opacity-60">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="bg-surface-secondary/15 px-5 pb-3 pt-2" data-testid={`archive-year-panel-${yr.year}`}>
                    <div className={`${openMenuKey ? 'overflow-visible' : 'overflow-hidden'} rounded-lg border border-border/70 bg-surface/75 shadow-sm`}>
                        {visibleGroups.length === 0 ? (
                            <div className="py-8 text-center text-xs text-text-muted">No folders match the current filter.</div>
                        ) : (
                            <div>
                                {visibleGroups.map(([key, group]) => (
                                    <SubFolderRow key={key} groupKey={key} docs={group.docs} folder={group.folder} yr={yr}
                                        filterStatus={filterStatus} nav={nav}
                                        openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey}
                                        onViewHistory={onViewHistory}
                                        onDownloadFolder={onDownloadFolder}
                                        preparingZipRequestKeys={preparingZipRequestKeys} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface HistoryTarget {
    folderName: string;
    year: number;
    month: number;
    type: TransactionType;
}

interface ArchivesFolderViewProps {
    archiveData: ArchiveYear[];
    filterYear: string;
    filterType: string;
    filterStatus: DocStatusFilter;
    expandedYears: Set<number>;
    toggleYear: (y: number) => void;
    nav: (next: DrillState) => void;
    openMenuKey: string | null;
    setOpenMenuKey: (key: string | null) => void;
    onOpenUpload: () => void;
    historyMine?: boolean;
    onRequestFolderZip: (request: ArchiveZipRequestInput) => void;
    preparingZipRequestKeys: Set<string>;
}

export const ArchivesFolderView = ({
    archiveData, filterYear, filterType, filterStatus,
    expandedYears, toggleYear, nav, openMenuKey, setOpenMenuKey, onOpenUpload,
    historyMine = false,
    onRequestFolderZip,
    preparingZipRequestKeys,
}: ArchivesFolderViewProps) => {
    const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null);
    const filteredYears = filterYear === 'all' ? archiveData : archiveData.filter(y => String(y.year) === filterYear);

    if (filteredYears.length === 0) return (
        <div className="py-20 flex flex-col items-center gap-3 text-text-muted">
            <p className="text-sm font-semibold text-text-secondary">
                {filterYear !== 'all' ? `No archive found for ${filterYear}` : 'No archives yet'}
            </p>
            <p className="text-xs text-text-muted">
                {filterYear !== 'all' ? 'Try selecting a different year.' : 'Upload legacy files to start building the archive.'}
            </p>
            {filterYear === 'all' && (
                <button onClick={onOpenUpload}
                    className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600">
                    + Upload First Record
                </button>
            )}
        </div>
    );

    return (
        <>
            <div>
                {filteredYears.map(yr => (
                    <YearRow key={yr.year} yr={yr}
                        isOpen={expandedYears.has(yr.year)}
                        toggleYear={toggleYear}
                        filterType={filterType}
                        filterStatus={filterStatus}
                        nav={nav}
                        openMenuKey={openMenuKey}
                        setOpenMenuKey={setOpenMenuKey}
                        onDownloadFolder={onRequestFolderZip}
                        preparingZipRequestKeys={preparingZipRequestKeys}
                        onViewHistory={(folderName, year, month, type) => setHistoryTarget({ folderName, year, month, type })}
                    />
                ))}
            </div>

            <UploadHistoryPanel
                isOpen={historyTarget !== null}
                onClose={() => setHistoryTarget(null)}
                folderName={historyTarget?.folderName ?? ''}
                year={historyTarget?.year ?? 0}
                month={historyTarget?.month ?? 0}
                type={historyTarget?.type ?? 'import'}
                mine={historyMine}
            />
        </>
    );
};



