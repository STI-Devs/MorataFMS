import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { trackingApi } from '../../tracking/api/trackingApi';
import { useAddDocumentToCache, useTransactionDocuments } from '../../tracking/hooks/useTransactionDocuments';
import { useDocumentPreview } from '../../tracking/hooks/useDocumentPreview';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import { StageRow } from '../../tracking/components/StageRow';
import type { ApiDocument, ApiExportStages, ApiImportStages, DocumentableType } from '../../tracking/types';
import {
    getExportProcessorActionability,
    getImportProcessorActionability,
    getOperationalStageStatus,
    type StageDefinition,
} from '../../tracking/utils/stageUtils';

interface ProcessorUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: number;
    reference: string;
    type: 'import' | 'export';
    clientName: string;
    transactionStages?: ApiImportStages | ApiExportStages;
    transactionNotApplicableStages?: string[];
}

type ProcessorStageStatuses = Partial<ApiImportStages & ApiExportStages>;

const IMPORT_PROCESSOR_STAGES: StageDefinition[] = [
    { type: 'ppa', title: 'PPA', description: 'Philippine Ports Authority clearance.', icon: 'file-text', supportsNotApplicable: true },
    { type: 'port_charges', title: 'Port Charges', description: 'Port charges and related fee documents.', icon: 'file-text', supportsNotApplicable: true },
];

const EXPORT_PROCESSOR_STAGES: StageDefinition[] = [
    { type: 'cil', title: 'CIL', description: 'Certificate of Inspection and Loading for export release.', icon: 'file-text', supportsNotApplicable: false },
    { type: 'dccci', title: 'DCCCI', description: 'DCCCI printing and export compliance documents.', icon: 'file-text', supportsNotApplicable: false },
];

