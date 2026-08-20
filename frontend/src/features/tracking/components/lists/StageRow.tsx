import {
    Check,
    FileText,
    Loader2,
    RefreshCw,
    Trash2,
    Upload,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import type { ApiDocument } from '../../types';
import type { StageDefinition } from '../../utils/stageUtils';

interface StageRowProps {
    stage: StageDefinition;
    index: number;
    isLast?: boolean;
    stageStatus: 'completed' | 'active' | 'pending';
    docs: ApiDocument[];
    isNotApplicable: boolean;
    isUploading: boolean;
    isApplicabilityUpdating: boolean;
    deletingDocId: number | null;
    uploadDisabledReason?: string | null;
    isExpanded?: boolean;
    onToggleExpand?: (index: number) => void;
    onUploadClick: (index: number) => void;
    onPreviewDoc: (doc: ApiDocument) => void;
    onDeleteDoc: (doc: ApiDocument) => void;
    onReplaceDoc: (index: number, oldDoc: ApiDocument) => void;
    onNotApplicableChange: (stageType: string, notApplicable: boolean) => void;
}

export const StageRow = ({
    stage,
    index,
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
    const canToggleNotApplicable =
        !!stage.supportsNotApplicable && docs.length === 0 && !uploadDisabledReason;
    const disableNotApplicableToggle =
        isApplicabilityUpdating ||
        isUploading ||
        (!isNotApplicable && !canToggleNotApplicable);
    const disableUpload =
        isUploading || isApplicabilityUpdating || isNotApplicable || !!uploadDisabledReason;

    return (
        <div
            className={`p-4 sm:p-5 transition-colors border-b last:border-b-0 ${
                isActive ? 'bg-muted/30' : ''
            }`}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: Indicator + Title + Description */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Stage Step Indicator */}
                    <div
                        className={`size-7 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold transition-colors ${
                            isCompleted && !isNotApplicable
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : isNotApplicable
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                  : isActive
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-muted border-border text-muted-foreground'
                        }`}
                    >
                        {isCompleted && !isNotApplicable ? (
                            <Check className="size-3.5 stroke-[2.5]" />
                        ) : (
                            <span>{index + 1}</span>
                        )}
                    </div>

                    {/* Stage Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-foreground">
                                {stage.title}
                            </h3>

                            {isActive && (
                                <Badge
                                    variant="outline"
                                    className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold gap-1"
                                >
                                    <span className="size-1 rounded-full bg-primary animate-pulse" />
                                    In Progress
                                </Badge>
                            )}

                            {isNotApplicable && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold"
                                >
                                    N/A
                                </Badge>
                            )}

                            {isCompleted && !isNotApplicable && (
                                <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
                                >
                                    Done
                                </Badge>
                            )}

                            {isPending && !isNotApplicable && !docs.length && uploadDisabledReason && (
                                <Badge
                                    variant="outline"
                                    className="border-border text-muted-foreground text-[10px] font-semibold"
                                >
                                    Waiting
                                </Badge>
                            )}

                            {docs.length > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] font-medium"
                                >
                                    {docs.length} {docs.length === 1 ? 'file' : 'files'}
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-normal">
                            {isNotApplicable
                                ? 'This stage is marked as not applicable.'
                                : stage.description}
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pl-10 sm:pl-0">
                    {stage.supportsNotApplicable && (
                        <label
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                isNotApplicable
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'border-border text-muted-foreground hover:bg-muted'
                            } ${disableNotApplicableToggle ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={
                                docs.length > 0
                                    ? 'Remove uploaded files before marking as not applicable.'
                                    : 'Mark this stage as not applicable.'
                            }
                        >
                            <input
                                type="checkbox"
                                checked={isNotApplicable}
                                disabled={disableNotApplicableToggle}
                                onChange={(e) =>
                                    onNotApplicableChange(stage.type, e.target.checked)
                                }
                                className="size-3.5 rounded border-border accent-primary cursor-pointer"
                            />
                            {isApplicabilityUpdating ? 'Saving…' : 'N/A'}
                        </label>
                    )}

                    <Button
                        size="sm"
                        variant={docs.length > 0 ? 'outline' : 'default'}
                        onClick={(e) => {
                            e.stopPropagation();
                            onUploadClick(index);
                        }}
                        disabled={disableUpload}
                        className="h-8 px-3 text-xs font-semibold cursor-pointer"
                        title={
                            isNotApplicable
                                ? 'This stage is marked as not applicable.'
                                : uploadDisabledReason
                                  ? uploadDisabledReason
                                  : docs.length > 0
                                    ? 'Upload more documents'
                                    : 'Upload document'
                        }
                    >
                        {isUploading ? (
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                            <Upload className="mr-1.5 size-3.5" />
                        )}
                        {isUploading ? 'Uploading…' : docs.length > 0 ? 'Upload More' : 'Upload'}
                    </Button>
                </div>
            </div>

            {/* Attached Documents */}
            {docs.length > 0 && (
                <div className="mt-3.5 pl-10 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                        {docs.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex flex-col gap-2 rounded-md border border-border bg-card p-2.5 transition-colors sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <button
                                        type="button"
                                        onClick={() => onPreviewDoc(doc)}
                                        className="inline-flex items-center gap-2 text-left cursor-pointer group min-w-0"
                                    >
                                        <FileText className="size-4 text-primary shrink-0" />
                                        <span className="truncate text-xs font-medium text-primary group-hover:underline max-w-[240px] sm:max-w-md">
                                            {doc.filename}
                                        </span>
                                        <span className="shrink-0 rounded border border-border px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                                            {doc.formatted_size}
                                        </span>
                                    </button>

                                    <p className="mt-0.5 pl-6 text-[10px] text-muted-foreground">
                                        Uploaded by <span className="font-medium text-foreground">{doc.uploaded_by?.name ?? 'Unknown'}</span>
                                        {doc.created_at ? ` · ${new Date(doc.created_at).toLocaleDateString()}` : ''}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onReplaceDoc(index, doc)}
                                        disabled={isUploading || deletingDocId === doc.id}
                                        title="Replace document"
                                        className="h-7 px-2 text-xs font-medium cursor-pointer"
                                    >
                                        <RefreshCw className="mr-1 size-3" />
                                        Replace
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDeleteDoc(doc)}
                                        disabled={deletingDocId === doc.id || isUploading}
                                        title="Delete document"
                                        className="h-7 px-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                                    >
                                        {deletingDocId === doc.id ? (
                                            <Loader2 className="mr-1 size-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="mr-1 size-3" />
                                        )}
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
