import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
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
        <div className="py-20 flex flex-col items-center gap-2 text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">No records match your filters</p>
            <p className="text-xs">Try changing the search or filter options.</p>
        </div>
    );

    return (
        <div>
            <div className="max-md:overflow-x-auto">
                <div className="min-w-[43rem]">
                    <div
                        className="grid items-center gap-4 px-5 py-3 border-b border-border/80 bg-muted/40 sticky top-0 z-10"
                        style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}
                    >
                        {['Year', 'BL Number', 'Client', 'Type', 'Status', 'Stages'].map((h, i) => (
                            <span key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                {h}
                            </span>
                        ))}
                    </div>
            {isFetching && rows.length === 0 ? (
                <div className="divide-y divide-border/60">
                    {Array.from({ length: Math.min(perPage, 8) }).map((_, index) => (
                        <div
                            key={index}
                            className="grid items-center gap-4 px-5 py-3.5"
                            style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}
                        >
                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                <span key={cellIndex} className="h-4 animate-pulse rounded bg-muted" />
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                rows.map((r) => {
                    const completion = getArchiveBlCompletion(r.documents, r.type);
                    return (
                        <button
                            key={`${r.year}-${r.type}-${r.bl_no}`}
                            onClick={() => {
                                setViewMode('folder');
                                nav({ level: 'files', year: getYearData(r), type: r.type, month: r.month, bl: r.bl_no });
                            }}
                            className="w-full grid items-center gap-4 px-5 py-3.5 border-b border-border/60 hover:bg-muted/40 transition-colors text-left group cursor-pointer"
                            style={{ gridTemplateColumns: '60px 1fr 1fr 80px 100px 80px' }}
                        >
                            <span className="text-xs font-semibold text-muted-foreground tabular-nums">{r.year}</span>
                            <span className="font-mono text-sm font-semibold text-foreground truncate group-hover:underline underline-offset-2">
                                {r.bl_no}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-xs text-foreground">{toTitleCase(r.client || '—')}</span>
                                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                                    {r.type === 'import'
                                        ? `Vessel: ${r.documents[0]?.vessel_name ?? '—'} • Location: ${r.documents[0]?.location_of_goods ?? '—'}`
                                        : `Vessel: ${r.documents[0]?.vessel_name ?? '—'} • Destination: ${r.documents[0]?.destination_country ?? '—'}`}
                                </span>
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit ${
                                    r.type === 'import'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                }`}
                            >
                                {r.type === 'import' ? 'IMP' : 'EXP'}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${
                                    completion.isComplete
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        completion.isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                />
                                {completion.isComplete ? 'Complete' : 'Incomplete'}
                            </span>
                            <span
                                className={`text-xs font-semibold tabular-nums ${
                                    completion.isComplete
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                }`}
                            >
                                {completion.doneCount}/{completion.requiredStages.length}
                            </span>
                        </button>
                    );
                })
            )}
                </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-border/80 bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                    Showing {from.toLocaleString()}-{to.toLocaleString()} of {totalRows.toLocaleString()} BL records
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        Rows
                        <select
                            value={perPage}
                            onChange={(event) => {
                                onPerPageChange(Number(event.target.value));
                            }}
                            className="rounded-lg border border-border/80 bg-background px-2 py-1 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary cursor-pointer"
                        >
                            {[25, 50, 100].map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        className="rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                        Previous
                    </button>
                    <span className="min-w-20 text-center text-xs font-semibold text-muted-foreground">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        className="rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-2xs"
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

export const BLFolderRow = ({ blNo, blDocs, drill, nav, COL }: BLFolderRowProps) => {
    const firstDoc = blDocs[0];
    const isImport = drill.type === 'import';
    const completion = getArchiveBlCompletion(blDocs, drill.type);
    const tooltip = completion.requiredStages
        .map((stage) => `${completion.uploadedStages.has(stage.key) ? 'Uploaded' : 'Missing'} ${stage.label}`)
        .join('\n');

    return (
        <div
            className="grid items-center gap-4 px-5 py-3.5 border-b border-border/60 hover:bg-muted/40 transition-colors group"
            style={{ gridTemplateColumns: COL }}
        >
            <Folder
                className={`w-4 h-4 shrink-0 ${isImport ? 'text-emerald-500' : 'text-blue-500'}`}
            />
            <button
                onClick={() =>
                    nav({
                        level: 'files',
                        year: { ...drill.year, documents: blDocs },
                        type: drill.type,
                        month: drill.month,
                        bl: blNo,
                    })
                }
                className="text-sm font-mono font-semibold text-foreground truncate text-left group-hover:underline underline-offset-2 decoration-border cursor-pointer"
            >
                {blNo}/
            </button>
            <span className="min-w-0">
                <span className="block truncate text-xs text-foreground">{toTitleCase(firstDoc?.client ?? '—')}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                    {isImport
                        ? `Vessel: ${firstDoc?.vessel_name ?? '—'} • Location: ${firstDoc?.location_of_goods ?? '—'}`
                        : `Vessel: ${firstDoc?.vessel_name ?? '—'} • Destination: ${firstDoc?.destination_country ?? '—'}`}
                </span>
            </span>
            {isImport ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold truncate">
                    <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                            firstDoc?.selective_color === 'red'
                                ? 'bg-rose-500'
                                : firstDoc?.selective_color === 'orange' || firstDoc?.selective_color === 'yellow'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                        }`}
                    />
                    <span className="capitalize text-foreground">{firstDoc?.selective_color ?? 'Green'}</span>
                </span>
            ) : (
                <span className="text-xs text-foreground truncate" title={firstDoc?.destination_country ?? undefined}>
                    {firstDoc?.destination_country ?? '—'}
                </span>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
                {firstDoc?.transaction_date ? formatPeriod(firstDoc.transaction_date) : '—'}
            </span>
            <span
                title={tooltip}
                className={`text-xs font-semibold tabular-nums ${
                    completion.isComplete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : completion.doneCount === 0
                          ? 'text-muted-foreground'
                          : 'text-amber-600 dark:text-amber-400'
                }`}
            >
                {completion.doneCount}/{completion.requiredStages.length}
            </span>
            <button
                onClick={() =>
                    nav({
                        level: 'files',
                        year: { ...drill.year, documents: blDocs },
                        type: drill.type,
                        month: drill.month,
                        bl: blNo,
                    })
                }
                title="Open folder"
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-foreground"
            >
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
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
            <div className="max-md:overflow-x-auto">
                <div className="min-w-[44rem]">
                    <div
                        className="grid items-center gap-4 px-5 py-3 border-b border-border/80 bg-muted/40 sticky top-0 z-10"
                        style={{ gridTemplateColumns: COL }}
                    >
                        {(isImport
                            ? ['', 'BL Number', 'Importer', 'BLSC', 'Period', 'Stages', '', '']
                            : ['', 'BL Number', 'Shipper', 'Destination', 'Period', 'Stages', '', '']
                        ).map((h, i) => (
                            <span key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                {h}
                            </span>
                        ))}
                    </div>
            {historyQuery.isFetching && rows.length === 0 ? (
                <div className="divide-y divide-border/60">
                    {Array.from({ length: Math.min(perPage, 8) }).map((_, index) => (
                        <div
                            key={index}
                            className="grid items-center gap-4 px-5 py-3.5"
                            style={{ gridTemplateColumns: COL }}
                        >
                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                <span key={cellIndex} className="h-4 animate-pulse rounded bg-muted" />
                            ))}
                        </div>
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="text-sm font-semibold text-foreground">
                        {search ? `No BLs match "${search}"` : 'No records in this folder'}
                    </p>
                </div>
            ) : (
                rows.map((row) => (
                    <BLFolderRow
                        key={`${row.type}-${row.transaction_id}`}
                        blNo={row.bl_no || '(no BL)'}
                        blDocs={row.documents}
                        drill={drill}
                        nav={nav}
                        COL={COL}
                        color={color}
                    />
                ))
            )}
                </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-border/80 bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                    Showing {from.toLocaleString()}-{to.toLocaleString()} of {totalRows.toLocaleString()} BL records
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        Rows
                        <select
                            value={perPage}
                            onChange={(event) => {
                                setPerPage(Number(event.target.value));
                                setPage(1);
                            }}
                            className="rounded-lg border border-border/80 bg-background px-2 py-1 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary cursor-pointer"
                        >
                            {[25, 50, 100].map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                        className="rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                        Previous
                    </button>
                    <span className="min-w-20 text-center text-xs font-semibold text-muted-foreground">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                        className="rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

