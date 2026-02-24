import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => void;
    title: string;
    isLoading?: boolean;
    errorMessage?: string;
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, title, isLoading = false, errorMessage }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        if (selectedFile && !isLoading) {
            onUpload(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleClose = () => {
        if (!isLoading) {
            setSelectedFile(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Icon name="file-text" className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">Upload Document</h3>
                            <p className="text-xs text-text-muted">For: {title}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-hover transition-all disabled:opacity-50"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            isDragging
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-border-strong bg-surface-secondary hover:bg-hover hover:border-blue-400'
                        }`}
                        onClick={() => document.getElementById('stage-file-upload')?.click()}
                    >
                        <input
                            type="file"
                            id="stage-file-upload"
                            className="hidden"
                            accept={ACCEPTED_TYPES}
                            onChange={handleFileChange}
                        />
                        <svg className="w-10 h-10 text-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium text-text-secondary">
                            {isDragging ? 'Drop file here' : 'Click or drag & drop a file'}
                        </span>
                        <span className="text-xs text-text-muted mt-1">PDF, DOCX, XLS, JPG, PNG up to 10 MB</span>
                    </div>

                    {/* Selected File Display */}
                    {selectedFile && (
                        <div className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded-xl">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                <Icon name="file-text" className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary truncate">{selectedFile.name}</p>
                                <p className="text-xs text-text-muted">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                disabled={isLoading}
                                className="p-1 text-text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <Icon name="alert-circle" className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        onClick={handleUploadClick}
                        disabled={!selectedFile || isLoading}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            !selectedFile || isLoading
                                ? 'bg-surface-secondary text-text-muted cursor-not-allowed border border-border'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg active:scale-[0.98]'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading to S3...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload Document
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

