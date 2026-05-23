import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { TransactionType } from '../../../documents/types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../../documents/types/document.types';
import { useArchiveFolderHistory } from '../../hooks/useArchiveFolderHistory';
import type { ArchiveFolderHistoryCompletion, ArchiveFolderHistoryRow } from '../../types/archiveHistory.types';
import { toTitleCase } from '../../utils/archive.utils';

interface UploadHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    folderName: string;
    year: number;
    month: number;
    type: TransactionType;
    mine: boolean;
}

const PER_PAGE = 25;

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

const formatDateOnly = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
}) : 'No uploads yet');

const filterButtonClass = (isActive: boolean) =>
    `rounded-lg border px-3 py-1.5 text-[11px] font-black transition-colors ${
        isActive
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800'
    }`;

const PaginationButton = ({
    disabled,
    onClick,
    children,
}: {
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
}) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-black text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
        {children}
    </button>
);

export const UploadHistoryPanel = ({ isOpen, onClose, folderName, year, month, type, mine }: UploadHistoryPanelProps) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [completionFilter, setCompletionFilter] = useState<ArchiveFolderHistoryCompletion>('all');
    const [page, setPage] = useState(1);
    const displayStages = useMemo(() => (type === 'import' ? IMPORT_STAGES : EXPORT_STAGES), [type]);
    const stageLabels = useMemo(() => new Map(displayStages.map((stage) => [stage.key, stage.label])), [displayStages]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [search]);

    const { data, isFetching, isError } = useArchiveFolderHistory({
        year,
        month,
        type,
        mine,
        page,
        perPage: PER_PAGE,
        search: debouncedSearch,
        completion: completionFilter,
        sort: 'period',
        direction: 'desc',
        enabled: isOpen && year > 0 && month > 0,
    });

    const rows = data?.data ?? [];
    const summary = data?.summary;
    const meta = data?.meta;

    const handleCompletionChange = (value: ArchiveFolderHistoryCompletion) => {
        setCompletionFilter(value);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
            />

            <aside className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="shrink-0 border-b border-gray-100 bg-gray-50/90 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                                <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Folder Activity</p>
                            </div>
                            <h2 className="truncate text-lg font-black text-gray-900">{folderName}</h2>
                            <p className="mt-0.5 text-xs font-semibold text-gray-400">
                                {(summary?.total_bl_records ?? 0).toLocaleString()} BL record{summary?.total_bl_records === 1 ? '' : 's'} - {(summary?.total_files ?? 0).toLocaleString()} total file{summary?.total_files === 1 ? '' : 's'} - Latest {formatDateOnly(summary?.latest_uploaded_at)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            title="Close"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total BLs</p>
                            <p className="mt-0.5 text-lg font-black text-gray-900">{(summary?.total_bl_records ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Complete</p>
                            <p className="mt-0.5 text-lg font-black text-emerald-700">{(summary?.complete_bl_records ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Needs Docs</p>
                            <p className="mt-0.5 text-lg font-black text-amber-700">{(summary?.incomplete_bl_records ?? 0).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-4.35-4.35m1.1-5.15a6.25 6.25 0 11-12.5 0 6.25 6.25 0 0112.5 0z" />
                            </svg>
                            <input
                                value={search}
                                onChange={(event) => handleSearchChange(event.target.value)}
                                placeholder="Search BL, client, uploader, file, or stage"
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm font-semibold text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
                            />
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {([
                                ['all', 'All'],
                                ['complete', 'Complete'],
                                ['incomplete', 'Needs Docs'],
                            ] as const).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleCompletionChange(value)}
                                    className={filterButtonClass(completionFilter === value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {isError ? (
                        <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                            <p className="text-sm font-black text-gray-800">Folder activity failed to load</p>
                            <p className="mt-1 max-w-sm text-xs font-semibold text-gray-400">Check your connection and try again.</p>
                        </div>
                    ) : isFetching && rows.length === 0 ? (
                        <div className="space-y-3 p-5">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
                                    <div className="mt-3 h-2 w-72 max-w-full animate-pulse rounded bg-gray-200" />
                                </div>
                            ))}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                            <p className="text-sm font-black text-gray-800">No matching activity</p>
                            <p className="mt-1 max-w-sm text-xs font-semibold text-gray-400">Try another search term or switch the completion filter.</p>
                        </div>
                    ) : (
                        <div className={`divide-y divide-gray-100 ${isFetching ? 'opacity-60' : ''}`}>
                            {rows.map((row) => (
                                <HistoryRow key={`${row.type}-${row.transaction_id}`} row={row} displayStages={displayStages} stageLabels={stageLabels} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold text-gray-400">
                        {meta?.total ? `Showing ${meta.from ?? 0}-${meta.to ?? 0} of ${meta.total.toLocaleString()} matching BLs` : 'No matching BLs'}
                    </p>
                    <div className="flex items-center gap-2">
                        <PaginationButton disabled={!meta || meta.current_page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                            Previous
                        </PaginationButton>
                        <span className="min-w-20 text-center text-xs font-black text-gray-500">
                            {meta ? `${meta.current_page} / ${meta.last_page}` : '1 / 1'}
                        </span>
                        <PaginationButton disabled={!meta || meta.current_page >= meta.last_page || isFetching} onClick={() => setPage((current) => current + 1)}>
                            Next
                        </PaginationButton>
                    </div>
                </div>
            </aside>
        </>
    );
};

const HistoryRow = ({
    row,
    displayStages,
    stageLabels,
}: {
    row: ArchiveFolderHistoryRow;
    displayStages: typeof IMPORT_STAGES | typeof EXPORT_STAGES;
    stageLabels: Map<string, string>;
}) => {
    const uploaded = useMemo(() => {
        const stageMap = new Map<string, ArchiveFolderHistoryRow['documents']>();

        for (const document of row.documents) {
            if (!stageMap.has(document.stage)) {
                stageMap.set(document.stage, []);
            }
            stageMap.get(document.stage)!.push(document);
        }

        return stageMap;
    }, [row.documents]);
    const notApplicableLabels = row.not_applicable_stages
        .map((stageKey) => stageLabels.get(stageKey) ?? stageKey)
        .join(', ');

    return (
        <details className="group">
            <summary className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50">
                <svg className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate font-mono text-sm font-black text-gray-900">{row.bl_no}</span>
                        {row.client && (
                            <span className="truncate text-xs font-semibold text-gray-400">- {toTitleCase(row.client)}</span>
                        )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="flex items-center gap-1">
                            {row.required_stages.map((stageKey) => (
                                <span
                                    key={stageKey}
                                    title={stageLabels.get(stageKey) ?? stageKey}
                                    className={`h-1.5 w-5 rounded-full ${uploaded.has(stageKey) ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[11px] font-black tabular-nums text-gray-500">
                            {row.uploaded_stage_count}/{row.required_stage_count}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400">
                            {row.documents.length} file{row.documents.length !== 1 ? 's' : ''}
                        </span>
                        {row.latest_uploader?.name && (
                            <span className="truncate text-[11px] font-semibold text-gray-400">
                                Latest by {row.latest_uploader.name}
                            </span>
                        )}
                        {row.not_applicable_stages.length > 0 && (
                            <span className="truncate text-[11px] font-bold text-amber-500">
                                N/A: {notApplicableLabels}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${row.is_complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${row.is_complete ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        {row.is_complete ? 'Complete' : 'Needs Docs'}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">{formatDateOnly(row.latest_uploaded_at)}</span>
                </div>
            </summary>

            <div className="border-t border-gray-100 bg-gray-50/70">
                {displayStages.map((stage) => {
                    const stageDocs = uploaded.get(stage.key) ?? [];
                    const hasFile = stageDocs.length > 0;
                    const isRequiredStage = row.required_stages.includes(stage.key);
                    const isNotApplicableStage = row.not_applicable_stages.includes(stage.key);

                    return (
                        <div key={stage.key} className="border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center gap-2 px-9 py-2">
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                    hasFile ? 'bg-emerald-500' : isNotApplicableStage ? 'bg-amber-400' : 'bg-gray-300'
                                }`} />
                                <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">{stage.label}</span>
                                {isNotApplicableStage && (
                                    <span className="ml-auto text-[10px] font-bold text-amber-500">Marked N/A</span>
                                )}
                                {!hasFile && isRequiredStage && !isNotApplicableStage && (
                                    <span className="ml-auto text-[10px] font-bold text-red-400">Missing</span>
                                )}
                            </div>

                            {stageDocs.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 px-9 pb-2.5">
                                    <svg className="h-3.5 w-3.5 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-bold text-gray-700" title={doc.filename}>{doc.filename}</p>
                                        <p className="text-[10px] font-semibold text-gray-400">
                                            {doc.uploader?.name ?? 'Unknown'}{doc.uploaded_at ? ` - ${formatDateTime(doc.uploaded_at)}` : ''}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-gray-400">{doc.formatted_size}</span>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </details>
    );
};
