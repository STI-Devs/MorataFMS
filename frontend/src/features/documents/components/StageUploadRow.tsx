import React, { useRef } from 'react';
import { Icon } from '../../../components/Icon';
import { MAX_MULTI_UPLOAD_FILES } from '../../../lib/uploads';
import type { StageUpload } from '../types/document.types';

interface StageUploadRowProps {
    stageKey: string;
    label: string;
    upload: StageUpload;
    allowNotApplicable?: boolean;
    supportingText?: string;
    onChange: (next: StageUpload) => void;
}

const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const StageUploadRow: React.FC<StageUploadRowProps> = ({
    stageKey,
    label,
    upload,
    allowNotApplicable = false,
    supportingText,
    onChange,
}) => {
    const inputId = `stage-file-${stageKey}`;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasFiles = upload.files.length > 0;
    const isNotApplicable = upload.notApplicable === true;
    const stageError = upload.files.length > MAX_MULTI_UPLOAD_FILES
        ? `You can upload up to ${MAX_MULTI_UPLOAD_FILES} files for the ${label} stage.`
        : null;

    const handleFiles = (files: FileList | null) => {
        const nextFiles = Array.from(files ?? []);
        if (nextFiles.length > 0) {
            onChange({ files: [...upload.files, ...nextFiles], notApplicable: false });
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const clearSelection = () => {
        onChange({ files: [], notApplicable: false });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`rounded-xl border-2 transition-all ${hasFiles
            ? 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/5'
            : 'border-border-strong bg-input-bg'
        }`}>
            {/* Stage label */}
            <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
                <div
                    className={`w-2 h-2 rounded-full shrink-0 ${hasFiles ? '' : 'bg-border-strong'}`}
                    style={hasFiles ? { backgroundColor: '#ff9f0a' } : {}}
                />
                <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-text-primary">{label}</span>
                    {supportingText && (
                        <p className="mt-1 text-[11px] font-medium text-text-secondary">
                            {supportingText}
                        </p>
                    )}
                </div>
                {hasFiles && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                        {upload.files.length} file{upload.files.length === 1 ? '' : 's'}
                    </span>
                )}
                {isNotApplicable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                        N/A
                    </span>
                )}
                {hasFiles && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="text-text-muted hover:text-red-400 transition-colors"
                        title="Remove all files"
                    >
                        <Icon name="x" className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="px-4 pb-4 space-y-3">
                <input
                    ref={fileInputRef}
                    id={inputId}
                    type="file"
                    multiple
                    className="hidden"
                    disabled={isNotApplicable}
                    onChange={(e) => handleFiles(e.target.files)}
                />

                {allowNotApplicable && (
                    <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
                        <input
                            type="checkbox"
                            checked={isNotApplicable}
                            disabled={hasFiles}
                            onChange={(event) => {
                                const nextNotApplicable = event.target.checked;

                                onChange({
                                    files: nextNotApplicable ? [] : upload.files,
                                    notApplicable: nextNotApplicable,
                                });

                                if (nextNotApplicable && fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="h-3.5 w-3.5 rounded border-border-strong text-amber-500 focus:ring-amber-500/30"
                        />
                        Mark this stage as N/A
                        {hasFiles && <span className="text-[10px] text-text-muted">Remove files first</span>}
                    </label>
                )}

                <label
                    htmlFor={inputId}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed transition-all ${
                        isNotApplicable
                            ? 'cursor-not-allowed border-amber-400/40 bg-amber-50/40 dark:bg-amber-900/10 opacity-80'
                            :
                        hasFiles
                            ? 'border-amber-400/40 bg-amber-50/40 dark:bg-amber-900/10 hover:border-amber-400/70'
                            : 'border-border hover:border-amber-400/50 hover:bg-hover'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                        hasFiles ? 'bg-amber-500/15' : 'bg-surface-secondary'
                    }`}>
                        <svg className={`w-4 h-4 ${hasFiles ? 'text-amber-500' : 'text-text-muted opacity-60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary font-semibold">
                            {isNotApplicable
                                ? 'Stage marked as not applicable'
                                : hasFiles
                                    ? 'Add more files'
                                    : 'Click to attach files'}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                            {isNotApplicable
                                ? 'Uncheck N/A if you need to upload documents for this stage.'
                                : `Select one or more files for this stage. Up to ${MAX_MULTI_UPLOAD_FILES} files for this stage.`}
                        </p>
                    </div>
                </label>

                {hasFiles && (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {upload.files.map((file, index) => (
                            <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-amber-400/40 bg-amber-50/40 dark:bg-amber-900/10">
                                <div
                                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: 'rgba(255,159,10,0.15)' }}
                                >
                                    <Icon name="file-text" className="w-4 h-4" stroke="#ff9f0a" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-text-primary truncate">{file.name}</p>
                                    <p className="text-[10px] text-text-muted">{formatSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const remainingFiles = upload.files.filter((_, currentIndex) => currentIndex !== index);
                                        onChange({ files: remainingFiles, notApplicable: false });
                                        if (remainingFiles.length === 0 && fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="text-text-muted hover:text-red-400 transition-colors shrink-0"
                                    title="Remove file"
                                >
                                    <Icon name="x" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {stageError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">{stageError}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
