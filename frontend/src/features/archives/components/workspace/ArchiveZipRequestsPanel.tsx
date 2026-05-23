import type { ArchiveZipRequest } from '../../hooks/useArchiveZipRequests';

type ArchiveZipRequestsPanelProps = {
    requests: ArchiveZipRequest[];
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onDownload: (requestId: string) => void;
    onRetry: (requestId: string) => void;
    onDismiss: (requestId: string) => void;
    onClearFinished: () => void;
};

const statusStyles: Record<ArchiveZipRequest['status'], string> = {
    pending: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
    processing: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
    ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    failed: 'border-red-500/30 bg-red-500/10 text-red-500',
    expired: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
};

const statusLabels: Record<ArchiveZipRequest['status'], string> = {
    pending: 'Queued',
    processing: 'Preparing',
    ready: 'Ready',
    failed: 'Failed',
    expired: 'Expired',
};

const isActiveZipRequest = (request: ArchiveZipRequest) => (
    request.status === 'pending' || request.status === 'processing'
);

export const ArchiveZipRequestsPanel = ({
    requests,
    isOpen,
    onOpen,
    onClose,
    onDownload,
    onRetry,
    onDismiss,
    onClearFinished,
}: ArchiveZipRequestsPanelProps) => {
    const readyCount = requests.filter((request) => request.status === 'ready').length;
    const preparingCount = requests.filter(isActiveZipRequest).length;
    const canClearFinished = requests.some((request) => !isActiveZipRequest(request));

    return (
        <>
            <button
                onClick={onOpen}
                className="flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 text-xs font-black text-blue-500 transition-colors hover:bg-blue-500/15">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v10m0 0l-4-4m4 4l4-4M5 17v1a3 3 0 003 3h8a3 3 0 003-3v-1" />
                </svg>
                <span>ZIP Requests</span>
                {requests.length > 0 && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-black">
                        {requests.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/45" onClick={onClose} />
                    <aside className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[440px] flex-col border-l border-border bg-surface shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v10m0 0l-4-4m4 4l4-4M5 17v1a3 3 0 003 3h8a3 3 0 003-3v-1" />
                                        </svg>
                                    </span>
                                    <h2 className="text-base font-black text-text-primary">ZIP Requests</h2>
                                    <span className="rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                                        {requests.length}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs font-semibold text-text-muted">
                                    {requests.length === 0
                                        ? 'Prepared archive ZIPs will appear here.'
                                        : preparingCount > 0
                                            ? `${preparingCount} preparing - ${readyCount} ready`
                                            : `${readyCount} ready for download`}
                                </p>
                            </div>
                            <button
                                title="Close ZIP requests"
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-input-bg text-text-muted transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center justify-between border-b border-border px-5 py-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Prepared Downloads</p>
                            {canClearFinished && (
                                <button
                                    onClick={onClearFinished}
                                    className="h-8 rounded-lg border border-border bg-input-bg px-3 text-xs font-bold text-text-secondary transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary">
                                    Clear finished
                                </button>
                            )}
                        </div>

                        {requests.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-elevated text-text-muted">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v10m0 0l-4-4m4 4l4-4M5 17v1a3 3 0 003 3h8a3 3 0 003-3v-1" />
                                    </svg>
                                </div>
                                <p className="mt-3 text-sm font-black text-text-primary">No ZIP requests yet</p>
                                <p className="mt-1 max-w-xs text-xs font-semibold text-text-muted">
                                    Use a folder's three-dot menu to prepare an archive ZIP.
                                </p>
                            </div>
                        ) : (
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                {requests.map((request) => {
                                    const isActive = isActiveZipRequest(request);
                                    const hasCounts = request.blCount > 0 || request.fileCount > 0;

                                    return (
                                    <div key={request.id} className="border-b border-border px-5 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-black text-text-primary">{request.folderName}</p>
                                                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${statusStyles[request.status]}`}>
                                                        {statusLabels[request.status]}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs font-semibold text-text-muted">
                                                    {hasCounts
                                                        ? `${request.blCount.toLocaleString()} BLs - ${request.fileCount.toLocaleString()} files`
                                                        : 'Counting files...'}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs font-semibold text-text-muted">{request.filename}</p>
                                                {isActive && (
                                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                                                        <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
                                                    </div>
                                                )}
                                                {request.errorMessage && (
                                                    <p className="mt-2 text-xs font-bold text-red-500">{request.errorMessage}</p>
                                                )}
                                            </div>
                                            {!isActive && (
                                                <button
                                                    title="Remove request"
                                                    onClick={() => onDismiss(request.id)}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-input-bg text-text-muted transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary">
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            {request.status === 'ready' && request.canDownload && (
                                                <button
                                                    onClick={() => onDownload(request.id)}
                                                    className="h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-black text-emerald-600 transition-colors hover:bg-emerald-500/20">
                                                    Download ZIP
                                                </button>
                                            )}
                                            {(request.status === 'failed' || request.status === 'expired') && (
                                                <button
                                                    onClick={() => onRetry(request.id)}
                                                    className="h-8 rounded-lg border border-border bg-input-bg px-3 text-xs font-bold text-text-secondary transition-colors hover:border-border-strong hover:bg-hover hover:text-text-primary">
                                                    Retry
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </aside>
                </>
            )}
        </>
    );
};
