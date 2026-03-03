import type { ArchiveDocument, ArchiveYear, TransactionType } from '../../types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../types/document.types';
import type { DrillState, SortKey, ViewMode } from './utils/archive.utils';
import { MONTH_NAMES, toTitleCase } from './utils/archive.utils';

interface ArchivesDocumentViewProps {
    flatDocumentList: {
        blNo: string; client: string; type: TransactionType;
        year: number; month: number; stages: Set<string>; yearData: ArchiveYear;
    }[];
    nav: (next: DrillState) => void;
    setViewMode: (m: ViewMode) => void;
}

export const ArchivesDocumentView = ({ flatDocumentList, nav, setViewMode }: ArchivesDocumentViewProps) => {
    if (flatDocumentList.length === 0) return (
        <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <p className="text-sm font-semibold text-gray-600">No records match your filters</p>
            <p className="text-xs">Try changing the search or filter options.</p>
        </div>
    );

    return (
        <div>
            <div className="grid items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50 sticky top-0 z-10"
                style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}>
                {['Year', 'BL Number', 'Client', 'Type', 'Status', 'Stages'].map((h, i) => (
                    <span key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{h}</span>
                ))}
            </div>
            {flatDocumentList.map((r, idx) => {
                const required = r.type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
                const isComplete = required.every(s => r.stages.has(s.key));
                const done = [...required].filter(s => r.stages.has(s.key)).length;
                return (
                    <button key={idx}
                        onClick={() => {
                            setViewMode('folder');
                            nav({ level: 'files', year: r.yearData, type: r.type, month: r.month, bl: r.blNo });
                        }}
                        className="w-full grid items-center gap-4 px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
                        style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}>
                        <span className="text-xs font-bold text-gray-500 tabular-nums">{r.year}</span>
                        <span className="font-mono text-sm font-bold text-gray-800 truncate group-hover:underline underline-offset-2">{r.blNo}</span>
                        <span className="text-xs text-gray-500 truncate">{toTitleCase(r.client || '—')}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit ${r.type === 'import' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            {r.type === 'import' ? 'IMP' : 'EXP'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            {isComplete ? 'Complete' : 'Incomplete'}
                        </span>
                        <span className={`text-xs font-semibold tabular-nums ${isComplete ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {done}/{required.length}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// ─── Global search results panel ──────────────────────────────────────────────
interface GlobalSearchResultsProps {
    globalSearch: string;
    globalResults: {
        blNo: string; client: string; type: TransactionType;
        year: ArchiveYear; month: number; fileCount: number;
    }[];
    nav: (next: DrillState) => void;
    setGlobalSearch: (s: string) => void;
}

export const GlobalSearchResults = ({ globalSearch, globalResults, nav, setGlobalSearch }: GlobalSearchResultsProps) => {
    if (globalResults.length === 0) return (
        <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-semibold text-gray-600">No matches found</p>
            <p className="text-xs">No BL or client matches <span className="font-mono font-semibold">"{globalSearch}"</span></p>
        </div>
    );

    return (
        <div>
            <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {globalResults.length} result{globalResults.length !== 1 ? 's' : ''} across all years
                </span>
            </div>
            {globalResults.map((r, idx) => (
                <button key={idx} onClick={() => { setGlobalSearch(''); nav({ level: 'files', year: r.year, type: r.type, month: r.month, bl: r.blNo }); }}
                    className="w-full flex items-center gap-3 px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group">
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${r.type === 'import' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {r.type === 'import' ? 'IMP' : 'EXP'}
                    </span>
                    <span className="font-mono text-sm font-bold text-gray-800 group-hover:underline truncate">{r.blNo}</span>
                    <span className="text-xs text-gray-500 truncate flex-1">{toTitleCase(r.client || '—')}</span>
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">{MONTH_NAMES[r.month - 1].slice(0, 3)} {r.year.year}</span>
                    <span className="text-[10px] font-semibold text-gray-400 shrink-0">{r.fileCount} {r.fileCount === 1 ? 'file' : 'files'}</span>
                    <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

// ─── BL Row (inside a folder) ──────────────────────────────────────────────────
interface BLFolderRowProps {
    blNo: string;
    blDocs: import('../../types/document.types').ArchiveDocument[];
    drill: Extract<DrillState, { level: 'bls' }>;
    nav: (next: DrillState) => void;
    onAddDoc: (blNo: string, type: TransactionType, docs: import('../../types/document.types').ArchiveDocument[]) => void;
    COL: string;
    color: string;
}

const formatPeriod = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day   = d.getDate();
    const year  = d.getFullYear();
    const lastDayOfMonth = new Date(year, d.getMonth() + 1, 0).getDate();
    return (day === 1 || day === lastDayOfMonth) ? `${month} ${year}` : `${month} ${day}, ${year}`;
};

export const BLFolderRow = ({ blNo, blDocs, drill, nav, onAddDoc, COL, color }: BLFolderRowProps) => {
    const firstDoc     = blDocs[0];
    const uploadedKeys = new Set(blDocs.map(d => d.stage));
    const isImport     = drill.type === 'import';
    const stageList    = isImport ? IMPORT_STAGES : EXPORT_STAGES;
    const done         = stageList.filter(s => uploadedKeys.has(s.key)).length;
    const isComplete   = done === stageList.length;
    const tooltip      = stageList.map(s => `${uploadedKeys.has(s.key) ? '✓' : '○'} ${s.label}`).join('\n');

    return (
        <div className="grid items-center gap-4 px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
            style={{ gridTemplateColumns: COL }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <button
                onClick={() => nav({ level: 'files', year: drill.year, type: drill.type, month: drill.month, bl: blNo })}
                className="text-sm font-bold text-gray-800 truncate text-left font-mono group-hover:underline underline-offset-2 decoration-gray-300">
                {blNo}/
            </button>
            <span className="text-xs text-gray-500 truncate">{toTitleCase(firstDoc?.client ?? '—')}</span>
            {isImport ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${firstDoc?.selective_color === 'red' ? 'bg-red-500' : firstDoc?.selective_color === 'yellow' ? 'bg-yellow-400' : 'bg-green-500'}`} />
                    <span className="capitalize text-gray-500">{firstDoc?.selective_color ?? 'Green'}</span>
                </span>
            ) : (
                <span className="text-xs text-gray-500 truncate" title={firstDoc?.destination_country ?? undefined}>
                    {firstDoc?.destination_country ?? '—'}
                </span>
            )}
            <span className="text-xs text-gray-400 tabular-nums">
                {firstDoc?.transaction_date ? formatPeriod(firstDoc.transaction_date) : '—'}
            </span>
            <span title={tooltip} className={`text-xs font-semibold tabular-nums ${isComplete ? 'text-emerald-600' : done === 0 ? 'text-gray-400' : 'text-amber-500'}`}>
                {done}/{stageList.length}
            </span>
            <button
                onClick={e => { e.stopPropagation(); onAddDoc(blNo, drill.type, blDocs); }}
                title="Add document"
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
            <button
                onClick={() => nav({ level: 'files', year: drill.year, type: drill.type, month: drill.month, bl: blNo })}
                title="Open folder"
                className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

// ─── BL-level view (list of BLs in a month/type folder) ───────────────────────
interface ArchivesBLViewProps {
    drill: Extract<DrillState, { level: 'bls' }>;
    search: string;
    sortKey: SortKey;
    sortDir: 'asc' | 'desc';
    nav: (next: DrillState) => void;
    onAddDoc: (blNo: string, type: TransactionType, docs: import('../../types/document.types').ArchiveDocument[]) => void;
}

export const ArchivesBLView = ({ drill, search, sortKey, sortDir, nav, onAddDoc }: ArchivesBLViewProps) => {
    const typeDocs = drill.year.documents.filter((d: ArchiveDocument) => d.type === drill.type && d.month === drill.month);
    const blGroups = typeDocs.reduce<Record<string, ArchiveDocument[]>>((acc: Record<string, ArchiveDocument[]>, d: ArchiveDocument) => {
        const key = d.bl_no || '(no BL)';
        acc[key] = [...(acc[key] ?? []), d];
        return acc;
    }, {});

    const filteredBlEntries = (Object.entries(blGroups) as [string, ArchiveDocument[]][])
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

    const color    = drill.type === 'import' ? '#16a34a' : '#2563eb';
    const isImport = drill.type === 'import';
    const COL = isImport ? '20px 1fr 1fr 80px 80px 100px 32px 20px' : '20px 1fr 1fr 1fr 100px 100px 32px 20px';

    return (
        <div>
            <div className="grid items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50 sticky top-0 z-10"
                style={{ gridTemplateColumns: COL }}>
                {(isImport
                    ? ['', 'BL Number', 'Importer', 'BLSC', 'Period', 'Stages', '', '']
                    : ['', 'BL Number', 'Shipper', 'Destination', 'Period', 'Stages', '', '']
                ).map((h, i) => (
                    <span key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{h}</span>
                ))}
            </div>
            {filteredBlEntries.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-2 text-gray-400">
                    <p className="text-sm font-semibold text-gray-600">{search ? `No BLs match "${search}"` : 'No records in this folder'}</p>
                </div>
            ) : filteredBlEntries.map(([blNo, blDocs]) => (
                <BLFolderRow key={blNo} blNo={blNo} blDocs={blDocs}
                    drill={drill} nav={nav} onAddDoc={onAddDoc} COL={COL} color={color} />
            ))}
        </div>
    );
};
