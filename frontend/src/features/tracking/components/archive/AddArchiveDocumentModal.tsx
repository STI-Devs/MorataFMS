import { useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { trackingApi } from '../../api/trackingApi';
import type { DocumentableType } from '../../types';
import type { ArchiveDocument, TransactionType } from '../../types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../types/document.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddArchiveDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    blNo: string;
    type: TransactionType;
    existingDocs: ArchiveDocument[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AddArchiveDocumentModal: React.FC<AddArchiveDocumentModalProps> = ({
    isOpen, onClose, blNo, type, existingDocs,
}) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedStage, setSelectedStage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const firstDoc = existingDocs[0];
    const transactionId = firstDoc?.transaction_id;
    const documentableType = firstDoc?.documentable_type as DocumentableType;

    const allStages = type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
    const uploadedStageKeys = new Set(existingDocs.map(d => d.stage));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] ?? null);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedStage || !transactionId || !documentableType) return;
        setIsUploading(true);
        setError(null);
        try {
            await trackingApi.uploadDocument({
                file,
                type: selectedStage,
                documentable_type: documentableType,
                documentable_id: transactionId,
            });
            queryClient.invalidateQueries({ queryKey: ['archives'] });
            // Reset and close
            setSelectedStage('');
            setFile(null);
            onClose();
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response: { data?: { message?: string } } }).response.data?.message || 'Upload failed.'
                : 'Something went wrong.';
            setError(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const canSubmit = !!file && !!selectedStage && !isUploading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal card */}
            <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">

                {/* ── Header ── */}
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

                {/* ── Body ── */}
                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">

                    {/* Stage selector */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.12em]">
                            Stage <span className="text-red-400">*</span>
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            {allStages.map(stage => {
                                const isFilled   = uploadedStageKeys.has(stage.key);
                                const isSelected = selectedStage === stage.key;

                                // Three visual states:
                                // 1. Selected  → green border + green bg tint + bold text
                                // 2. Filled    → fully dimmed, shows check, not a target
                                // 3. Available → neutral card, invites click
                                let cardClass = 'relative px-3 pt-2.5 pb-2 rounded-xl border text-left transition-all ';

                                if (isSelected) {
                                    cardClass += 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30 cursor-pointer';
                                } else if (isFilled) {
                                    cardClass += 'border-border bg-surface-subtle opacity-60 cursor-pointer';
                                } else {
                                    cardClass += 'border-border-strong bg-input-bg hover:border-border hover:bg-hover cursor-pointer';
                                }

                                return (
                                    <button
                                        key={stage.key}
                                        type="button"
                                        onClick={() => { setSelectedStage(stage.key); setError(null); }}
                                        className={cardClass}
                                    >
                                        {/* Status badge */}
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            {isFilled ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/15 text-[9px] font-black text-green-500 uppercase tracking-wider">
                                                    <svg className="w-2 h-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Done
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/10 text-[9px] font-black text-amber-500 uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                                    Empty
                                                </span>
                                            )}
                                            {isSelected && !isFilled && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500 text-[9px] font-black text-white uppercase tracking-wider">
                                                    Selected
                                                </span>
                                            )}
                                        </div>

                                        {/* Stage name */}
                                        <p className={`text-[12px] font-bold leading-snug ${isSelected ? 'text-text-primary' : isFilled ? 'text-text-muted' : 'text-text-primary'}`}>
                                            {stage.label}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 pt-0.5">
                            <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Empty — available to upload
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Already has a document
                            </span>
                        </div>
                    </div>

                    {/* File picker */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.12em]">
                            File <span className="text-red-400">*</span>
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-all text-left
                                ${file
                                    ? 'border-green-500/40 bg-green-500/5'
                                    : 'border-border hover:border-border-strong bg-surface-subtle hover:bg-hover'
                                }`}
                        >
                            <Icon
                                name="file-text"
                                className={`w-5 h-5 shrink-0 ${file ? 'text-green-500' : 'text-text-muted'}`}
                            />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${file ? 'text-text-primary' : 'text-text-muted'}`}>
                                    {file ? file.name : 'Click to choose a file'}
                                </p>
                                {file && (
                                    <p className="text-[10px] text-text-muted mt-0.5">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                )}
                                {!file && (
                                    <p className="text-[10px] text-text-muted mt-0.5">
                                        PDF, DOCX, JPG, PNG, XLSX accepted
                                    </p>
                                )}
                            </div>
                            {file && (
                                <span
                                    role="button"
                                    onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                    className="text-[10px] font-bold text-text-muted hover:text-red-400 transition-colors shrink-0 px-1 py-0.5 rounded"
                                >
                                    Remove
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <Icon name="alert-circle" className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400 font-semibold">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
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
                            {isUploading ? 'Uploading…' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
