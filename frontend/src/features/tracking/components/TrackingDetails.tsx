import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { IconName } from '../../../components/Icon';
import { Icon } from '../../../components/Icon';
import { trackingApi } from '../api/trackingApi';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { FilePreviewModal } from './FilePreviewModal';
import { PageHeader } from './shared/PageHeader';
import { UploadModal } from './UploadModal';

interface StageUpload {
    fileName: string;
    fileObject: File;
}

export const TrackingDetails = () => {
    const navigate = useNavigate();
    const { referenceId } = useParams();
    const { user } = useOutletContext<LayoutContext>();

    const [transaction, setTransaction] = useState<ImportTransaction | ExportTransaction | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    // Upload state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [stageUploads, setStageUploads] = useState<Record<number, StageUpload>>({});
    const [previewFile, setPreviewFile] = useState<{ file: File | string | null; name: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (referenceId) {
                setLoading(true);
                try {
                    // Try imports first (search by customs ref)
                    const importsRes = await trackingApi.getImports({ search: referenceId });
                    if (importsRes.data.length > 0) {
                        const t = importsRes.data[0];
                        setTransaction({
                            id: t.id,
                            ref: t.customs_ref_no,
                            bl: t.bl_no,
                            status: t.status === 'pending' ? 'Pending' : t.status === 'in_progress' ? 'In Transit' : t.status === 'completed' ? 'Cleared' : 'Delayed',
                            color: t.selective_color === 'green' ? 'bg-green-500' : t.selective_color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500',
                            importer: t.importer?.name || 'Unknown',
                            date: t.arrival_date || '',
                        });
                    } else {
                        // Try exports
                        const exportsRes = await trackingApi.getExports({ search: referenceId });
                        if (exportsRes.data.length > 0) {
                            const t = exportsRes.data[0];
                            setTransaction({
                                id: t.id,
                                ref: `EXP-${String(t.id).padStart(4, '0')}`,
                                bl: t.bl_no,
                                status: t.status === 'pending' ? 'Processing' : t.status === 'in_progress' ? 'In Transit' : t.status === 'completed' ? 'Shipped' : 'Delayed',
                                color: '',
                                shipper: t.shipper?.name || 'Unknown',
                                vessel: t.vessel || '',
                                departureDate: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
                                portOfDestination: t.destination_country?.name || '',
                            });
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch transaction", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [referenceId]);

    // Upload handlers
    const handleStageUploadClick = (index: number) => {
        setSelectedStageIndex(index);
        setIsUploadModalOpen(true);
    };

    const handleUpload = (file: File) => {
        if (selectedStageIndex !== null) {
            setStageUploads(prev => ({
                ...prev,
                [selectedStageIndex]: { fileName: file.name, fileObject: file }
            }));
            setIsUploadModalOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

    const isImport = transaction.ref.startsWith('IMP');

    const getStageStatus = (index: number) => {
        if (transaction.status === 'Cleared') return 'Completed';
        if (transaction.status === 'In Transit' && index < 3) return 'Completed';
        if (transaction.status === 'In Transit' && index === 3) return 'In Progress';
        if (transaction.status === 'Delayed' && index < 2) return 'Completed';
        if (transaction.status === 'Delayed' && index === 2) return 'In Progress';
        if (transaction.status === 'Pending' && index === 0) return 'In Progress';
        return 'Pending';
    };

    const importStages = [
        { title: 'BOC Document Processing', icon: 'file-text' as IconName },
        { title: 'Payment for PPA Charges', icon: 'truck' as IconName },
        { title: 'Delivery Order Request', icon: 'file-text' as IconName },
        { title: 'Payment for Port Charges', icon: 'file-text' as IconName },
        { title: 'Releasing of Documents', icon: 'check-circle' as IconName },
        { title: 'Liquidation and Billing', icon: 'file-text' as IconName }
    ];

    const exportStages = [
        { title: 'BOC Document Processing', icon: 'file-text' as IconName },
        { title: 'Bill of Lading Generation', icon: 'file-text' as IconName },
        { title: 'CO Application and Releasing', icon: 'check-circle' as IconName },
        { title: 'DCCCI Printing', icon: 'file-text' as IconName },
        { title: 'Billing of Liquidation', icon: 'file-text' as IconName },
    ];

    const stages = isImport ? importStages : exportStages;

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
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${transaction.status === 'Cleared' || transaction.status === 'Shipped' ? 'bg-green-50 text-green-700' :
                            transaction.status === 'Delayed' ? 'bg-red-50 text-red-700' :
                                transaction.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-blue-50 text-blue-700'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${transaction.status === 'Cleared' || transaction.status === 'Shipped' ? 'bg-green-500' :
                                transaction.status === 'Delayed' ? 'bg-red-500' :
                                    transaction.status === 'Pending' ? 'bg-yellow-500' :
                                        'bg-blue-500'
                            }`}></span>
                        {transaction.status}
                    </span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stages.map((stage, i) => {
                    const status = getStageStatus(i);
                    const isCompleted = status === 'Completed';
                    const isInProgress = status === 'In Progress';
                    const upload = stageUploads[i];

                    return (
                        <div
                            key={i}
                            className={`relative bg-surface rounded-2xl p-6 border transition-all duration-200 group ${isInProgress ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-border shadow-sm hover:border-border-strong'
                                }`}
                        >
                            {/* Upload Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStageUploadClick(i);
                                }}
                                className="absolute top-4 right-4 p-2 rounded-full bg-surface-secondary hover:bg-hover text-text-muted hover:text-blue-600 transition-all shadow-sm active:scale-95 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 border border-border"
                                title="Upload File"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-3 mb-4 pr-10">
                                <div className={`p-2 rounded-xl transition-colors ${isCompleted ? 'bg-green-50 text-green-600' :
                                        isInProgress ? 'bg-blue-50 text-blue-600' :
                                            'bg-surface-secondary text-text-muted'
                                    }`}>
                                    <Icon name={stage.icon} className="w-6 h-6" />
                                </div>
                                <h3 className={`font-bold ${isInProgress ? 'text-blue-700' : 'text-text-primary'}`}>{stage.title}</h3>
                            </div>

                            {/* Uploaded File Display */}
                            {upload && (
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                                        File Uploaded
                                    </p>
                                    <div
                                        onClick={() => setPreviewFile({
                                            file: upload.fileObject,
                                            name: upload.fileName
                                        })}
                                        className="cursor-pointer bg-surface-secondary hover:bg-hover px-3 py-2 rounded-lg border border-border transition-colors group/file"
                                    >
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate group-hover/file:underline">
                                            {upload.fileName}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-auto pt-2">
                                <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' :
                                        isInProgress ? 'bg-blue-500' :
                                            'bg-gray-300'
                                    }`}></span>
                                <p className={`text-sm font-bold ${isCompleted ? 'text-green-600' :
                                        isInProgress ? 'text-blue-600' :
                                            'text-gray-400'
                                    }`}>
                                    {status}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
                title={selectedStageIndex !== null ? stages[selectedStageIndex].title : ''}
            />

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file || null}
                fileName={previewFile?.name || ''}
            />
        </div>
    );
};
