import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import type { ArchiveDocument, ArchiveYear, TransactionType } from '../../documents/types/document.types';
import type { DocStatusFilter, DrillState } from '../utils/archive.utils';
import {
    FOLDER_COLOR,
    MONTH_NAMES,
    computeGlobalCompleteness,
    getArchiveBlCompletion,
    hasRoleAtLeast,
} from '../utils/archive.utils';
import { UploadHistoryPanel } from './UploadHistoryPanel';
import { FolderSVG } from './ui/FolderSVG';

interface FolderRowMenuProps {
    folderName: string;
    menuKey: string;
    openMenuKey: string | null;
    setOpenMenuKey: (key: string | null) => void;
    docs: ArchiveDocument[];
    type: TransactionType;
    canDelete: boolean;
    onViewHistory: () => void;
}

export const FolderRowMenu = ({ folderName, menuKey, openMenuKey, setOpenMenuKey, canDelete, onViewHistory }: FolderRowMenuProps) => (
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
                        onClick={() => { setOpenMenuKey(null); alert(`Downloading ${folderName}... (backend pending)`); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-hover transition-colors">
                        <svg className="w-4 h-4 shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <div>
                            <p className="text-xs font-semibold text-text-primary">Download this folder</p>
                            <p className="text-[10px] text-text-muted">Save as ZIP file</p>
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
                            <p className="text-xs font-semibold text-text-primary">View Upload History</p>
                            <p className="text-[10px] text-text-muted">Who uploaded &amp; when</p>
                        </div>
                    </button>

                    {/* Delete ΓÇö admin only */}
                    {canDelete && (
                        <>
                            <div className="my-1 border-t border-border" />
                            <button
                                onClick={() => { setOpenMenuKey(null); alert('Delete Folder — (backend pending)'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-500/10 transition-colors">
                                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <div>
                                    <p className="text-xs font-semibold text-red-500">Delete Folder</p>
                                    <p className="text-[10px] text-red-400">Supervisor+ only — irreversible</p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </>
        )}
    </div>
);

interface SubFolderRowProps {
    groupKey: string;
    docs: ArchiveDocument[];
    yr: ArchiveYear;
    filterStatus: DocStatusFilter;
    nav: (next: DrillState) => void;
    openMenuKey: string | null;
    setOpenMenuKey: (key: string | null) => void;
    onViewHistory: (folderName: string, docs: ArchiveDocument[], type: TransactionType) => void;
}

export const SubFolderRow = ({ groupKey, docs, yr, filterStatus, nav, openMenuKey, setOpenMenuKey, onViewHistory }: SubFolderRowProps) => {
    const { user } = useAuth();
    const canDelete = hasRoleAtLeast(user?.role, 'admin');
    const [monthStr, txType] = groupKey.split('|') as [string, TransactionType];
    const month = Number(monthStr);

    const blMap = new Map<string, ArchiveDocument[]>();
    for (const d of docs) {
        const bk = d.bl_no || '(no BL)';
        if (!blMap.has(bk)) blMap.set(bk, []);
        blMap.get(bk)!.push(d);
    }
    const completedBLs = [...blMap.values()].filter((blDocs) => getArchiveBlCompletion(blDocs, txType).isComplete).length;
    const folderPct = blMap.size === 0 ? 0 : Math.round((completedBLs / blMap.size) * 100);

    const statusLabel = folderPct >= 90 ? 'Complete' : folderPct >= 50 ? 'Partial' : 'Incomplete';
    if (filterStatus === 'complete' && statusLabel !== 'Complete') return null;
    if (filterStatus === 'incomplete' && statusLabel === 'Complete') return null;

    const statusStyle: Record<string, { color: string; backgroundColor: string }> = {
        Complete: { color: '#30d158', backgroundColor: 'rgba(48,209,88,0.12)' },
        Partial: { color: '#ff9f0a', backgroundColor: 'rgba(255,159,10,0.12)' },
        Incomplete: { color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' },
    };

    const lastDoc = docs.reduce((a, b) => (a.uploaded_at ?? '') > (b.uploaded_at ?? '') ? a : b);
    const lastUpd = lastDoc.uploaded_at
        ? new Date(lastDoc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    const folderName = `${MONTH_NAMES[month - 1].slice(0, 3).toUpperCase()} ${yr.year} ${txType.toUpperCase()}S`;
    const iconColor = txType === 'import' ? FOLDER_COLOR.import : FOLDER_COLOR.export;

    return (
        <div key={groupKey}
            className="grid items-center gap-3 px-5 py-3.5 border-b border-border bg-surface hover:bg-hover transition-colors"
            style={{ gridTemplateColumns: '28px 2.5fr 0.8fr 1fr 1fr 1.3fr 1.4fr 0.8fr' }}>

            <FolderSVG color={iconColor} />

            <button
                onClick={() => nav({ level: 'bls', year: yr, type: txType, month })}
                className="text-sm font-semibold text-text-primary truncate text-left hover:text-blue-500 hover:underline underline-offset-2 decoration-blue-400/50 transition-colors">
                {folderName}
            </button>

            <span className="text-xs text-text-secondary tabular-nums text-center">{docs.length.toLocaleString()}</span>
            <span className="text-xs text-text-secondary tabular-nums text-center">{blMap.size.toLocaleString()}</span>

            <span className={`text-xs font-bold tabular-nums text-center ${folderPct >= 90 ? 'text-emerald-500' : folderPct >= 50 ? 'text-amber-500' : 'text-red-500'
                }`}>{folderPct}%</span>

            <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={statusStyle[statusLabel]}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: statusStyle[statusLabel].color }} />
                    {statusLabel}
                </span>
            </div>

            <span className="text-xs text-text-muted text-center">{lastUpd}</span>

            <div className="flex items-center justify-center gap-1.5 relative">
                <FolderRowMenu
                    folderName={folderName}
                    menuKey={groupKey}
                    openMenuKey={openMenuKey}
                    setOpenMenuKey={setOpenMenuKey}
                    docs={docs}
                    type={txType}
                    canDelete={canDelete}
                    onViewHistory={() => onViewHistory(folderName, docs, txType)}
                />
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
    onViewHistory: (folderName: string, docs: ArchiveDocument[], type: TransactionType) => void;
    showAuditButton: boolean;
}

const YearRow = ({ yr, isOpen, toggleYear, filterType, filterStatus, nav, openMenuKey, setOpenMenuKey, onViewHistory, showAuditButton }: YearRowProps) => {
    const grouped = new Map<string, ArchiveDocument[]>();
    for (const doc of yr.documents) {
        const k = `${doc.month}|${doc.type}`;
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k)!.push(doc);
    }

    const allGroups = [...grouped.entries()].sort(([a], [b]) => {
        const [mA, tA] = a.split('|');
        const [mB, tB] = b.split('|');
        return Number(mA) - Number(mB) || tA.localeCompare(tB);
    });

    const visibleGroups = filterType === 'all' ? allGroups : allGroups.filter(([k]) => k.split('|')[1] === filterType);

    const totalFiles = yr.documents.length;
    const totalBLs = yr.imports + yr.exports;
    const yearPct = computeGlobalCompleteness([yr]);

    const incompleteSubCount = allGroups.filter(([k, docs]) => {
        const txType = k.split('|')[1] as TransactionType;
        const bm = new Map<string, ArchiveDocument[]>();
        for (const d of docs) {
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
                className="flex items-center gap-3 px-5 py-3.5 border-b border-border cursor-pointer select-none transition-colors bg-surface hover:bg-hover"
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
                            onClick={e => { e.stopPropagation(); alert(`Downloading FY ${yr.year} archive... (backend pending)`); }}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-input-bg text-text-secondary hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/10 transition-all shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        {showAuditButton && (
                            <button title="Mark as Audited"
                                onClick={e => { e.stopPropagation(); alert(`Mark FY ${yr.year} as Audited - (coming soon)`); }}
                                className="w-7 h-7 flex items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-sm">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isOpen && (
                <div>
                    <div className="grid items-center gap-3 px-5 py-2.5 border-b border-t border-border bg-surface sticky top-0 z-10"
                        style={{ gridTemplateColumns: '28px 2.5fr 0.8fr 1fr 1fr 1.3fr 1.4fr 0.8fr' }}>
                        {['', 'Folder Name', 'Files', 'BL Records', 'Completion', 'Status', 'Last Updated', 'Actions'].map((h, i) => (
                            <span key={i} className={`text-xs font-bold text-text-muted uppercase tracking-widest whitespace-nowrap ${i > 1 ? 'text-center' : ''}`}>{h}</span>
                        ))}
                    </div>
                    {visibleGroups.length === 0 ? (
                        <div className="py-8 text-center text-xs text-text-muted">No folders match the current filter.</div>
                    ) : visibleGroups.map(([key, docs]) => (
                        <SubFolderRow key={key} groupKey={key} docs={docs} yr={yr}
                            filterStatus={filterStatus} nav={nav}
                            openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey}
                            onViewHistory={onViewHistory} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface HistoryTarget {
    folderName: string;
    docs: ArchiveDocument[];
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
    showAuditButton?: boolean;
}

export const ArchivesFolderView = ({
    archiveData, filterYear, filterType, filterStatus,
    expandedYears, toggleYear, nav, openMenuKey, setOpenMenuKey, onOpenUpload,
    showAuditButton = true,
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
                        showAuditButton={showAuditButton}
                        onViewHistory={(folderName, docs, type) => setHistoryTarget({ folderName, docs, type })}
                    />
                ))}
            </div>

            <UploadHistoryPanel
                isOpen={historyTarget !== null}
                onClose={() => setHistoryTarget(null)}
                folderName={historyTarget?.folderName ?? ''}
                docs={historyTarget?.docs ?? []}
                type={historyTarget?.type ?? 'import'}
            />
        </>
    );
};



