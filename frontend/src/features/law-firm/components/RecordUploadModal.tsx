import { useRef, useState } from 'react';

const ALLOWED_FILE_LABEL = 'PDF, Word, Excel (including XLSM), CSV, TXT, JPG, JPEG, and PNG';
const ALLOWED_FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.txt,.jpg,.jpeg,.png';
const MAX_FILE_SIZE_MB = 50;

type RecordUploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const RecordUploadModal = ({ isOpen, onClose }: RecordUploadModalProps) => {
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
    const [fileCount, setFileCount] = useState(0);

    if (!isOpen) return null;

    const handleFolderSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const root = files[0].webkitRelativePath?.split('/')[0] ?? 'Selected Folder';
        setSelectedFolderName(root);
        setFileCount(files.length);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        // Folders dropped via dataTransfer — try to get name from items
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
            const entry = items[0].webkitGetAsEntry?.();
            if (entry?.isDirectory) {
                setSelectedFolderName(entry.name);
                setFileCount(0); // count not available synchronously without FileSystemEntry traversal
            }
        }
    };

    const handleClose = () => {
        setSelectedFolderName(null);
        setFileCount(0);
        setIsDragging(false);
        onClose();
    };

    const handleConfirm = () => {
        // Wire to real API when backend contract is ready
        handleClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Upload Record"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">

                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                        </div>
                        <h2 className="text-base font-bold text-text-primary">Upload Record</h2>
                    </div>
                    <button
                        type="button"
                        id="record-upload-modal-close"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-hover transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {!selectedFolderName ? (
                        /* ── Dropzone ── */
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={[
                                'rounded-2xl border-2 border-dashed transition-all',
                                isDragging
                                    ? 'border-blue-400 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/25'
                                    : 'border-border-strong bg-surface hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/20',
                            ].join(' ')}
                        >
                            {/* Dropzone header */}
                            <div className="border-b border-border px-6 py-5">
                                <p className="text-xs font-black uppercase tracking-widest text-text-muted">
                                    Select Root Legacy Folder
                                </p>
                                <h3 className="mt-2 text-xl font-black tracking-tight text-text-primary">
                                    Start with the same top-level folder the client already recognizes
                                </h3>
                                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
                                    Drag the root folder from Windows Explorer or select it manually. The UI should
                                    inspect the hierarchy first, then upload the full batch with preserved relative paths.
                                </p>
                            </div>

                            {/* Drop zone inner */}
                            <div className="px-6 py-6">
                                <div className="rounded-2xl border border-border bg-surface-secondary/60 p-8 text-center">
                                    {/* Folder icon */}
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40">
                                        <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                        </svg>
                                    </div>

                                    <p className="text-base font-bold text-text-primary">
                                        {isDragging ? 'Drop the folder here' : 'Drag a root folder here'}
                                    </p>
                                    <p className="mt-2 text-xs font-medium text-text-muted">
                                        Allowed files: {ALLOWED_FILE_LABEL}. Maximum {MAX_FILE_SIZE_MB} MB per file.
                                    </p>

                                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            id="record-upload-select-folder"
                                            onClick={() => folderInputRef.current?.click()}
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                                        >
                                            Select Folder
                                        </button>
                                    </div>

                                    {/* Hidden folder input */}
                                    <input
                                        ref={folderInputRef}
                                        type="file"
                                        id="record-upload-folder-input"
                                        // @ts-expect-error – webkitdirectory is a valid attribute for folder picking
                                        webkitdirectory=""
                                        multiple
                                        accept={ALLOWED_FILE_ACCEPT}
                                        className="sr-only"
                                        onChange={(e) => handleFolderSelect(e.target.files)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── Selected state ── */
                        <div className="rounded-2xl border border-border bg-surface">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-text-muted">
                                        Selected Root Folder
                                    </p>
                                    <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">
                                        {selectedFolderName}
                                    </h3>
                                    <p className="mt-1 text-sm text-text-muted">
                                        {fileCount > 0 ? `${fileCount.toLocaleString()} files detected.` : 'Folder selected.'}{' '}
                                        The batch will be uploaded with preserved relative paths.
                                    </p>
                                </div>
                                <span className="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-900/80 dark:bg-blue-950/30 dark:text-blue-200">
                                    Ready for upload
                                </span>
                            </div>

                            {/* Folder icon confirmation */}
                            <div className="flex items-center gap-4 px-5 py-5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40 shrink-0">
                                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{selectedFolderName}/</p>
                                    {fileCount > 0 && (
                                        <p className="text-xs text-text-muted mt-0.5">{fileCount.toLocaleString()} files</p>
                                    )}
                                </div>
                            </div>

                            {/* Re-select option */}
                            <div className="flex items-center gap-2 border-t border-border px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() => folderInputRef.current?.click()}
                                    className="rounded-xl border border-border-strong bg-surface px-4 py-2 text-xs font-bold text-text-secondary transition-all hover:bg-hover"
                                >
                                    Replace Folder
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedFolderName(null); setFileCount(0); }}
                                    className="ml-auto rounded-xl border px-4 py-2 text-xs font-bold transition-all border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100 dark:border-red-900/80 dark:bg-red-950/25 dark:text-red-200 dark:hover:bg-red-950/40"
                                >
                                    Clear Selection
                                </button>
                            </div>

                            {/* Hidden folder input (re-select) */}
                            <input
                                ref={folderInputRef}
                                type="file"
                                id="record-upload-folder-input-reselect"
                                // @ts-expect-error – webkitdirectory is a valid attribute for folder picking
                                webkitdirectory=""
                                multiple
                                accept={ALLOWED_FILE_ACCEPT}
                                className="sr-only"
                                onChange={(e) => handleFolderSelect(e.target.files)}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface-secondary/20">
                    <p className="text-xs text-text-muted">
                        {selectedFolderName
                            ? `Folder selected: ${selectedFolderName}`
                            : 'No folder selected'}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            id="record-upload-cancel"
                            onClick={handleClose}
                            className="px-4 h-9 rounded-lg text-sm font-semibold text-text-secondary bg-surface-secondary hover:bg-hover border border-border transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            id="record-upload-confirm"
                            onClick={handleConfirm}
                            disabled={!selectedFolderName}
                            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            Upload Folder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
