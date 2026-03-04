import { useState } from 'react';
import { Icon } from '../../../components/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when user confirms the file selection. Caller handles the mutation. */
    onUpload: (file: File) => void;
    /** Title displayed in the modal header (e.g. transaction ref). */
    title: string;
    isLoading?: boolean;
    errorMessage?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UploadModal: React.FC<UploadModalProps> = ({
    isOpen, onClose, onUpload, title, isLoading = false, errorMessage,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging,   setIsDragging]   = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
    };

    const handleUploadClick = () => {
        if (selectedFile) {
            onUpload(selectedFile);
            setSelectedFile(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">

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
                        onClick={onClose}
                        className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-hover transition-all"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* Error banner */}
                    {errorMessage && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                            {errorMessage}
                        </div>
                    )}

                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('doc-file-upload')?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            isDragging
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-border-strong bg-surface-secondary hover:bg-hover hover:border-blue-400'
                        }`}
                    >
                        <input
                            type="file"
                            id="doc-file-upload"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <svg className="w-10 h-10 text-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium text-text-secondary">
                            {isDragging ? 'Drop file here' : 'Click or drag & drop a file'}
                        </span>
                        <span className="text-xs text-text-muted mt-1">PDF, DOCX, JPG, PNG up to 10 MB</span>
                    </div>

                    {/* Selected file preview */}
                    {selectedFile && (
                        <div className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded-xl">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                <Icon name="file-text" className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary truncate">{selectedFile.name}</p>
                                <p className="text-xs text-text-muted">{formatBytes(selectedFile.size)}</p>
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                                className="p-1 text-text-muted hover:text-red-500 transition-colors"
                            >
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Upload button */}
                    <button
                        onClick={handleUploadClick}
                        disabled={!selectedFile || isLoading}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            !selectedFile || isLoading
                                ? 'bg-surface-secondary text-text-muted cursor-not-allowed border border-border'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-lg active:scale-[0.98]'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                                Uploading…
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
