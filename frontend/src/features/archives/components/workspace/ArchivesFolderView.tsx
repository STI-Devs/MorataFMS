import { useState } from 'react';
import { ChevronRight, Download, Folder, History, MoreHorizontal } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { cn } from '@/lib/utils';
import type {
    ArchiveDocument,
    ArchiveFolderSummary,
    ArchiveYear,
    TransactionType,
} from '../../../documents/types/document.types';
import type { ArchiveZipRequestInput } from '../../hooks/useArchiveZipRequests';
import type { DocStatusFilter, DrillState } from '../../utils/archive.utils';
import {
    MONTH_NAMES,
    computeGlobalCompleteness,
    getArchiveBlCompletion,
} from '../../utils/archive.utils';
import { UploadHistoryPanel } from '../legacy-upload/UploadHistoryPanel';

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
        <Button
            variant="ghost"
            size="icon"
            title="More options"
            onClick={(e) => {
                e.stopPropagation();
                setOpenMenuKey(openMenuKey === menuKey ? null : menuKey);
            }}
            className={`size-7 rounded-lg border bg-background transition-all shadow-2xs cursor-pointer ${
                openMenuKey === menuKey
                    ? 'border-border text-foreground bg-muted'
                    : 'border-border/80 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted'
            }`}
        >
            <MoreHorizontal className="size-3.5" />
        </Button>

        {openMenuKey === menuKey && (
            <>
                <div className="fixed inset-0 z-20" onClick={() => setOpenMenuKey(null)} />
                <div className="absolute right-0 top-8 z-30 w-56 bg-card rounded-xl border border-border shadow-lg py-1 overflow-hidden animate-dropdown-in">
                    {/* Download */}
                    <button
                        disabled={isDownloading}
                        onClick={() => {
                            setOpenMenuKey(null);
                            onDownloadFolder();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                    >
                        <Download className="w-4 h-4 shrink-0 text-amber-500" />
                        <div>
                            <p className="text-xs font-semibold text-foreground">
                                {isDownloading ? 'Preparing ZIP...' : 'Prepare folder ZIP'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Track it in ZIP requests</p>
                        </div>
                    </button>

                    <div className="my-1 border-t border-border/80" />

                    {/* Upload History */}
                    <button
                        onClick={() => {
                            setOpenMenuKey(null);
                            onViewHistory();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors cursor-pointer"
                    >
                        <History className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-semibold text-foreground">View Folder Activity</p>
                            <p className="text-[10px] text-muted-foreground">Uploads, gaps, and latest activity</p>
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
    const completedBLs =
        folder?.completed_bl_count ??
        [...blMap.values()].filter((blDocs) => getArchiveBlCompletion(blDocs, txType).isComplete).length;
    const folderPct = blCount === 0 ? 0 : Math.round((completedBLs / blCount) * 100);

    const statusLabel = folderPct >= 90 ? 'Complete' : folderPct >= 50 ? 'Partial' : 'Incomplete';
    if (filterStatus === 'complete' && statusLabel !== 'Complete') return null;
    if (filterStatus === 'incomplete' && statusLabel === 'Complete') return null;

    const latestUploadedAt =
        folder?.latest_uploaded_at ??
        docs.reduce<ArchiveDocument | null>((latest, doc) => {
            if (latest === null) return doc;
            return (doc.uploaded_at ?? '') > (latest.uploaded_at ?? '') ? doc : latest;
        }, null)?.uploaded_at;
    const lastUpd = latestUploadedAt
        ? new Date(latestUploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';

    const folderName = `${MONTH_NAMES[month - 1].slice(0, 3).toUpperCase()} ${yr.year} ${txType.toUpperCase()}S`;
    const filename = `${folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.zip`;
    const isImport = txType === 'import';

    return (
        <div
            key={groupKey}
            data-testid={`archive-subfolder-row-${groupKey}`}
            className="border-b border-border/60 bg-card px-5 py-3 transition-colors last:border-b-0 hover:bg-muted/40"
        >
            <div className="flex flex-wrap items-center gap-3">
                <div
                    className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-md shadow-2xs',
                        isImport
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    )}
                >
                    <Folder className="size-3.5" />
                </div>

                <button
                    aria-label={folderName}
                    onClick={() => nav({ level: 'bls', year: yr, type: txType, month })}
                    className="min-w-0 flex-1 text-left cursor-pointer group/btn"
                >
                    <span className="block truncate text-xs font-semibold text-foreground group-hover/btn:text-primary transition-colors">
                        {folderName}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 font-semibold md:hidden">
                            <span className={cn('size-1.5 rounded-full', folderPct >= 90 ? 'bg-emerald-500' : folderPct >= 50 ? 'bg-amber-500' : 'bg-rose-500')} />
                            <span className={cn(folderPct >= 90 ? 'text-emerald-600 dark:text-emerald-400' : folderPct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>
                                {statusLabel === 'Incomplete' ? 'Needs documents' : statusLabel}
                            </span>
                            <span>·</span>
                            <span>{folderPct}%</span>
                        </span>
                        <span>{fileCount.toLocaleString()} files</span>
                        <span>·</span>
                        <span>
                            {blCount.toLocaleString()} BL{blCount === 1 ? '' : 's'}
                        </span>
                        <span>·</span>
                        <span>Updated {lastUpd}</span>
                    </span>
                </button>

                <div className="hidden min-w-[160px] items-center gap-2.5 md:flex">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                folderPct >= 90
                                    ? 'bg-emerald-500'
                                    : folderPct >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                            )}
                            style={{ width: `${folderPct}%` }}
                        />
                    </div>
                    <span
                        className={cn(
                            'w-9 text-right text-xs font-medium tabular-nums',
                            folderPct >= 90
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : folderPct >= 50
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                        )}
                    >
                        {folderPct}%
                    </span>
                </div>

                <Badge
                    variant={
                        statusLabel === 'Complete'
                            ? 'success'
                            : statusLabel === 'Partial'
                              ? 'warning'
                              : 'destructive'
                    }
                    className="hidden md:inline-flex text-[11px] font-medium"
                >
                    {statusLabel === 'Incomplete' ? 'Needs documents' : statusLabel}
                </Badge>

                <div className="relative ml-auto flex shrink-0 items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => nav({ level: 'bls', year: yr, type: txType, month })}
                        className="hidden h-7 px-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer shadow-2xs sm:inline-flex"
                    >
                        Open
                    </Button>
                    <FolderRowMenu
                        menuKey={groupKey}
                        openMenuKey={openMenuKey}
                        setOpenMenuKey={setOpenMenuKey}
                        isDownloading={preparingZipRequestKeys.has(groupKey)}
                        onDownloadFolder={() =>
                            onDownloadFolder({
                                requestKey: groupKey,
                                folderName,
                                year: yr.year,
                                month,
                                type: txType,
                                fileCount,
                                blCount,
                                filename,
                            })
                        }
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
        <div className="border-b border-border/80 last:border-b-0">
            <div
                className="flex flex-wrap items-center justify-between gap-y-2 border-b border-border/80 bg-card px-4 py-3 transition-colors hover:bg-muted/40 cursor-pointer select-none sm:px-5"
                onClick={() => toggleYear(yr.year)}
            >
                <div className="flex items-center gap-2.5">
                    <ChevronRight
                        className={cn(
                            'size-4 text-muted-foreground transition-transform duration-200 shrink-0',
                            isOpen && 'rotate-90'
                        )}
                    />
                    <span className="text-sm font-semibold text-foreground">FY {yr.year}</span>
                    <Badge variant="secondary" className="text-[11px] font-medium text-muted-foreground">
                        {allGroups.length} {allGroups.length === 1 ? 'folder' : 'folders'}
                    </Badge>
                </div>

                <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">{totalFiles.toLocaleString()} files</span>
                    <span className="tabular-nums">{totalBLs.toLocaleString()} BLs</span>
                    <span className="font-medium tabular-nums text-foreground">{yearPct}% complete</span>
                    {incompleteSubCount > 0 && (
                        <Badge variant="destructive" className="text-[11px] font-medium">
                            {incompleteSubCount} Folder{incompleteSubCount !== 1 ? 's' : ''} Incomplete
                        </Badge>
                    )}
                    <div className="flex items-center gap-1.5 ml-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Download ZIP"
                            aria-label={`Prepare FY ${yr.year} ZIP`}
                            disabled={isPreparingYearZip}
                            onClick={(e) => {
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
                            className="size-7 text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer disabled:cursor-wait disabled:opacity-60"
                        >
                            <Download className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="bg-muted/15 px-5 pb-3 pt-2" data-testid={`archive-year-panel-${yr.year}`}>
                    <div
                        className={`${
                            openMenuKey ? 'overflow-visible' : 'overflow-hidden'
                        } rounded-xl border border-border/80 bg-card shadow-2xs`}
                    >
                        {visibleGroups.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                No folders match the current filter.
                            </div>
                        ) : (
                            <div>
                                {visibleGroups.map(([key, group]) => (
                                    <SubFolderRow
                                        key={key}
                                        groupKey={key}
                                        docs={group.docs}
                                        folder={group.folder}
                                        yr={yr}
                                        filterStatus={filterStatus}
                                        nav={nav}
                                        openMenuKey={openMenuKey}
                                        setOpenMenuKey={setOpenMenuKey}
                                        onViewHistory={onViewHistory}
                                        onDownloadFolder={onDownloadFolder}
                                        preparingZipRequestKeys={preparingZipRequestKeys}
                                    />
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
    if (filteredYears.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center gap-2 text-muted-foreground">
                <p className="text-sm font-semibold text-foreground">
                    {filterYear !== 'all' ? `No archive found for ${filterYear}` : 'No archives yet'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {filterYear !== 'all' ? 'Try selecting a different year.' : 'Upload legacy files to start building the archive.'}
                </p>
                {filterYear === 'all' && (
                    <button
                        type="button"
                        onClick={onOpenUpload}
                        className="mt-2 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                    >
                        + Upload First Record
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <div>
                {filteredYears.map((yr) => (
                    <YearRow
                        key={yr.year}
                        yr={yr}
                        isOpen={expandedYears.has(yr.year)}
                        toggleYear={toggleYear}
                        filterType={filterType}
                        filterStatus={filterStatus}
                        nav={nav}
                        openMenuKey={openMenuKey}
                        setOpenMenuKey={setOpenMenuKey}
                        onDownloadFolder={onRequestFolderZip}
                        preparingZipRequestKeys={preparingZipRequestKeys}
                        onViewHistory={(folderName, year, month, type) =>
                            setHistoryTarget({ folderName, year, month, type })
                        }
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



