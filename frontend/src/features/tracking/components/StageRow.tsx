import type { ApiDocument } from '../types';
import type { StageDefinition } from '../utils/stageUtils';


interface StageRowProps {
    stage:           StageDefinition;
    index:           number;
    isLast:          boolean;
    stageStatus:     'completed' | 'active' | 'pending';
    doc:             ApiDocument | undefined;
    isUploading:     boolean;
    isDeleting:      boolean;
    activeIndex:     number;
    allowEdit?:      boolean;
    onUploadClick:   (index: number) => void;
    onPreviewDoc:    (doc: ApiDocument) => void;
    onDeleteDoc:     (doc: ApiDocument) => void;
    onReplaceDoc:    (index: number, oldDoc: ApiDocument) => void;
}

export const StageRow = ({
    stage,
    index,
    isLast,
    stageStatus,
    doc,
    isUploading,
    isDeleting,
    activeIndex,
    allowEdit = true,
    onUploadClick,
    onPreviewDoc,
    onDeleteDoc,
    onReplaceDoc,
}: StageRowProps) => {
    const isCompleted = stageStatus === 'completed';
    const isActive    = stageStatus === 'active';

    return (
        <div
            className={`relative flex gap-4 px-5 py-4 transition-colors ${
                isActive ? 'bg-blue-500/5 dark:bg-blue-500/8' : ''
            }`}
        >
            {/* Step indicator */}
            <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isActive
                            ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                            : 'bg-surface-secondary border-border text-text-muted'
                }`}>
                    {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                    )}
                </div>
                {!isLast && (
                    <div className={`w-0.5 flex-1 mt-1 min-h-[24px] rounded-full transition-colors ${
                        isCompleted ? 'bg-emerald-400/60' : 'bg-border'
                    }`} />
                )}
            </div>

            {/* Stage content */}
            <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className={`text-sm font-bold ${
                                isCompleted ? 'text-text-primary' : isActive ? 'text-blue-600 dark:text-blue-400' : 'text-text-secondary'
                            }`}>
                                {stage.title}
                            </h3>
                            {isActive && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                    In Progress
                                </span>
                            )}
                            {isCompleted && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                    Done
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{stage.description}</p>
                    </div>

                    {/* Upload button — shown only when no doc yet */}
                    {!doc && allowEdit && (
                        <button
                            onClick={e => { e.stopPropagation(); onUploadClick(index); }}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shrink-0 self-center shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Upload document for this stage"
                        >
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            )}
                            {isUploading ? 'Uploading…' : 'Upload'}
                        </button>
                    )}
                </div>

                {/* Uploaded document pill — preview + replace + delete */}
                {doc && (
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {/* Filename chip → opens preview */}
                        <button
                            type="button"
                            onClick={() => onPreviewDoc(doc)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-secondary hover:bg-hover border border-border rounded-lg cursor-pointer transition-colors group/file min-w-0"
                        >
                            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover/file:underline truncate max-w-[200px]">
                                {doc.filename}
                            </span>
                            <span className="text-[10px] text-text-muted shrink-0">{doc.formatted_size}</span>
                        </button>

                        {/* Replace */}
                        {allowEdit && (
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onReplaceDoc(index, doc); }}
                                disabled={isUploading || isDeleting}
                                title="Replace document"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-hover border border-border transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Replace
                            </button>
                        )}

                        {/* Delete */}
                        {allowEdit && (
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onDeleteDoc(doc); }}
                                disabled={isDeleting || isUploading}
                                title="Delete document"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                {isDeleting ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border border-red-400/30 border-t-red-500" />
                                ) : (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                                Delete
                            </button>
                        )}
                    </div>
                )}

                {/* Placeholder pill for cleared stages with no doc */}
                {!doc && isCompleted && activeIndex === -1 && (
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border rounded-lg opacity-50">
                        <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-bold text-text-muted">No document uploaded</span>
                    </div>
                )}
            </div>
        </div>
    );
};
