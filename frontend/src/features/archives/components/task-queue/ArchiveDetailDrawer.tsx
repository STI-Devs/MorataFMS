import { useMemo } from 'react';
import {
    Archive,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileText,
    Plus,
    Truck,
    X,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { trackingApi } from '../../../tracking/api/trackingApi';
import type {
    ArchiveTaskDocument,
    ArchiveTaskRecord,
    ArchiveTaskRole,
    ArchiveTaskStageSummary,
} from '../../types/archiveTask.types';
import {
    allStageDefinitions,
    canToggleArchiveStageApplicability,
    formatDateTime,
    groupDocumentsByStage,
    previewDocument,
    shortStageStateLabel,
    stageStateLabel,
    stageStateTone,
    titleCase,
} from '../../utils/archiveTask.utils';
import { cn } from '@/lib/utils';

export const RecordTypeBadge = ({ type }: { type: ArchiveTaskRecord['type'] }) => (
    <Badge
        variant="outline"
        className={cn(
            'text-[10px] font-semibold uppercase tracking-wider',
            type === 'import'
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        )}
    >
        {type}
    </Badge>
);

export const ArchiveDetailDrawer = ({
    record,
    role,
    onClose,
    onUploadStage,
    onToggleStageApplicability,
    applicabilityStageKey,
}: {
    record: ArchiveTaskRecord;
    role: ArchiveTaskRole;
    onClose: () => void;
    onUploadStage: (stage: string) => void;
    onToggleStageApplicability: (record: ArchiveTaskRecord, stage: string, notApplicable: boolean) => Promise<void> | void;
    applicabilityStageKey: string | null;
}) => {
    const groupedDocuments = useMemo(() => groupDocumentsByStage(record.documents), [record.documents]);
    const stageDefinitions = useMemo(() => allStageDefinitions(record.type), [record.type]);
    const myStageSet = new Set(record.my_stage_keys);
    const readOnlyStages = stageDefinitions.filter((stage) => !myStageSet.has(stage.type))
        .filter((stage) => {
            const stageDocuments = groupedDocuments.get(stage.type) ?? [];
            return stageDocuments.length > 0 || record.not_applicable_stages.includes(stage.type);
        });

    return (
        <div className="fixed inset-0 z-[120] flex justify-end bg-background/80 backdrop-blur-xs" onClick={onClose}>
            <aside
                className="flex h-full w-full max-w-xl flex-col border-l border-border/80 bg-card shadow-2xl animate-in slide-in-from-right duration-200"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Drawer header */}
                <div className="flex items-start justify-between gap-4 border-b border-border/80 px-6 py-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold tracking-tight text-foreground truncate">{record.bl_no}</h2>
                            <RecordTypeBadge type={record.type} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">{record.client_name ?? 'Unknown client'}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{record.reference}</p>
                        {/* Metadata pills */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {record.archive_period.label && (
                                <Badge variant="secondary" className="gap-1 text-[10px] font-medium text-muted-foreground">
                                    <Archive className="size-3" />
                                    {record.archive_period.label}
                                </Badge>
                            )}
                            {record.transaction_date && (
                                <Badge variant="secondary" className="gap-1 text-[10px] font-medium text-muted-foreground">
                                    <Clock className="size-3" />
                                    {record.transaction_date}
                                </Badge>
                            )}
                            {record.origin_country && (
                                <Badge variant="secondary" className="gap-1 text-[10px] font-medium text-muted-foreground">
                                    <Truck className="size-3" />
                                    {record.type === 'import' ? 'Origin: ' : 'Dest: '}{record.origin_country}
                                </Badge>
                            )}
                            {record.type === 'import' && record.selective_color && (
                                <Badge variant="secondary" className="gap-1 text-[10px] font-medium text-muted-foreground">
                                    <CheckCircle2 className="size-3" />
                                    BLSC: {titleCase(record.selective_color)}
                                </Badge>
                            )}
                            {(record.type === 'import' ? record.location_of_goods : record.vessel_name) && (
                                <Badge variant="secondary" className="gap-1 text-[10px] font-medium text-muted-foreground">
                                    <FileText className="size-3" />
                                    {record.type === 'import' ? record.location_of_goods : record.vessel_name}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="size-8 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Drawer body */}
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    {record.my_stage_summaries.length > 0 && (
                        <section className="space-y-3">
                            <DrawerSectionHeading
                                title="My Assigned Stages"
                                hint={role === 'processor'
                                    ? 'Your processor-owned stages only.'
                                    : 'Your billing stage only.'}
                                accent="border-primary"
                            />
                            <div className="space-y-2.5">
                                {record.my_stage_summaries.map((summary) => (
                                    <StagePanel
                                        key={summary.key}
                                        summary={summary}
                                        documents={groupedDocuments.get(summary.key) ?? []}
                                        onUpload={summary.can_upload ? () => onUploadStage(summary.key) : undefined}
                                        onToggleNotApplicable={canToggleArchiveStageApplicability(role, record, summary)
                                            ? (notApplicable) => onToggleStageApplicability(record, summary.key, notApplicable)
                                            : undefined}
                                        isApplicabilityUpdating={applicabilityStageKey === `${record.id}:${summary.key}`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="space-y-3">
                        <DrawerSectionHeading
                            title="Shared Archive Stages"
                            hint="Read-only — files from encoder, admin, and other contributors."
                            accent="border-amber-500"
                        />
                        {readOnlyStages.length > 0 ? (
                            <div className="space-y-2">
                                {readOnlyStages.map((stage) => (
                                    <ReadOnlyStageRow
                                        key={stage.type}
                                        label={stage.title}
                                        documents={groupedDocuments.get(stage.type) ?? []}
                                        isNotApplicable={record.not_applicable_stages.includes(stage.type)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border/80 px-4 py-5 text-xs text-muted-foreground text-center">
                                No shared stage files yet.
                            </div>
                        )}
                    </section>
                </div>
            </aside>
        </div>
    );
};

const DrawerSectionHeading = ({ title, hint, accent }: { title: string; hint: string; accent: string }) => (
    <div className={cn('flex items-start gap-2.5 border-l-2 pl-3', accent)}>
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        </div>
    </div>
);

const StagePanel = ({
    summary,
    documents,
    onUpload,
    onToggleNotApplicable,
    isApplicabilityUpdating = false,
}: {
    summary: ArchiveTaskStageSummary;
    documents: ArchiveTaskDocument[];
    onUpload?: () => void;
    onToggleNotApplicable?: (notApplicable: boolean) => void;
    isApplicabilityUpdating?: boolean;
}) => (
    <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-foreground truncate">{summary.label}</h4>
                    <StageStateChip summary={summary} compact />
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{stageStateLabel(summary.state, summary.uploaded_by)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {onToggleNotApplicable && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleNotApplicable(summary.state !== 'not_applicable')}
                        disabled={isApplicabilityUpdating}
                        aria-label={`${summary.state === 'not_applicable' ? 'Undo N/A' : 'Mark N/A'} for ${summary.label}`}
                        className="h-7 px-2 text-xs font-medium cursor-pointer shadow-2xs"
                    >
                        {isApplicabilityUpdating ? 'Saving…' : summary.state === 'not_applicable' ? 'Undo N/A' : 'Mark N/A'}
                    </Button>
                )}
                {onUpload && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={onUpload}
                        className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs gap-1"
                    >
                        <Plus className="size-3" />
                        Upload
                    </Button>
                )}
            </div>
        </div>
        <DocumentList documents={documents} emptyLabel="No files uploaded for this stage yet." />
    </div>
);

const ReadOnlyStageRow = ({
    label,
    documents,
    isNotApplicable,
}: {
    label: string;
    documents: ArchiveTaskDocument[];
    isNotApplicable: boolean;
}) => (
    <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-foreground">{label}</h4>
            <div className="flex shrink-0 items-center gap-2">
                {isNotApplicable && (
                    <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                        N/A
                    </Badge>
                )}
                {!isNotApplicable && documents.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                        {documents.length} file{documents.length === 1 ? '' : 's'}
                    </Badge>
                )}
                {!isNotApplicable && documents.length === 0 && (
                    <span className="text-[11px] text-muted-foreground">None</span>
                )}
            </div>
        </div>
        <DocumentList documents={documents} emptyLabel="No shared files uploaded." />
    </div>
);

const DocumentList = ({
    documents,
    emptyLabel,
}: {
    documents: ArchiveTaskDocument[];
    emptyLabel: string;
}) => {
    if (documents.length === 0) {
        return (
            <p className="mt-3 rounded-lg border border-dashed border-border/80 px-3 py-2 text-xs text-muted-foreground">
                {emptyLabel}
            </p>
        );
    }

    return (
        <div className="mt-3 space-y-1.5">
            {documents.map((document) => (
                <div
                    key={document.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                >
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{document.filename}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {document.uploaded_by?.name ?? 'Unknown uploader'}
                            {document.uploaded_by?.role ? ` • ${document.uploaded_by.role}` : ''}
                            {document.created_at ? ` • ${formatDateTime(document.created_at)}` : ''}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[11px] tabular-nums text-muted-foreground mr-1">{document.formatted_size}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void previewDocument(document)}
                            className="h-7 px-2 text-xs font-medium cursor-pointer shadow-2xs gap-1"
                        >
                            <Eye className="size-3 text-muted-foreground" />
                            Preview
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void trackingApi.downloadDocument(document.id, document.filename)}
                            className="h-7 px-2 text-xs font-medium cursor-pointer shadow-2xs gap-1"
                        >
                            <Download className="size-3 text-muted-foreground" />
                            Download
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const StageStateChip = ({
    summary,
    compact = false,
}: {
    summary: ArchiveTaskStageSummary;
    compact?: boolean;
}) => {
    const tone = stageStateTone(summary.state);

    return (
        <Badge
            variant="outline"
            className={cn('text-[10px] px-2 py-0.5 font-semibold gap-1.5', tone)}
        >
            <span className="size-1.5 rounded-full bg-current opacity-80" />
            {compact ? shortStageStateLabel(summary.state) : `${summary.label}: ${shortStageStateLabel(summary.state)}`}
        </Badge>
    );
};

