import { useDeferredValue, useState } from 'react';
import { ConfirmationModal } from '../../../../components/ConfirmationModal';
import { Pagination } from '../../../../components/Pagination';
import { useLegacyBatch } from '../../hooks/useLegacyBatch';
import { useLegacyBatches } from '../../hooks/useLegacyBatches';
import { useLegacyBatchMutations } from '../../hooks/useLegacyBatchMutations';
import type { LegacyBatchModule } from '../../types/legacyBatch.types';
import { LegacyFolderBrowserPanel } from '../legacy-upload/LegacyFolderBrowserPanel';

const StatusChip = ({ status }: { status: string }) => {
    const cls = status === 'completed'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : status === 'interrupted'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : status === 'failed'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-blue-200 bg-blue-50 text-blue-700';

    return (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
            {status}
        </span>
    );
};

export const LegacyBatchesPage = ({
    module,
    eyebrow = 'Legacy Batches',
    title = 'Uploaded legacy batches',
    description = 'Browse uploaded legacy batches and open the preserved folder hierarchy for retrieval.',
    searchPlaceholder = 'Search batch, root folder, or uploader...',
    deleteTitle = 'Delete Incomplete Legacy Batch',
    onResumeBatch,
}: {
    module?: LegacyBatchModule;
    eyebrow?: string;
    title?: string;
    description?: string;
    searchPlaceholder?: string;
    deleteTitle?: string;
    onResumeBatch?: (batchId: string) => void;
}) => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const trimmedSearch = deferredSearch.trim();
    const { data, isLoading, isError } = useLegacyBatches({ page, perPage, search: trimmedSearch, module });
    const [viewingBatchId, setViewingBatchId] = useState<string | null>(null);
    const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
    const { data: viewingBatch } = useLegacyBatch(viewingBatchId, Boolean(viewingBatchId));
    const { deleteBatch } = useLegacyBatchMutations();
    const batches = data?.items ?? [];
    const pagination = data?.pagination ?? {
        currentPage: 1,
        perPage,
        total: 0,
        lastPage: 1,
        from: null,
        to: null,
    };

    const deletingBatch = deletingBatchId
        ? batches.find((batch) => batch.id === deletingBatchId) ?? null
        : null;

    return (
        <>
            <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-surface">
                    <div className="border-b border-border px-5 py-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">{eyebrow}</p>
                        <h2 className="mt-2 text-xl font-black tracking-tight text-text-primary">{title}</h2>
                        <p className="mt-2 text-sm text-text-muted">
                            {description}
                        </p>
                    </div>

                    <div className="border-b border-border px-5 py-3">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative max-w-md flex-1">
                                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Escape') {
                                            setSearch('');
                                            setPage(1);
                                        }
                                    }}
                                    placeholder={searchPlaceholder}
                                    aria-label="Search legacy batches"
                                    className="h-10 w-full rounded-lg border border-border-strong bg-input-bg pl-10 pr-10 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setPage(1);
                                        }}
                                        aria-label="Clear legacy batch search"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div className="text-xs font-semibold text-text-muted">
                                {trimmedSearch
                                    ? `${pagination.total.toLocaleString()} matching batch${pagination.total === 1 ? '' : 'es'}`
                                    : `${pagination.total.toLocaleString()} legacy batches`}
                            </div>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="px-5 py-10 text-sm text-text-muted">Loading legacy batches...</div>
                    )}

                    {isError && (
                        <div className="px-5 py-10 text-sm text-red-600">Unable to load legacy batches right now.</div>
                    )}

                    {!isLoading && !isError && batches.length === 0 && (
                        <div className="px-5 py-10 text-sm text-text-muted">
                            {trimmedSearch
                                ? `No legacy batches match "${trimmedSearch}".`
                                : 'No legacy batches have been uploaded yet.'}
                        </div>
                    )}

                    {!isLoading && !isError && batches.length > 0 && (
                        <>
                            <div className="divide-y divide-border">
                                {batches.map((row) => {
                                    const canDelete = ['draft', 'interrupted', 'failed'].includes(row.status);

                                    return (
                                        <div
                                            key={row.id}
                                            className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_140px_220px] xl:items-center"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-text-primary">{row.batchName}</p>
                                                <p className="mt-1 text-xs text-text-muted">
                                                    Root: <span className="font-semibold text-text-secondary">{row.rootFolder}</span>
                                                    {' '}· Uploaded by {row.uploadedBy} · {row.uploadDate}
                                                </p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center rounded-full border border-border bg-surface-secondary/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                                                        {row.metadata.department}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full border border-border bg-surface-secondary/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                                                        {row.metadata.year}
                                                    </span>
                                                    {row.metadata.notes && (
                                                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                                            Has notes
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                                                <div className="rounded-xl border border-border bg-surface-secondary/50 px-3 py-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Files</p>
                                                    <p className="mt-1 text-sm font-bold text-text-primary">{row.fileCount.toLocaleString()}</p>
                                                </div>
                                                <div className="rounded-xl border border-border bg-surface-secondary/50 px-3 py-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Size</p>
                                                    <p className="mt-1 text-sm font-bold text-text-primary">{row.totalSize}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center xl:justify-center">
                                                <StatusChip status={row.status} />
                                            </div>

                                            <div className="text-xs text-text-muted xl:text-center">
                                                {row.uploadSummary.uploaded}/{row.uploadSummary.expected} uploaded
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-end">
                                                {row.canResume && onResumeBatch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onResumeBatch(row.id)}
                                                        className="rounded-lg px-3 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-50 xl:min-w-[72px] xl:text-center"
                                                    >
                                                        Resume
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingBatchId(row.id)}
                                                    className="rounded-lg px-3 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50 xl:min-w-[60px] xl:text-center"
                                                >
                                                    View
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingBatchId(row.id)}
                                                        className="rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 xl:min-w-[68px] xl:text-center"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-border px-5 py-4">
                                <div className="text-xs text-text-muted">
                                    {trimmedSearch
                                        ? `Showing ${pagination.from ?? 0}-${pagination.to ?? 0} of ${pagination.total.toLocaleString()} matching batch${pagination.total === 1 ? '' : 'es'}`
                                        : `Showing ${pagination.from ?? 0}-${pagination.to ?? 0} of ${pagination.total.toLocaleString()} legacy batches`}
                                </div>
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.lastPage}
                                    perPage={perPage}
                                    perPageOptions={[25, 50, 100]}
                                    compact
                                    onPageChange={setPage}
                                    onPerPageChange={(nextPerPage) => {
                                        setPerPage(nextPerPage);
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {viewingBatchId && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setViewingBatchId(null)} />
                    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl flex-col border-l border-border bg-surface shadow-2xl">
                        {viewingBatch ? (
                            <LegacyFolderBrowserPanel batch={viewingBatch} onClose={() => setViewingBatchId(null)} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-text-muted">
                                Loading batch details...
                            </div>
                        )}
                    </div>
                </>
            )}

            <ConfirmationModal
                isOpen={deletingBatch !== null}
                onClose={() => setDeletingBatchId(null)}
                onConfirm={async () => {
                    if (!deletingBatch) {
                        return;
                    }

                    await deleteBatch.mutateAsync(deletingBatch.id);

                    if (viewingBatchId === deletingBatch.id) {
                        setViewingBatchId(null);
                    }

                    if (page > 1 && batches.length === 1) {
                        setPage((current) => Math.max(current - 1, 1));
                    }
                }}
                title={deleteTitle}
                message={deletingBatch
                    ? `This will remove ${deletingBatch.batchName} from the legacy batches list and delete any stored orphaned files for this interrupted or failed batch.`
                    : ''}
                confirmText="Delete Batch"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </>
    );
};
