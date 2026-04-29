import type { ApiDocument } from '../../types';
import type { StageDefinition } from '../../utils/stageUtils';

interface StageRowProps {
    stage: StageDefinition;
    index: number;
    isLast: boolean;
    stageStatus: 'completed' | 'active' | 'pending';
    docs: ApiDocument[];
    isNotApplicable: boolean;
    isUploading: boolean;
    isApplicabilityUpdating: boolean;
    deletingDocId: number | null;
    uploadDisabledReason?: string | null;
    onUploadClick: (index: number) => void;
    onPreviewDoc: (doc: ApiDocument) => void;
    onDeleteDoc: (doc: ApiDocument) => void;
    onReplaceDoc: (index: number, oldDoc: ApiDocument) => void;
    onNotApplicableChange: (stageType: string, notApplicable: boolean) => void;
}

export const StageRow = ({
    stage,
    index,
    isLast,
    stageStatus,
    docs,
    isNotApplicable,
    isUploading,
    isApplicabilityUpdating,
    deletingDocId,
    uploadDisabledReason,
    onUploadClick,
    onPreviewDoc,
    onDeleteDoc,
    onReplaceDoc,
    onNotApplicableChange,
}: StageRowProps) => {
    const isCompleted = stageStatus === 'completed';
    const isActive = stageStatus === 'active';
    const isPending = stageStatus === 'pending';
    const canToggleNotApplicable = !!stage.supportsNotApplicable && docs.length === 0 && !uploadDisabledReason;
    const disableNotApplicableToggle = isApplicabilityUpdating || isUploading || (!isNotApplicable && !canToggleNotApplicable);
    const disableUpload = isUploading || isApplicabilityUpdating || isNotApplicable || !!uploadDisabledReason;

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
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
                            {isNotApplicable && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                    N/A
                                </span>
                            )}
                            {isCompleted && !isNotApplicable && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                    Done
                                </span>
                            )}
                            {isPending && !isNotApplicable && !docs.length && uploadDisabledReason && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-surface-secondary text-text-muted border border-border shrink-0">
                                    Waiting
                                </span>
                            )}
                            {docs.length > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-surface-secondary border border-border text-text-muted shrink-0">
                                    {docs.length} file{docs.length === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                            {isNotApplicable
                                ? 'This stage is marked as not applicable for the current transaction.'
                                : stage.description}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0 self-center">
                        {stage.supportsNotApplicable && (
                            <label
                                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    isNotApplicable
                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'border-border bg-surface-secondary text-text-secondary'
                                } ${disableNotApplicableToggle ? 'opacity-70' : 'cursor-pointer hover:bg-hover'}`}
                                title={docs.length > 0 ? 'Remove uploaded files before marking this stage as not applicable.' : 'Mark this stage as not applicable.'}
                            >
                                <input
                                    type="checkbox"
                                    checked={isNotApplicable}
                                    disabled={disableNotApplicableToggle}
                                    onChange={(event) => onNotApplicableChange(stage.type, event.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-border-strong text-amber-500 focus:ring-amber-500/30"
                                />
                                {isApplicabilityUpdating ? 'Saving…' : 'N/A'}
                            </label>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); onUploadClick(index); }}
                            disabled={disableUpload}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 self-center shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                                docs.length > 0
                                    ? 'bg-surface-secondary hover:bg-hover text-text-primary border border-border'
                                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
                            }`}
                            title={isNotApplicable
                                ? 'This stage is marked as not applicable.'
                                : uploadDisabledReason
                                    ? uploadDisabledReason
                                    : docs.length > 0
                                        ? 'Upload more documents for this stage'
                                        : 'Upload document for this stage'}
                        >
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current/30 border-t-current" />
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            )}
                            {isUploading ? 'Uploading…' : docs.length > 0 ? 'Upload More' : 'Upload'}
                        </button>
                    </div>
                </div>

                {docs.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {docs.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 flex-wrap">
                                <div className="min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => onPreviewDoc(doc)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-secondary hover:bg-hover border border-border rounded-lg cursor-pointer transition-colors group/file min-w-0"
                                    >
                                        <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover/file:underline truncate max-w-[220px]">
                                            {doc.filename}
                                        </span>
                                        <span className="text-[10px] text-text-muted shrink-0">{doc.formatted_size}</span>
                                    </button>
                                    <p className="mt-1 pl-1 text-[10px] text-text-muted">
                                        Processed by {doc.uploaded_by?.name ?? 'Unknown user'}
                                        {doc.created_at ? ` on ${new Date(doc.created_at).toLocaleDateString()}` : ''}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onReplaceDoc(index, doc); }}
                                    disabled={isUploading || deletingDocId === doc.id}
                                    title="Replace document"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-hover border border-border transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Replace
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc); }}
                                    disabled={deletingDocId === doc.id || isUploading}
                                    title="Delete document"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    {deletingDocId === doc.id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border border-red-400/30 border-t-red-500" />
                                    ) : (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
