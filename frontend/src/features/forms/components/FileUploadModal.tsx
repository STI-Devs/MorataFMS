import { useRef, useState } from 'react';

type FileUploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
};

type UploadedFile = {
    file: File;
    id: string;
};

export const FileUploadModal = ({ isOpen, onClose, title = 'Upload File' }: FileUploadModalProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragging, setDragging] = useState(false);

    if (!isOpen) {
        return null;
    }

    const addFiles = (incoming: FileList | null) => {
        if (!incoming) {
            return;
        }

        const newEntries: UploadedFile[] = Array.from(incoming).map((file) => ({
            file,
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        }));

        setFiles((prev) => [...prev, ...newEntries]);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((file) => file.id !== id));
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        addFiles(event.dataTransfer.files);
    };

    const handleClose = () => {
        setFiles([]);
        setDragging(false);
        onClose();
    };

    const handleConfirm = () => {
        handleClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h2 className="text-base font-bold text-text-primary">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        id="upload-modal-close"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-hover transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={[
                            'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none py-10',
                            dragging
                                ? 'border-blue-500 bg-blue-500/5'
                                : 'border-border hover:border-blue-400/60 hover:bg-blue-500/3',
                        ].join(' ')}
                    >
                        <div className={[
                            'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                            dragging ? 'bg-blue-500/15' : 'bg-surface-secondary',
                        ].join(' ')}>
                            <svg className={['w-6 h-6 transition-colors', dragging ? 'text-blue-500' : 'text-text-muted'].join(' ')}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-text-primary">
                                {dragging ? 'Drop files here' : 'Drag & drop files here'}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                                or <span className="text-blue-500 font-semibold">click to browse</span>
                            </p>
                        </div>
                        <p className="text-xs text-text-muted">PDF, DOCX, JPG, PNG — up to 50 MB each</p>
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="sr-only"
                            id="upload-modal-file-input"
                            onChange={(event) => addFiles(event.target.files)}
                        />
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {files.map(({ file, id }) => (
                                <div
                                    key={id}
                                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-border bg-surface-secondary/40"
                                >
                                    <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-text-primary truncate">{file.name}</p>
                                        <p className="text-xs text-text-muted">{formatSize(file.size)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(id)}
                                        className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface-secondary/20">
                    <p className="text-xs text-text-muted">
                        {files.length === 0 ? 'No files selected' : `${files.length} file${files.length > 1 ? 's' : ''} selected`}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            id="upload-modal-cancel"
                            className="px-4 h-9 rounded-lg text-sm font-semibold text-text-secondary bg-surface-secondary hover:bg-hover border border-border transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            id="upload-modal-confirm"
                            disabled={files.length === 0}
                            className="flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
