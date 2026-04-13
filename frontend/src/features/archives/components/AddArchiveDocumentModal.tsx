import { useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { getMaxFilesErrorMessage, MAX_MULTI_UPLOAD_FILES } from '../../../lib/uploads';
import type { ArchiveDocument, TransactionType } from '../../documents/types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { DocumentableType } from '../../tracking/types';

interface AddArchiveDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    blNo: string;
    type: TransactionType;
    existingDocs: ArchiveDocument[];
}

export const AddArchiveDocumentModal: React.FC<AddArchiveDocumentModalProps> = ({
    isOpen, onClose, blNo, type, existingDocs,
}) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedStage, setSelectedStage] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const firstDoc = existingDocs[0];
    const transactionId = firstDoc?.transaction_id;
    const documentableType = firstDoc?.documentable_type as DocumentableType;

    const allStages = type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
    const stageDocCount = existingDocs.reduce<Record<string, number>>((acc, document) => {
        acc[document.stage] = (acc[document.stage] ?? 0) + 1;
        return acc;
    }, {});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = Array.from(e.target.files ?? []);
        setFiles(nextFiles);
        setError(nextFiles.length > MAX_MULTI_UPLOAD_FILES ? getMaxFilesErrorMessage() : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (files.length === 0 || !selectedStage || !transactionId || !documentableType) {
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            await trackingApi.uploadDocuments({
                files,
                type: selectedStage,
                documentable_type: documentableType,
                documentable_id: transactionId,
            });

            queryClient.invalidateQueries({ queryKey: ['archives'] });
            queryClient.invalidateQueries({ queryKey: ['my-archives'] });

            setSelectedStage('');
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onClose();
        } catch (err: unknown) {
            const message = err && typeof err === 'object' && 'response' in err
                ? (err as { response: { data?: { message?: string } } }).response.data?.message || 'Upload failed.'
                : 'Something went wrong.';
            setError(message);
        } finally {
            setIsUploading(false);
        }
    };

    const canSubmit = files.length > 0 && files.length <= MAX_MULTI_UPLOAD_FILES && !!selectedStage && !isUploading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-[440px] overflow-hidden animate-modal-in">
                <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-[15px] font-black text-text-primary tracking-tight">
                            Add Document
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                            Uploading to{' '}
                            <span className="font-bold text-text-primary font-mono">{blNo}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-0.5 p-1.5 rounded-lg hover:bg-hover transition-colors shrink-0"
                    >
                        <Icon name="x" className="w-4 h-4 text-text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
                    <div className="space-y-2">
                        <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.12em]">
                            Stage <span className="text-red-400">*</span>
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            {allStages.map((stage) => {
                                const count = stageDocCount[stage.key] ?? 0;
                                const isSelected = selectedStage === stage.key;
                                const cardClass = isSelected
                                    ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30'
                                    : 'border-border-strong bg-input-bg hover:border-border hover:bg-hover';

                                return (
                                    <button
                                        key={stage.key}
                                        type="button"
                                        onClick={() => { setSelectedStage(stage.key); setError(null); }}
                                        className={`relative px-3 pt-2.5 pb-2 rounded-xl border text-left transition-all cursor-pointer ${cardClass}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                count > 0 ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-400/10 text-amber-500'
                                            }`}>
                                                {count > 0 ? `${count} file${count === 1 ? '' : 's'}` : 'Empty'}
                                            </span>
                                            {isSelected && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500 text-[9px] font-black text-white uppercase tracking-wider">
                                                    Selected
                                                </span>
                                            )}
                                        </div>

                                        <p className={`text-[12px] font-bold leading-snug ${isSelected ? 'text-text-primary' : 'text-text-primary'}`}>
                                            {stage.label}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-4 pt-0.5">
                            <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Empty stage
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Existing uploaded files
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.12em]">
                            Files <span className="text-red-400">*</span>
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-all text-left ${
                                files.length > 0
                                    ? 'border-green-500/40 bg-green-500/5'
                                    : 'border-border hover:border-border-strong bg-surface-subtle hover:bg-hover'
                            }`}
                        >
                            <Icon
                                name="file-text"
                                className={`w-5 h-5 shrink-0 ${files.length > 0 ? 'text-green-500' : 'text-text-muted'}`}
                            />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${files.length > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                                    {files.length > 0 ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Click to choose files'}
                                </p>
                                <p className="text-[10px] text-text-muted mt-0.5">
                                    PDF, DOCX, JPG, PNG, XLSX accepted, {MAX_MULTI_UPLOAD_FILES} files max
                                </p>
                            </div>
                            {files.length > 0 && (
                                <span
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFiles([]);
                                        setError(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="text-[10px] font-bold text-text-muted hover:text-red-400 transition-colors shrink-0 px-1 py-0.5 rounded"
                                >
                                    Clear
                                </span>
                            )}
                        </button>

                        {files.length > 0 && (
                            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                {files.map((file, index) => (
                                    <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-surface-subtle">
                                        <Icon name="file-text" className="w-4 h-4 text-green-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-text-primary truncate">{file.name}</p>
                                            <p className="text-[10px] text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const remainingFiles = files.filter((_, currentIndex) => currentIndex !== index);
                                                setFiles(remainingFiles);
                                                setError(remainingFiles.length > MAX_MULTI_UPLOAD_FILES ? getMaxFilesErrorMessage() : null);
                                                if (remainingFiles.length === 0 && fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                            className="text-text-muted hover:text-red-400 transition-colors shrink-0"
                                        >
                                            <Icon name="x" className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <Icon name="alert-circle" className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400 font-semibold">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-hover transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-100 disabled:cursor-not-allowed"
                            style={{ backgroundColor: canSubmit ? '#30d158' : '#9ca3af' }}
                        >
                            {isUploading ? 'Uploading…' : `Upload ${files.length > 1 ? 'Documents' : 'Document'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
