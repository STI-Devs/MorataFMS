import { useState } from 'react';
import type { ArchiveDocument, ArchiveYear } from '../../../documents/types/document.types';
import type { ArchiveDocumentIndexResponse, ArchiveDocumentIndexRow } from '../../types/archiveHistory.types';
import { useArchiveFolderHistory } from '../../hooks/useArchiveFolderHistory';
import type { DrillState, SortKey, ViewMode } from '../../utils/archive.utils';
import {
    getArchiveBlCompletion,
    toTitleCase,
} from '../../utils/archive.utils';

interface ArchivesDocumentViewProps {
    rows: ArchiveDocumentIndexRow[];
    meta: ArchiveDocumentIndexResponse['meta'] | undefined;
    isFetching: boolean;
    page: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    getYearData: (row: ArchiveDocumentIndexRow) => ArchiveYear;
    nav: (next: DrillState) => void;
    setViewMode: (m: ViewMode) => void;
}

export const ArchivesDocumentView = ({
    rows,
    meta,
    isFetching,
    page,
    perPage,
    onPageChange,
    onPerPageChange,
    getYearData,
    nav,
    setViewMode,
}: ArchivesDocumentViewProps) => {
    const currentPage = meta?.current_page ?? page;
    const totalPages = meta?.last_page ?? 1;
    const totalRows = meta?.total ?? 0;
    const from = meta?.from ?? (totalRows > 0 ? 1 : 0);
    const to = meta?.to ?? rows.length;

    if (!isFetching && rows.length === 0) return (
        <div className="py-20 flex flex-col items-center gap-3 text-text-muted">
            <p className="text-sm font-semibold text-text-secondary">No records match your filters</p>
            <p className="text-xs">Try changing the search or filter options.</p>
        </div>
    );

    return (
        <div>
            <div className="grid items-center gap-4 px-5 py-3 border-b border-border bg-surface sticky top-0 z-10"
                style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}>
                {['Year', 'BL Number', 'Client', 'Type', 'Status', 'Stages'].map((h, i) => (
                    <span key={i} className="text-xs font-bold text-text-muted uppercase tracking-widest truncate">{h}</span>
                ))}
            </div>
            {isFetching && rows.length === 0 ? (
                <div className="divide-y divide-border">
                    {Array.from({ length: Math.min(perPage, 8) }).map((_, index) => (
                        <div
                            key={index}
                            className="grid items-center gap-4 px-5 py-3.5"
                            style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}
                        >
                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                <span key={cellIndex} className="h-4 animate-pulse rounded bg-surface-secondary" />
                            ))}
                        </div>
                    ))}
                </div>
            ) : rows.map((r) => {
                const completion = getArchiveBlCompletion(r.documents, r.type);
                return (
                    <button key={`${r.year}-${r.type}-${r.bl_no}`}
                        onClick={() => {
                            setViewMode('folder');
                            nav({ level: 'files', year: getYearData(r), type: r.type, month: r.month, bl: r.bl_no });
                        }}
                        className="w-full grid items-center gap-4 px-5 py-3.5 border-b border-border hover:bg-hover transition-colors text-left group"
                        style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}>
                        <span className="text-xs font-bold text-text-secondary tabular-nums">{r.year}</span>
                        <span className="font-mono text-sm font-bold text-text-primary truncate group-hover:underline underline-offset-2">{r.bl_no}</span>
                        <span className="min-w-0">
                            <span className="block truncate text-xs text-text-secondary">{toTitleCase(r.client || '—')}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-text-muted">
                                {r.type === 'import'
                                    ? `Vessel: ${r.documents[0]?.vessel_name ?? '—'} • Location: ${r.documents[0]?.location_of_goods ?? '—'}`
                                    : `Vessel: ${r.documents[0]?.vessel_name ?? '—'} • Destination: ${r.documents[0]?.destination_country ?? '—'}`}
                            </span>
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit ${r.type === 'import' ? 'bg-success/10 text-success border border-success/30' : 'bg-info/10 text-info border border-info/30'}`}>
                            {r.type === 'import' ? 'IMP' : 'EXP'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${completion.isComplete ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${completion.isComplete ? 'bg-success' : 'bg-warning'}`} />
                            {completion.isComplete ? 'Complete' : 'Incomplete'}
                        </span>
                        <span className={`text-xs font-semibold tabular-nums ${completion.isComplete ? 'text-success' : 'text-warning'}`}>
                            {completion.doneCount}/{completion.requiredStages.length}
                        </span>
                    </button>
                );
            })}
            <div className="flex flex-col gap-3 border-t border-border bg-surface-secondary/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-text-muted">
                    Showing {from.toLocaleString()}-{to.toLocaleString()} of {totalRows.toLocaleString()} BL records
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                        Rows
                        <select
                            value={perPage}
                            onChange={(event) => {
                                onPerPageChange(Number(event.target.value));
                            }}
                            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-bold text-text-primary outline-none transition-colors focus:border-primary"
                        >
                            {[25, 50, 100].map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="min-w-20 text-center text-xs font-black text-text-muted">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BLFolderRowProps {
    blNo: string;
    blDocs: ArchiveDocument[];
    drill: Extract<DrillState, { level: 'bls' }>;
    nav: (next: DrillState) => void;
    COL: string;
    color: string;
}

const formatPeriod = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    const lastDayOfMonth = new Date(year, d.getMonth() + 1, 0).getDate();
    return (day === 1 || day === lastDayOfMonth) ? `${month} ${year}` : `${month} ${day}, ${year}`;
};

