import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import type { IconName } from '../../../components/Icon';
import { Icon } from '../../../components/Icon';
import { trackingApi } from '../api/trackingApi';
import { useDeleteDocument } from '../hooks/useDeleteDocument';
import { useDocuments } from '../hooks/useDocuments';
import { useTransactionDetail } from '../hooks/useTransactionDetail';
import { useUploadDocument } from '../hooks/useUploadDocument';
import type { ApiDocument, DocumentableType, ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { FilePreviewModal } from './modals/FilePreviewModal';
import { UploadModal } from './modals/UploadModal';
import { PageHeader } from './shared/PageHeader';

export const TrackingDetails = () => {
    const navigate = useNavigate();
    const { referenceId } = useParams();
    const { user } = useOutletContext<LayoutContext>();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [previewFile, setPreviewFile] = useState<{ file: File | string | null; name: string } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const { data: transaction, isLoading, isError } = useTransactionDetail(referenceId);

    // Determine documentable type based on transaction ref
    const isImport = transaction
        ? (transaction.ref.startsWith('IMP') || !transaction.ref.startsWith('EXP'))
        : true;
    const documentableType: DocumentableType = isImport
        ? 'App\\Models\\ImportTransaction'
        : 'App\\Models\\ExportTransaction';

    // Fetch documents for this transaction
    const { data: documents = [] } = useDocuments(
        documentableType,
        transaction?.id ?? 0,
        !!transaction,
    );

    // Mutations
    const uploadMutation = useUploadDocument();
    const deleteMutation = useDeleteDocument();

    const handleStageUploadClick = (index: number) => {
        setSelectedStageIndex(index);
        setIsUploadModalOpen(true);
    };

    const handleUpload = (file: File) => {
        if (selectedStageIndex === null || !transaction) return;

        const stages = isImport ? importStages : exportStages;
        const stageKey = stages[selectedStageIndex]?.key ?? 'other';

        uploadMutation.mutate(
            {
                file,
                type: stageKey,
                documentable_type: documentableType,
                documentable_id: transaction.id,
            },
            {
                onSuccess: () => setIsUploadModalOpen(false),
            },
        );
    };

    const handleDownload = (doc: ApiDocument) => {
        trackingApi.downloadDocument(doc.id, doc.filename);
    };

    const handleDelete = (doc: ApiDocument) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Document',
            message: `Are you sure you want to delete "${doc.filename}"? This action cannot be undone.`,
            onConfirm: () => deleteMutation.mutate(doc.id),
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12">
                <Icon name="alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary">Failed to Load</h3>
                <p className="text-text-secondary mb-6">Could not fetch transaction data. Please check your connection.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="text-center py-12">
                <Icon name="alert-circle" className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary">Transaction Not Found</h3>
                <p className="text-text-secondary mb-6">The transaction with reference ID {referenceId} could not be found.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const importStages = [
        { title: 'BOC Document Processing',  icon: 'file-text'    as IconName, key: 'boc' },
        { title: 'Payment for PPA Charges',  icon: 'truck'        as IconName, key: 'ppa' },
        { title: 'Delivery Order Request',   icon: 'file-text'    as IconName, key: 'do' },
        { title: 'Payment for Port Charges', icon: 'file-text'    as IconName, key: 'port_charges' },
        { title: 'Releasing of Documents',   icon: 'check-circle' as IconName, key: 'releasing' },
        { title: 'Liquidation and Billing',  icon: 'file-text'    as IconName, key: 'billing' },
    ];

    const exportStages = [
        { title: 'BOC Document Processing',      icon: 'file-text'    as IconName, key: 'boc' },
        { title: 'Bill of Lading Generation',    icon: 'file-text'    as IconName, key: 'bl_generation' },
        { title: 'CO Application and Releasing', icon: 'check-circle' as IconName, key: 'co' },
        { title: 'DCCCI Printing',               icon: 'file-text'    as IconName, key: 'dccci' },
        { title: 'Billing of Liquidation',       icon: 'file-text'    as IconName, key: 'billing' },
    ];

    const stages = isImport ? importStages : exportStages;

    const getStageStatus = (index: number) => {
        if (transaction.status === 'Cleared') return 'Completed';
        if (transaction.status === 'In Transit' && index < 3) return 'Completed';
        if (transaction.status === 'In Transit' && index === 3) return 'Pending';
        if (transaction.status === 'Delayed' && index < 2) return 'Completed';
        if (transaction.status === 'Delayed' && index === 2) return 'Pending';
        return 'Pending';
    };

    // Group documents by their type (which maps to a stage key)
    const getDocsForStage = (stageKey: string): ApiDocument[] =>
        documents.filter(d => d.type === stageKey);

    const getStatusStyle = (status: string) => {
        if (status === 'Cleared' || status === 'Shipped') return { color: '#30d158', bg: 'rgba(48,209,88,0.13)' };
        if (status === 'Pending' || status === 'Processing') return { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' };
        if (status === 'Delayed') return { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' };
        return { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' };
    };
    const s = getStatusStyle(transaction.status);

    return (
        <div className="flex flex-col space-y-6">
            <PageHeader
                title={`Ref No: ${transaction.ref}`}
                breadcrumb={`Dashboard / Tracking / ${transaction.ref}`}
                user={user || null}
            />

            {/* Status Overview Card */}
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary mb-1">{transaction.ref}</h2>
                        <p className="text-sm text-text-secondary font-bold">
                            Bill of Lading: <span className="text-text-primary font-bold">{transaction.bl}</span>
                        </p>
                        {'importer' in transaction && (
                            <p className="text-sm text-text-secondary font-bold mt-1">
                                Importer: <span className="text-text-primary font-bold">{(transaction as ImportTransaction).importer}</span>
                            </p>
                        )}
                        {'shipper' in transaction && (
                            <p className="text-sm text-text-secondary font-bold mt-1">
                                Shipper: <span className="text-text-primary font-bold">{(transaction as ExportTransaction).shipper}</span>
                            </p>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: s.color, backgroundColor: s.bg }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                        {transaction.status}
                    </span>
                </div>
            </div>

            {/* Stage Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stages.map((stage, i) => {
                    const status = getStageStatus(i);
                    const isCompleted = status === 'Completed';
                    const stageDocs = getDocsForStage(stage.key);

                    return (
                        <div
                            key={i}
                            className="relative bg-surface rounded-xl p-6 border border-border shadow-sm transition-all duration-200 group hover:border-border-strong"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); handleStageUploadClick(i); }}
                                className="absolute top-4 right-4 p-2 rounded-full bg-surface-secondary hover:bg-hover text-text-muted hover:text-blue-600 transition-all shadow-sm active:scale-95 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 border border-border"
                                title="Upload File"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-3 mb-4 pr-10">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-surface-secondary text-text-muted dark:bg-gray-800/50'}`}>
                                    <Icon name={stage.icon} className="w-5 h-5" />
                                </div>
                                <h3 className={`font-bold ${isCompleted ? 'text-text-primary' : 'text-text-secondary'}`}>{stage.title}</h3>
                            </div>

                            {/* Documents for this stage */}
                            {stageDocs.length > 0 && (
                                <div className="mb-3 space-y-2">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                                        {stageDocs.length} {stageDocs.length === 1 ? 'File' : 'Files'} Uploaded
                                    </p>
                                    {stageDocs.map(doc => (
                                        <div key={doc.id} className="flex items-center gap-2 bg-surface-secondary hover:bg-hover px-3 py-2 rounded-lg border border-border transition-colors group/file">
                                            <div
                                                className="flex-1 min-w-0 cursor-pointer"
                                                onClick={() => setPreviewFile({ file: null, name: doc.filename })}
                                            >
                                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate group-hover/file:underline">
                                                    {doc.filename}
                                                </p>
                                                <p className="text-[10px] text-text-muted">
                                                    {doc.formatted_size}
                                                    {doc.uploaded_by && ` · ${doc.uploaded_by.name}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                                                className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors shrink-0"
                                                title="Download"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                                                title="Delete"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-auto pt-2">
                                <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <p className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{status}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
                title={selectedStageIndex !== null ? stages[selectedStageIndex].title : ''}
                isLoading={uploadMutation.isPending}
                errorMessage={uploadMutation.isError ? (uploadMutation.error as Error).message : undefined}
            />

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file || null}
                fileName={previewFile?.name || ''}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};
