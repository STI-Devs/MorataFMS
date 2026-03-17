import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { IconName } from '../../../components/Icon';
import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { trackingApi } from '../api/trackingApi';
import type { ApiExportTransaction, ApiImportTransaction, ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { mapExportTransaction, mapImportTransaction } from '../utils/mappers';
import EditTransactionModal from './EditTransactionModal';
import { RemarkViewerModal } from './RemarkViewerModal';


interface StageUpload {
    fileName: string;
    fileObject: File;
}

interface StageDefinition {
    title: string;
    icon: IconName;
    description: string;
}

const IMPORT_STAGES: StageDefinition[] = [
    { title: 'BOC Document Processing', icon: 'file-text', description: 'Submit and process customs declaration at the Bureau of Customs.' },
    { title: 'Payment for PPA Charges', icon: 'truck', description: 'Settle port and pier authority charges.' },
    { title: 'Delivery Order Request', icon: 'file-text', description: 'Request delivery order from the shipping line or agent.' },
    { title: 'Payment for Port Charges', icon: 'file-text', description: 'Pay remaining port storage and handling fees.' },
    { title: 'Releasing of Documents', icon: 'check-circle', description: 'Collect released documents from customs and shipping line.' },
    { title: 'Liquidation and Billing', icon: 'file-text', description: 'Finalize billing and liquidate all charges with the client.' },
];

const EXPORT_STAGES: StageDefinition[] = [
    { title: 'BOC Document Processing', icon: 'file-text', description: 'Submit export declaration at the Bureau of Customs.' },
    { title: 'Bill of Lading Generation', icon: 'file-text', description: 'Coordinate with shipping line to issue the Bill of Lading.' },
    { title: 'CO Application & Releasing', icon: 'check-circle', description: 'Apply for and receive Certificate of Origin.' },
    { title: 'DCCCI Printing', icon: 'file-text', description: 'Print documents from DCCCI for export compliance.' },
    { title: 'Billing of Liquidation', icon: 'file-text', description: 'Finalize billing and close out the export transaction.' },
];


function getStageStatus(index: number, status: string): 'completed' | 'active' | 'pending' {
    if (status === 'Cleared' || status === 'Shipped') return 'completed';
    if (status === 'In Transit') {
        if (index < 3) return 'completed';
        if (index === 3) return 'active';
    }
    if (status === 'Pending' || status === 'Processing') {
        if (index === 0) return 'active';
    }
    return 'pending';
}

function getStatusStyle(status: string): { color: string; bg: string } {
    if (status === 'Cleared' || status === 'Shipped') return { color: '#30d158', bg: 'rgba(48,209,88,0.13)' };
    if (status === 'Pending' || status === 'Processing') return { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' };
    if (status === 'In Transit') return { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' };
    if (status === 'Cancelled') return { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' };
    return { color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' };
}


export const TrackingDetails = () => {
    const navigate = useNavigate();
    const { referenceId } = useParams();
    const { user } = useOutletContext<LayoutContext>();

    const [transaction, setTransaction] = useState<ImportTransaction | ExportTransaction | undefined>();
    const [rawTransaction, setRawTransaction] = useState<ApiImportTransaction | ApiExportTransaction | undefined>();
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [stageUploads, setStageUploads] = useState<Record<number, StageUpload>>({});
    const [previewFile, setPreviewFile] = useState<{ file: File | string | null; name: string } | null>(null);

    useEffect(() => {
        if (!referenceId) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const importsRes = await trackingApi.getImports({ search: referenceId });
                if (importsRes.data.length > 0 && !cancelled) {
                    setRawTransaction(importsRes.data[0]);
                    setTransaction(mapImportTransaction(importsRes.data[0]));
                } else {
                    const exportsRes = await trackingApi.getExports({ search: referenceId });
                    if (exportsRes.data.length > 0 && !cancelled) {
                        setRawTransaction(exportsRes.data[0]);
                        setTransaction(mapExportTransaction(exportsRes.data[0]));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch transaction', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [referenceId]);

    const handleStageUploadClick = (index: number) => {
        setSelectedStageIndex(index);
        setIsUploadOpen(true);
    };

    const handleUpload = (file: File) => {
        if (selectedStageIndex !== null) {
            setStageUploads(prev => ({ ...prev, [selectedStageIndex]: { fileName: file.name, fileObject: file } }));
            setIsUploadOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-border border-t-blue-600" />
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="text-center py-16">
                <Icon name="alert-circle" className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary">Transaction Not Found</h3>
                <p className="text-text-secondary mt-1 mb-6">
                    The transaction with reference <span className="font-bold">{referenceId}</span> could not be found.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const isImport = transaction.ref.startsWith('IMP') || !transaction.ref.startsWith('EXP');
    const stages = isImport ? IMPORT_STAGES : EXPORT_STAGES;
    const s = getStatusStyle(transaction.status);

    const stageStatuses = stages.map((_, i) => getStageStatus(i, transaction.status));
    const completedCount = stageStatuses.filter(s => s === 'completed').length;
    const activeIndex = stageStatuses.findIndex(s => s === 'active');
    const progressPct = Math.round((completedCount / stages.length) * 100);

    const importTx = isImport ? (transaction as ImportTransaction) : null;
    const exportTx = !isImport ? (transaction as ExportTransaction) : null;

    return (
        <div className="flex flex-col space-y-5 pb-6">

            {/* ── Page Header ───────────────────────────────────────────── */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 mb-3 transition-colors"
                >
                    <Icon name="chevron-left" className="w-3.5 h-3.5" />
                    Back
                </button>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-0.5">

                            <h1 className="text-2xl font-bold text-text-primary">{transaction.ref}</h1>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                            Dashboard / Tracking / {transaction.ref}
                            {user && <span className="ml-2 opacity-50">· {user.name}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            title="Remarks"
                            onClick={() => setIsRemarkModalOpen(true)}
                            className="flex items-center justify-center w-8 h-8 text-text-secondary border border-border-strong rounded-lg hover:bg-hover hover:text-text-primary transition-colors relative"
                        >
                            <Icon name="flag" className="w-4 h-4" />
                            {transaction.open_remarks_count > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-surface shrink-0">
                                    {transaction.open_remarks_count}
                                </span>
                            )}
                        </button>
                        <button
                            title="Edit Transaction"
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center justify-center w-8 h-8 text-text-secondary border border-border-strong rounded-lg hover:bg-hover hover:text-text-primary transition-colors"
                        >
                            <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold"
                            style={{ color: s.color, backgroundColor: s.bg }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                            {transaction.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Info Card ─────────────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Key fields grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-b border-border">
                    {/* Bill of Lading */}
                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Bill of Lading</p>
                        <p className="text-sm font-bold text-text-primary truncate">{transaction.bl || '—'}</p>
                    </div>
                    {/* Importer / Shipper */}
                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">{isImport ? 'Importer' : 'Shipper'}</p>
                        <p className="text-sm font-bold text-text-primary truncate">{importTx?.importer ?? exportTx?.shipper ?? '—'}</p>
                    </div>
                    {/* Arrival / Departure */}
                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">{isImport ? 'Arrival Date' : 'Departure Date'}</p>
                        <p className="text-sm font-bold text-text-primary truncate">{importTx?.date ?? exportTx?.departureDate ?? '—'}</p>
                    </div>
                    {/* Selective Color (import) / Destination (export) */}
                    <div className="px-5 py-4">
                        {isImport ? (
                            <>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Selective Color</p>
                                <div className="flex items-center">
                                    <span
                                        className="text-sm font-bold capitalize px-2 py-0.5 rounded-md"
                                        style={{
                                            color: (transaction as ImportTransaction).color,
                                            backgroundColor: `${(transaction as ImportTransaction).color}18`,
                                        }}
                                    >
                                        {(() => {
                                            const hex = (transaction as ImportTransaction).color;
                                            if (hex === '#22c55e') return 'Green';
                                            if (hex === '#eab308') return 'Yellow';
                                            if (hex === '#f97316') return 'Orange';
                                            if (hex === '#ef4444') return 'Red';
                                            return (transaction as ImportTransaction).colorLabel || '—';
                                        })()}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Destination</p>
                                <p className="text-sm font-bold text-text-primary truncate">{exportTx?.portOfDestination || '—'}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-text-secondary">
                            Clearance Progress
                        </p>
                        <p className="text-xs font-bold tabular-nums" style={{ color: s.color }}>
                            {completedCount} / {stages.length} stages &mdash; {progressPct}%
                        </p>
                    </div>
                    <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${progressPct}%`,
                                backgroundColor: s.color,
                                boxShadow: progressPct > 0 ? `0 0 8px ${s.color}60` : 'none',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Vertical Stepper ──────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text-primary">Processing Stages</h2>
                    <span className="text-[10px] font-bold text-text-muted bg-surface-secondary border border-border px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {isImport ? 'Import' : 'Export'} workflow
                    </span>
                </div>

                <div className="divide-y divide-border/60">
                    {stages.map((stage, i) => {
                        const stageStatus = stageStatuses[i];
                        const isCompleted = stageStatus === 'completed';
                        const isActive = stageStatus === 'active';
                        const upload = stageUploads[i];
                        const isLast = i === stages.length - 1;

                        return (
                            <div
                                key={i}
                                className={`relative flex gap-4 px-5 py-4 transition-colors ${isActive ? 'bg-blue-500/5 dark:bg-blue-500/8' : ''
                                    }`}
                            >
                                {/* Step indicator column */}
                                <div className="flex flex-col items-center shrink-0 pt-0.5">
                                    {/* Circle */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : isActive
                                                ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                                : 'bg-surface-secondary border-border text-text-muted'
                                        }`}>
                                        {isCompleted ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span className="text-xs font-bold">{i + 1}</span>
                                        )}
                                    </div>
                                    {/* Connector line */}
                                    {!isLast && (
                                        <div className={`w-0.5 flex-1 mt-1 min-h-[24px] rounded-full transition-colors ${isCompleted ? 'bg-emerald-400/60' : 'bg-border'
                                            }`} />
                                    )}
                                </div>

                                {/* Stage content */}
                                <div className="flex-1 min-w-0 pb-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className={`text-sm font-bold ${isCompleted ? 'text-text-primary' : isActive ? 'text-blue-600 dark:text-blue-400' : 'text-text-secondary'
                                                    }`}>
                                                    {stage.title}
                                                </h3>
                                                {isActive && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                                                        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                                        In Progress
                                                    </span>
                                                )}
                                                {isCompleted && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                                        Done
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-muted leading-relaxed">{stage.description}</p>
                                        </div>

                                        {/* Upload button */}
                                        <button
                                            onClick={e => { e.stopPropagation(); handleStageUploadClick(i); }}
                                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shrink-0 self-center shadow-sm"
                                            title="Upload document for this stage"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Uploaded file pill */}
                                    {(upload || (isCompleted && activeIndex === -1)) && (
                                        <div
                                            onClick={() => upload && setPreviewFile({ file: upload.fileObject, name: upload.fileName })}
                                            className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 bg-surface-secondary hover:bg-hover border border-border rounded-lg cursor-pointer transition-colors group/file"
                                        >
                                            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover/file:underline truncate max-w-[240px]">
                                                {upload ? upload.fileName : 'Document.pdf'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
                title={selectedStageIndex !== null ? stages[selectedStageIndex].title : ''}
            />

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
            />

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    navigate(`/tracking/${transaction.ref}`, { replace: true });
                }}
                type={isImport ? 'import' : 'export'}
                transaction={rawTransaction ?? null}
            />

            {isRemarkModalOpen && (
                <RemarkViewerModal
                    isOpen={isRemarkModalOpen}
                    onClose={() => {
                        setIsRemarkModalOpen(false);
                        // Optimistic update: reset open remarks badge without re-fetching
                        setTransaction(prev => prev ? { ...prev, open_remarks_count: 0 } : prev);
                    }}
                    transactionType={isImport ? 'import' : 'export'}
                    transactionId={transaction.id}
                    transactionLabel={`${isImport ? 'Import' : 'Export'} — ${transaction.ref}`}
                />
            )}
        </div>
    );
};
