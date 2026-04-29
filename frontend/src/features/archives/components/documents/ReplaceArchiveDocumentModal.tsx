import { useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import {
    getMaxFileSizeErrorMessage,
    MAX_UPLOAD_FILE_SIZE_BYTES,
    MAX_UPLOAD_FILE_SIZE_MB,
} from '../../../../lib/uploads';
import type { ArchiveDocument } from '../../../documents/types/document.types';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { archiveKeys } from '../../utils/archiveQueryKeys';

const formatStageName = (stage: string) => stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

interface ReplaceArchiveDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: ArchiveDocument | null;
}

export const ReplaceArchiveDocumentModal: React.FC<ReplaceArchiveDocumentModalProps> = ({
    isOpen, onClose, document,
}) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !document) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextFile = e.target.files?.[0] || null;
        setFile(nextFile);
        if (nextFile && nextFile.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
            setError(getMaxFileSizeErrorMessage());
        } else {
            setError(null);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !document) {
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            await trackingApi.replaceDocument(document.id, file);

            queryClient.invalidateQueries({ queryKey: archiveKeys.all });
            queryClient.invalidateQueries({ queryKey: archiveKeys.mineAll });

            handleClose();
        } catch (err: unknown) {
            const message = err && typeof err === 'object' && 'response' in err
                ? (err as { response: { data?: { message?: string } } }).response.data?.message || 'Replace failed.'
                : 'Something went wrong.';
            setError(message);
        } finally {
            setIsUploading(false);
        }
    };

    const canSubmit = !!file && !isUploading && !error;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-modal-in">
                <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-[15px] font-black text-text-primary tracking-tight">
                            Replace File
                        </h3>
                        <p className="text-[13px] text-text-muted mt-0.5">
                            Upload a new file to replace the existing one
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-text-disabled hover:text-text-primary transition-colors p-1"
                    >
                        <Icon name="x" className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 pb-5">
                    <div className="mb-4 p-3 bg-surface-hover rounded-lg border border-border">
                        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                            Current Document
                        </p>
                        <p className="text-[13px] text-text-primary font-medium truncate" title={document.filename}>
                            {document.filename}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                            Stage: <span className="font-medium text-text-secondary">{formatStageName(document.stage)}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[13px] font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="replace_file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            />
                            <label
                                htmlFor="replace_file"
                                className="flex items-center justify-center w-full min-h-[80px] px-4 border-2 border-dashed border-border rounded-lg bg-surface-hover cursor-pointer hover:border-text-muted hover:bg-surface-active transition-all group focus-within:ring-2 focus-within:ring-brand-blue/50 focus-within:border-brand-blue"
                            >
                                {file ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center min-w-0 pr-3">
                                            <div className="w-8 h-8 rounded shrink-0 bg-brand-blue/10 flex items-center justify-center mr-3">
                                                <svg className="w-[18px] h-[18px] text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-text-primary truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-[11px] text-text-muted mt-0.5 font-medium">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                setFile(null);
                                            }}
                                            className="p-1.5 hover:bg-surface rounded-md text-text-muted hover:text-text-primary transition-colors border border-transparent hover:border-border shadow-sm flex-shrink-0"
                                            title="Remove selected file"
                                        >
                                            <Icon name="trash" className="w-[14px] h-[14px]" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-text-muted p-2 h-full gap-1.5 focus:outline-none">
                                        <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center group-hover:bg-border group-hover:text-text-primary transition-colors">
                                            <svg className="w-[18px] h-[18px] -mt-0.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <span className="text-[13px] font-medium">Choose new file</span>
                                        <span className="text-[11px] text-text-disabled">Up to {MAX_UPLOAD_FILE_SIZE_MB}MB</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isUploading}
                                className="px-3.5 py-2 text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-bold text-white bg-text-primary hover:bg-black rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Replacing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Replace File
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
