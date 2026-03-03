import { useState } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import type { ArchiveDocument, ArchiveYear, TransactionType } from '../../types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../types/document.types';
import { UploadHistoryPanel } from './UploadHistoryPanel';
import { FolderSVG } from './ui/FolderSVG';
import type { DocStatusFilter, DrillState } from './utils/archive.utils';
import { FOLDER_COLOR, MONTH_NAMES, computeGlobalCompleteness, hasRoleAtLeast } from './utils/archive.utils';

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
            className={`w-7 h-7 flex items-center justify-center rounded-md border bg-white transition-all shadow-sm ${
                openMenuKey === menuKey
                    ? 'border-gray-400 text-gray-700 bg-gray-100'
                    : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-100'
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
                <div className="absolute right-0 top-8 z-30 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden">
                    {/* Download */}
                    <button
                        onClick={() => { setOpenMenuKey(null); alert(`Downloading ${folderName}... (backend pending)`); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <div>
                            <p className="text-xs font-semibold text-gray-700">Download this folder</p>
                            <p className="text-[10px] text-gray-400">Save as ZIP file</p>
                        </div>
                    </button>

                    <div className="my-1 border-t border-gray-100" />

                    {/* Upload History */}
                    <button
                        onClick={() => { setOpenMenuKey(null); onViewHistory(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-xs font-semibold text-gray-700">View Upload History</p>
                            <p className="text-[10px] text-gray-400">Who uploaded & when</p>
                        </div>
                    </button>

                    {/* Delete — supervisor+ only */}
                    {canDelete && (
                        <>
                            <div className="my-1 border-t border-gray-100" />
                            <button
                                onClick={() => { setOpenMenuKey(null); alert('Delete Folder — (backend pending)'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors">
                                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <div>
                                    <p className="text-xs font-semibold text-red-600">Delete Folder</p>
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

// ─── Year accordion sub-folder row ────────────────────────────────────────────
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
    const canDelete = hasRoleAtLeast(user?.role, 'supervisor');
    const [monthStr, txType] = groupKey.split('|') as [string, TransactionType];
    const month = Number(monthStr);

    const blMap = new Map<string, Set<string>>();
    for (const d of docs) {
        const bk = d.bl_no || '(no BL)';
        if (!blMap.has(bk)) blMap.set(bk, new Set());
        blMap.get(bk)!.add(d.stage);
    }
    const required = txType === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
    const completedBLs = [...blMap.values()].filter(s => required.every(r => s.has(r.key))).length;
    const folderPct = blMap.size === 0 ? 0 : Math.round((completedBLs / blMap.size) * 100);

    const statusLabel = folderPct >= 90 ? 'Complete' : folderPct >= 50 ? 'Partial' : 'Incomplete';
    if (filterStatus === 'complete'   && statusLabel !== 'Complete') return null;
    if (filterStatus === 'incomplete' && statusLabel === 'Complete') return null;

    const statusCls = {
        Complete:   'bg-emerald-50 text-emerald-700 border-emerald-200',
        Partial:    'bg-amber-50   text-amber-700   border-amber-200',
        Incomplete: 'bg-red-50     text-red-600     border-red-200',
    }[statusLabel];

    const lastDoc = docs.reduce((a, b) => (a.uploaded_at ?? '') > (b.uploaded_at ?? '') ? a : b);
    const lastUpd = lastDoc.uploaded_at
        ? new Date(lastDoc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    const folderName = `${MONTH_NAMES[month - 1].slice(0, 3).toUpperCase()} ${yr.year} ${txType.toUpperCase()}S`;
    const iconColor  = txType === 'import' ? FOLDER_COLOR.import : FOLDER_COLOR.export;

    return (
        <div key={groupKey}
            className="grid items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white hover:bg-gray-50/80 transition-colors"
            style={{ gridTemplateColumns: '28px 1fr 70px 80px 80px 110px 120px 100px' }}>

            <FolderSVG color={iconColor} />

            <button
                onClick={() => nav({ level: 'bls', year: yr, type: txType, month })}
                className="text-sm font-semibold text-gray-700 truncate text-left hover:text-orange-600 hover:underline underline-offset-2 decoration-orange-400/50 transition-colors">
                {folderName}
            </button>

            <span className="text-xs text-gray-500 tabular-nums">{docs.length.toLocaleString()}</span>
            <span className="text-xs text-gray-500 tabular-nums">{blMap.size.toLocaleString()}</span>

            <span className={`text-xs font-bold tabular-nums ${
                folderPct >= 90 ? 'text-emerald-600' : folderPct >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>{folderPct}%</span>

            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${statusCls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                    statusLabel === 'Complete' ? 'bg-emerald-500' : statusLabel === 'Partial' ? 'bg-amber-400' : 'bg-red-500'
                }`} />
                {statusLabel}
            </span>

            <span className="text-xs text-gray-400 truncate">{lastUpd}</span>

            <div className="flex items-center gap-1.5 relative">
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

// ─── Year accordion row ────────────────────────────────────────────────────────
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
}

const YearRow = ({ yr, isOpen, toggleYear, filterType, filterStatus, nav, openMenuKey, setOpenMenuKey, onViewHistory }: YearRowProps) => {
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
    const totalBLs   = yr.imports + yr.exports;
    const yearPct    = computeGlobalCompleteness([yr]);

    const incompleteSubCount = allGroups.filter(([k, docs]) => {
        const txType = k.split('|')[1] as TransactionType;
        const req = txType === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
        const bm = new Map<string, Set<string>>();
        for (const d of docs) {
            const bk = d.bl_no || '(no BL)';
            if (!bm.has(bk)) bm.set(bk, new Set());
            bm.get(bk)!.add(d.stage);
        }
        const pct = bm.size === 0 ? 0 : Math.round(([...bm.values()].filter(s => req.every(r => s.has(r.key))).length / bm.size) * 100);
        return pct < 90;
    }).length;

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <div
                className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 cursor-pointer select-none transition-colors ${isOpen ? 'bg-blue-50/60 border-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => toggleYear(yr.year)}>

                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`text-base font-black ${isOpen ? 'text-blue-800' : 'text-gray-800'}`}>FY {yr.year}</span>
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full">
                    {allGroups.length} {allGroups.length === 1 ? 'folder' : 'folders'}
                </span>

                <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                    <span className="tabular-nums">{totalFiles.toLocaleString()} files</span>
                    <span className="tabular-nums">{totalBLs.toLocaleString()} BLs</span>
                    <span className="font-bold tabular-nums text-gray-700">{yearPct}% complete</span>
                    {incompleteSubCount > 0 && (
                        <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                            {incompleteSubCount} Folder{incompleteSubCount !== 1 ? 's' : ''} Incomplete
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 ml-2" onClick={e => e.stopPropagation()}>
                        <button title="Download ZIP"
                            onClick={e => { e.stopPropagation(); alert(`Downloading FY ${yr.year} archive... (backend pending)`); }}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button title="Mark as Audited"
                            onClick={e => { e.stopPropagation(); alert(`Mark FY ${yr.year} as Audited - (coming soon)`); }}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-400 transition-all shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="grid items-center gap-3 px-5 py-2 border-b border-t border-gray-100 bg-gray-50/70 sticky top-0 z-10"
                        style={{ gridTemplateColumns: '28px 1fr 70px 80px 80px 110px 120px 100px' }}>
                        {['', 'Folder Name', 'Files', 'BL Records', 'Completion', 'Status', 'Last Updated', 'Actions'].map((h, i) => (
                            <span key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{h}</span>
                        ))}
                    </div>
                    {visibleGroups.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">No folders match the current filter.</div>
                    ) : visibleGroups.map(([key, docs]) => (
                        <SubFolderRow key={key} groupKey={key} docs={docs} yr={yr}
                            filterStatus={filterStatus} nav={nav}
                            openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey}
                            onViewHistory={onViewHistory} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Main FolderView export ────────────────────────────────────────────────────
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
}

export const ArchivesFolderView = ({
    archiveData, filterYear, filterType, filterStatus,
    expandedYears, toggleYear, nav, openMenuKey, setOpenMenuKey, onOpenUpload,
}: ArchivesFolderViewProps) => {
    const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null);
    const filteredYears = filterYear === 'all' ? archiveData : archiveData.filter(y => String(y.year) === filterYear);

    if (filteredYears.length === 0) return (
        <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <p className="text-sm font-semibold text-gray-600">
                {filterYear !== 'all' ? `No archive found for ${filterYear}` : 'No archives yet'}
            </p>
            <p className="text-xs text-gray-400">
                {filterYear !== 'all' ? 'Try selecting a different year.' : 'Upload legacy files to start building the archive.'}
            </p>
            {filterYear === 'all' && (
                <button onClick={onOpenUpload}
                    className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90"
                    style={{ backgroundColor: '#f97316' }}>
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
