import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { IconName } from '../../../components/Icon';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { trackingApi } from '../api/trackingApi';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { mapExportTransaction, mapImportTransaction } from '../utils/mappers';
import { FilePreviewModal } from './FilePreviewModal';
import { UploadModal } from './UploadModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StageUpload {
    fileName:   string;
    fileObject: File;
}

// ─── Stage definitions ────────────────────────────────────────────────────────

const IMPORT_STAGES: { title: string; icon: IconName }[] = [
    { title: 'BOC Document Processing',   icon: 'file-text' },
    { title: 'Payment for PPA Charges',   icon: 'truck' },
    { title: 'Delivery Order Request',    icon: 'file-text' },
    { title: 'Payment for Port Charges',  icon: 'file-text' },
    { title: 'Releasing of Documents',    icon: 'check-circle' },
    { title: 'Liquidation and Billing',   icon: 'file-text' },
];

const EXPORT_STAGES: { title: string; icon: IconName }[] = [
    { title: 'BOC Document Processing',    icon: 'file-text' },
    { title: 'Bill of Lading Generation',  icon: 'file-text' },
    { title: 'CO Application and Releasing', icon: 'check-circle' },
    { title: 'DCCCI Printing',             icon: 'file-text' },
    { title: 'Billing of Liquidation',     icon: 'file-text' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStageStatus(index: number, status: string): 'Completed' | 'Pending' {
    if (status === 'Cleared' || status === 'Shipped') return 'Completed';
    if (status === 'In Transit' && index < 3) return 'Completed';
    if (status === 'Delayed'    && index < 2) return 'Completed';
    return 'Pending';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TrackingDetails = () => {
    const navigate = useNavigate();
    const { referenceId } = useParams();
    const { user } = useOutletContext<LayoutContext>();

    const [transaction, setTransaction] = useState<ImportTransaction | ExportTransaction | undefined>();
    const [loading, setLoading] = useState(true);

    // Upload state
    const [isUploadOpen,       setIsUploadOpen]       = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [stageUploads,       setStageUploads]       = useState<Record<number, StageUpload>>({});
    const [previewFile,        setPreviewFile]        = useState<{ file: File | string | null; name: string } | null>(null);

    useEffect(() => {
        if (!referenceId) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                // Try imports first
                const importsRes = await trackingApi.getImports({ search: referenceId });
                if (importsRes.data.length > 0 && !cancelled) {
                    setTransaction(mapImportTransaction(importsRes.data[0]));
                } else {
                    const exportsRes = await trackingApi.getExports({ search: referenceId });
                    if (exportsRes.data.length > 0 && !cancelled) {
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
            setStageUploads(prev => ({
                ...prev,
                [selectedStageIndex]: { fileName: file.name, fileObject: file },
            }));
            setIsUploadOpen(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-border border-t-blue-600" />
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────────
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
    const stages   = isImport ? IMPORT_STAGES : EXPORT_STAGES;

    return (
        <div className="flex flex-col space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 mb-2 transition-colors"
                    >
                        <Icon name="chevron-left" className="w-3.5 h-3.5" />
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-text-primary">Ref No: {transaction.ref}</h1>
                    <p className="text-xs text-text-muted mt-0.5">
                        Dashboard / Tracking / {transaction.ref}
                        {user && <span className="ml-2 opacity-50">· {user.name}</span>}
                    </p>
                </div>
                <StatusBadge status={transaction.status} />
            </div>

            {/* Status Overview Card */}
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-text-primary">{transaction.ref}</h2>
                        <p className="text-sm text-text-secondary">
                            Bill of Lading: <span className="font-bold text-text-primary">{transaction.bl || '—'}</span>
                        </p>
                        {'importer' in transaction && (
                            <p className="text-sm text-text-secondary">
                                Importer: <span className="font-bold text-text-primary">{(transaction as ImportTransaction).importer}</span>
                            </p>
                        )}
                        {'shipper' in transaction && (
                            <p className="text-sm text-text-secondary">
                                Shipper: <span className="font-bold text-text-primary">{(transaction as ExportTransaction).shipper}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stages.map((stage, i) => {
                    const status      = getStageStatus(i, transaction.status);
                    const isCompleted = status === 'Completed';
                    const upload      = stageUploads[i];

                    return (
                        <div
                            key={i}
                            className="relative bg-surface rounded-xl p-6 border border-border shadow-sm transition-all duration-200 group hover:border-border-strong"
                        >
                            {/* Upload button — visible on hover */}
                            <button
                                onClick={e => { e.stopPropagation(); handleStageUploadClick(i); }}
                                className="absolute top-4 right-4 p-2 rounded-full bg-surface-secondary hover:bg-hover text-text-muted hover:text-blue-600 transition-all shadow-sm active:scale-95 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 border border-border"
                                title="Upload File"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>

                            {/* Stage icon + title */}
                            <div className="flex items-center gap-3 mb-4 pr-10">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                    isCompleted
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
                                        : 'bg-surface-secondary text-text-muted'
                                }`}>
                                    <Icon name={stage.icon} className="w-5 h-5" />
                                </div>
                                <h3 className={`font-bold text-sm ${isCompleted ? 'text-text-primary' : 'text-text-secondary'}`}>
                                    {stage.title}
                                </h3>
                            </div>

                            {/* Uploaded file */}
                            {(upload || isCompleted) && (
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">File Uploaded</p>
                                    <div
                                        onClick={() => {
                                            if (upload) setPreviewFile({ file: upload.fileObject, name: upload.fileName });
                                        }}
                                        className={`cursor-pointer bg-surface-secondary hover:bg-hover px-3 py-2 rounded-lg border border-border transition-colors group/file ${!upload ? 'opacity-75' : ''}`}
                                    >
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate group-hover/file:underline">
                                            {upload ? upload.fileName : 'Document.pdf'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Status dot + label */}
                            <div className="flex items-center gap-2 mt-auto pt-2">
                                <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-border-strong'}`} />
                                <p className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-text-muted'}`}>
                                    {status}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
                title={selectedStageIndex !== null ? stages[selectedStageIndex].title : ''}
            />

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
            />
        </div>
    );
};
