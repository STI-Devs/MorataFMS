import React from 'react';
import { LEGACY_ALLOWED_FILE_LABEL } from '../../../utils/legacyUpload.utils';
import { SectionTitle } from './legacyUploadPrimitives';

interface Props {
    isDragging: boolean;
    onDragOver: (event: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (event: React.DragEvent) => void;
    onSelectFolder: () => void;
    isResumeMode: boolean;
}

export const FolderDropzone = ({
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onSelectFolder,
    isResumeMode,
}: Props) => (
    <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed transition-all ${
            isDragging
                ? 'border-blue-400 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/25'
                : 'border-border-strong bg-surface hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/20'
        }`}
    >
        <div className="border-b border-border px-6 py-5">
            <SectionTitle>{isResumeMode ? 'Resume Legacy Batch' : 'Select Root Legacy Folder'}</SectionTitle>
            <h3 className="mt-2 text-xl font-black tracking-tight text-text-primary">
                {isResumeMode
                    ? 'Select the same root folder again so the interrupted batch can continue'
                    : 'Start with the same top-level folder the client already recognizes'}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
                Drag the root folder from Windows Explorer or select it manually. The UI should inspect the hierarchy first,
                then upload the full batch with preserved relative paths.
            </p>
        </div>

        <div className="px-6 py-6">
            <div className="rounded-2xl border border-border bg-surface-secondary/60 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40">
                    <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                </div>
                <p className="text-base font-bold text-text-primary">Drag a root folder here</p>
                <p className="mt-2 text-xs font-medium text-text-muted">
                    Allowed files: {LEGACY_ALLOWED_FILE_LABEL}. Maximum 50 MB per file.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={onSelectFolder}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                    >
                        Select Folder
                    </button>
                </div>
            </div>
        </div>
    </div>
);