export const BLFolderRow = ({ blNo, blDocs, drill, nav, COL, color }: BLFolderRowProps) => {
    const firstDoc = blDocs[0];
    const isImport = drill.type === 'import';
    const completion = getArchiveBlCompletion(blDocs, drill.type);
    const tooltip = completion.requiredStages
        .map((stage) => `${completion.uploadedStages.has(stage.key) ? 'Uploaded' : 'Missing'} ${stage.label}`)
        .join('\n');

    return (
        <div className="grid items-center gap-4 px-5 py-3.5 border-b border-border hover:bg-hover transition-colors group"
            style={{ gridTemplateColumns: COL }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <button
                onClick={() => nav({ level: 'files', year: { ...drill.year, documents: blDocs }, type: drill.type, month: drill.month, bl: blNo })}
                className="text-sm font-bold text-text-primary truncate text-left font-mono group-hover:underline underline-offset-2 decoration-border-strong">
                {blNo}/
            </button>
            <span className="min-w-0">
                <span className="block truncate text-xs text-text-secondary">{toTitleCase(firstDoc?.client ?? '—')}</span>
                <span className="mt-0.5 block truncate text-[10px] text-text-muted">
                    {isImport
                        ? `Vessel: ${firstDoc?.vessel_name ?? '—'} • Location: ${firstDoc?.location_of_goods ?? '—'}`
                        : `Vessel: ${firstDoc?.vessel_name ?? '—'} • Destination: ${firstDoc?.destination_country ?? '—'}`}
                </span>
            </span>
            {isImport ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${firstDoc?.selective_color === 'red' ? 'bg-danger' : firstDoc?.selective_color === 'orange' ? 'bg-warning' : firstDoc?.selective_color === 'yellow' ? 'bg-warning' : 'bg-success'}`} />
                    <span className="capitalize text-text-secondary">{firstDoc?.selective_color ?? 'Green'}</span>
                </span>
            ) : (
                <span className="text-xs text-text-secondary truncate" title={firstDoc?.destination_country ?? undefined}>
                    {firstDoc?.destination_country ?? '—'}
                </span>
            )}
            <span className="text-xs text-text-muted tabular-nums">
                {firstDoc?.transaction_date ? formatPeriod(firstDoc.transaction_date) : '—'}
            </span>
            <span title={tooltip} className={`text-xs font-semibold tabular-nums ${completion.isComplete ? 'text-success' : completion.doneCount === 0 ? 'text-text-muted' : 'text-warning'}`}>
                {completion.doneCount}/{completion.requiredStages.length}
            </span>
            <button
                onClick={() => nav({ level: 'files', year: { ...drill.year, documents: blDocs }, type: drill.type, month: drill.month, bl: blNo })}
                title="Open folder"
                className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3.5 h-3.5 text-text-muted/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

interface ArchivesBLViewProps {
    drill: Extract<DrillState, { level: 'bls' }>;
    search: string;
    sortKey: SortKey;
    sortDir: 'asc' | 'desc';
    historyMine: boolean;
    filterStatus: 'all' | 'complete' | 'incomplete';
    nav: (next: DrillState) => void;
}

export const ArchivesBLView = ({
    drill,
    search,
    sortKey,
    sortDir,
    historyMine,
    filterStatus,
    nav,
}: ArchivesBLViewProps) => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const queryIdentity = `${drill.year.year}|${drill.month}|${drill.type}|${search}|${filterStatus}|${sortKey}|${sortDir}`;
    const [lastQueryIdentity, setLastQueryIdentity] = useState(queryIdentity);
    const effectivePage = lastQueryIdentity === queryIdentity ? page : 1;

    if (lastQueryIdentity !== queryIdentity) {
        setLastQueryIdentity(queryIdentity);
        if (page !== 1) {
            setPage(1);
        }
    }

    const historyQuery = useArchiveFolderHistory({
        year: drill.year.year,
        month: drill.month,
        type: drill.type,
        mine: historyMine,
        page: effectivePage,
        perPage,
        search,
        completion: filterStatus,
        sort: sortKey,
        direction: sortDir,
        enabled: true,
    });

    const rows = historyQuery.data?.data ?? [];
    const meta = historyQuery.data?.meta;
    const currentPage = meta?.current_page ?? effectivePage;
    const totalPages = meta?.last_page ?? 1;
    const totalRows = meta?.total ?? 0;
    const from = meta?.from ?? (totalRows > 0 ? 1 : 0);
    const to = meta?.to ?? rows.length;
    const color = drill.type === 'import' ? 'var(--success)' : 'var(--info)';
    const isImport = drill.type === 'import';
    const COL = isImport ? '20px 1fr 1fr 80px 80px 100px 20px' : '20px 1fr 1fr 1fr 100px 100px 20px';

    return (
        <div>
            <div className="grid items-center gap-4 px-5 py-3 border-b border-border bg-surface sticky top-0 z-10"
                style={{ gridTemplateColumns: COL }}>
                {(isImport
                    ? ['', 'BL Number', 'Importer', 'BLSC', 'Period', 'Stages', '', '']
                    : ['', 'BL Number', 'Shipper', 'Destination', 'Period', 'Stages', '', '']
                ).map((h, i) => (
                    <span key={i} className="text-xs font-bold text-text-muted uppercase tracking-widest truncate">{h}</span>
                ))}
            </div>
            {historyQuery.isFetching && rows.length === 0 ? (
                <div className="divide-y divide-border">
                    {Array.from({ length: Math.min(perPage, 8) }).map((_, index) => (
                        <div
                            key={index}
                            className="grid items-center gap-4 px-5 py-3.5"
                            style={{ gridTemplateColumns: COL }}
                        >
                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                <span key={cellIndex} className="h-4 animate-pulse rounded bg-surface-secondary" />
                            ))}
                        </div>
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-2 text-text-muted">
                    <p className="text-sm font-semibold text-text-secondary">{search ? `No BLs match "${search}"` : 'No records in this folder'}</p>
                </div>
            ) : rows.map((row) => (
                <BLFolderRow key={`${row.type}-${row.transaction_id}`} blNo={row.bl_no || '(no BL)'} blDocs={row.documents}
                    drill={drill} nav={nav} COL={COL} color={color} />
            ))}
            <div className="flex flex-col gap-3 border-t border-border bg-surface-secondary/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-text-muted">
                    Showing {from.toLocaleString()}-{to.toLocaleString()} of {totalRows.toLocaleString()} BL records
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                        Rows
                        <select
                            value={perPage}
                            onChange={(event) => {
                                setPerPage(Number(event.target.value));
                                setPage(1);
                            }}
                            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-bold text-text-primary outline-none transition-colors focus:border-primary"
                        >
                            {[25, 50, 100].map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="min-w-20 text-center text-xs font-black text-text-muted">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};