export const ProcessorUploadModal = ({
    isOpen,
    onClose,
    transactionId,
    reference,
    type,
    clientName,
    transactionStages,
    transactionNotApplicableStages,
}: ProcessorUploadModalProps) => {
    const queryClient = useQueryClient();
    const addDocToCache = useAddDocumentToCache();
    
    const isImport = type === 'import';
    const stages = isImport ? IMPORT_PROCESSOR_STAGES : EXPORT_PROCESSOR_STAGES;
    const docableType: DocumentableType = isImport ? 'App\\Models\\ImportTransaction' : 'App\\Models\\ExportTransaction';

    const { byStageIndex: stageDocuments, isLoading: docsLoading } = useTransactionDocuments(
        isOpen ? { documentable_type: docableType, documentable_id: transactionId } : null,
        stages
    );

    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
    const [uploadingStage, setUploadingStage] = useState<number | null>(null);
    const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
    const [replacingDoc, setReplacingDoc] = useState<ApiDocument | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [localStageStatuses, setLocalStageStatuses] = useState<ProcessorStageStatuses>(() => (transactionStages ?? {}) as ProcessorStageStatuses);
    const [localNotApplicableStages, setLocalNotApplicableStages] = useState<string[]>(transactionNotApplicableStages ?? []);
    const [applicabilityStage, setApplicabilityStage] = useState<string | null>(null);

    useEffect(() => {
        setLocalStageStatuses((transactionStages ?? {}) as ProcessorStageStatuses);
        setLocalNotApplicableStages(transactionNotApplicableStages ?? []);
    }, [transactionStages, transactionNotApplicableStages, isOpen]);

    const importActionability = getImportProcessorActionability(localStageStatuses);
    const exportActionability = getExportProcessorActionability(localStageStatuses);

    const isStageActionable = (stageType: string): boolean => {
        if (isImport) {
            if (stageType === 'ppa' || stageType === 'port_charges') {
                return !!importActionability[stageType];
            }

            return false;
        }

        if (stageType === 'cil') {
            return !!exportActionability.cil;
        }

        if (stageType === 'dccci') {
            return !!exportActionability.dccci;
        }

        return false;
    };

    const handleStageUploadClick = (index: number) => {
        setSelectedStageIndex(index);
        setReplacingDoc(null);
        setUploadError(null);
        setIsUploadOpen(true);
    };

    const handleReplaceDoc = (index: number, oldDoc: ApiDocument) => {
        setSelectedStageIndex(index);
        setReplacingDoc(oldDoc);
        setUploadError(null);
        setIsUploadOpen(true);
    };

    const handleDeleteDoc = async (doc: ApiDocument) => {
        setDeletingDocId(doc.id);
        try {
            await trackingApi.deleteDocument(doc.id);
            const stageIndex = stages.findIndex((stage) => stage.type === doc.type);
            const remainingStageDocs = stageIndex >= 0
                ? (stageDocuments[stageIndex] ?? []).filter((stageDoc) => stageDoc.id !== doc.id)
                : [];

            if (stageIndex >= 0 && remainingStageDocs.length === 0) {
                setLocalStageStatuses((previous) => ({
                    ...previous,
                    [doc.type]: 'pending',
                }));
            }

            queryClient.setQueryData<ApiDocument[]>(
                trackingKeys.documents.list(docableType, transactionId),
                (prev = []) => prev.filter(d => d.id !== doc.id),
            );
            queryClient.invalidateQueries({ queryKey: isImport ? trackingKeys.imports.list() : trackingKeys.exports.list() });
        } finally {
            setDeletingDocId(null);
        }
    };

    const handleStageApplicabilityChange = async (stageType: string, notApplicable: boolean) => {
        setApplicabilityStage(stageType);

        try {
            if (isImport) {
                await trackingApi.updateImportStageApplicability(transactionId, {
                    stage: stageType,
                    not_applicable: notApplicable,
                });
            } else {
                await trackingApi.updateExportStageApplicability(transactionId, {
                    stage: stageType,
                    not_applicable: notApplicable,
                });
            }

            setLocalNotApplicableStages((previous) => (
                notApplicable
                    ? [...new Set([...previous, stageType])]
                    : previous.filter((stage) => stage !== stageType)
            ));
            setLocalStageStatuses((previous) => ({
                ...previous,
                [stageType]: notApplicable ? 'completed' : 'pending',
            }));
            queryClient.invalidateQueries({ queryKey: isImport ? trackingKeys.imports.list() : trackingKeys.exports.list() });
            toast.success(
                notApplicable
                    ? `${stages.find((stage) => stage.type === stageType)?.title ?? 'Stage'} marked as not applicable.`
                    : `${stages.find((stage) => stage.type === stageType)?.title ?? 'Stage'} restored to required.`,
            );
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            toast.error(apiErr?.response?.data?.message ?? 'Failed to update the stage setting.');
        } finally {
            setApplicabilityStage(null);
        }
    };

    const handleUpload = async (files: File[]) => {
        if (selectedStageIndex === null) return;

        setUploadingStage(selectedStageIndex);
        setUploadError(null);

        try {
            const uploadedDocuments = await trackingApi.uploadDocuments({
                files,
                type: stages[selectedStageIndex].type,
                documentable_type: docableType,
                documentable_id: transactionId,
            });

            if (uploadedDocuments.length === 0) return;

            if (replacingDoc) {
                await trackingApi.deleteDocument(replacingDoc.id);
                queryClient.setQueryData<ApiDocument[]>(
                    trackingKeys.documents.list(docableType, transactionId),
                    (prev = []) => [
                        ...uploadedDocuments,
                        ...prev.filter(d => d.id !== replacingDoc.id),
                    ]
                );
            } else {
                uploadedDocuments.forEach(doc => addDocToCache(docableType, transactionId, doc));
            }

            setLocalStageStatuses((previous) => ({
                ...previous,
                [stages[selectedStageIndex].type]: 'completed',
            }));
            queryClient.invalidateQueries({ queryKey: isImport ? trackingKeys.imports.list() : trackingKeys.exports.list() });
            setIsUploadOpen(false);
            setReplacingDoc(null);
            toast.success('Documents uploaded successfully.');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setUploadError(apiErr?.response?.data?.message ?? 'Upload failed. Please try again.');
        } finally {
            setUploadingStage(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl animate-slide-in-right">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Processor Tasks</h2>
                        <p className="text-xs text-text-secondary">{reference} • {clientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                    >
                        <Icon name="x" className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 border-b border-border">
                    {docsLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500" />
                        </div>
                    ) : (
                        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-secondary/50">
                                <h3 className="text-sm font-bold text-text-primary">Required Uploads</h3>
                            </div>
                            <div className="divide-y divide-border/60">
                                {stages.map((stage, i) => {
                                    const docs = stageDocuments[i] ?? [];
                                    const isActionable = isStageActionable(stage.type);
                                    const isNotApplicable = localNotApplicableStages.includes(stage.type);
                                    const stageStatus = isNotApplicable
                                        ? 'completed'
                                        : getOperationalStageStatus(docs.length > 0, isActionable);
                                    
                                    return (
                                        <StageRow
                                            key={stage.type}
                                            stage={stage}
                                            index={i}
                                            isLast={i === stages.length - 1}
                                            stageStatus={stageStatus}
                                            docs={docs}
                                            isNotApplicable={isNotApplicable}
                                            isUploading={uploadingStage === i}
                                            isApplicabilityUpdating={applicabilityStage === stage.type}
                                            deletingDocId={deletingDocId}
                                            uploadDisabledReason={!docs.length && !isActionable && !isNotApplicable ? 'Waiting for earlier stages to be completed first.' : null}
                                            onUploadClick={handleStageUploadClick}
                                            onPreviewDoc={handlePreviewDoc}
                                            onDeleteDoc={handleDeleteDoc}
                                            onReplaceDoc={handleReplaceDoc}
                                            onNotApplicableChange={handleStageApplicabilityChange}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => { setIsUploadOpen(false); setUploadError(null); }}
                onUpload={handleUpload}
                title={selectedStageIndex !== null ? stages[selectedStageIndex].title : ''}
                isLoading={uploadingStage !== null}
                errorMessage={uploadError ?? undefined}
            />

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
                onDownload={previewFile ? () => {
                    const allDocs = Object.values(stageDocuments).flat();
                    const doc = allDocs.find(d => d.filename === previewFile.name);
                    if (doc) trackingApi.downloadDocument(doc.id, doc.filename);
                } : undefined}
            />
        </div>
    );
};
