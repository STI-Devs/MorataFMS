import { useMemo } from 'react';
import { Icon } from '../../../../components/Icon';
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

export const RecordTypeBadge = ({ type }: { type: ArchiveTaskRecord['type'] }) => (
    <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
            type === 'import'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-teal-200 bg-teal-50 text-teal-700'
        }`}
    >
        {type}
    </span>
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
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/25 backdrop-blur-sm" onClick={onClose}>
            <aside
                className="flex h-full w-full max-w-xl flex-col border-l border-border bg-surface shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                {/* ── Drawer header ── */}
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-text-primary truncate">{record.bl_no}</h2>
                            <RecordTypeBadge type={record.type} />
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-text-secondary truncate">{record.client_name ?? 'Unknown client'}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-text-muted">{record.reference}</p>
                        {/* Metadata pills */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {record.archive_period.label && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary border border-border px-2.5 py-1 text-[10px] font-semibold text-text-secondary">
                                    <Icon name="archive" className="h-3 w-3 text-text-muted" />
                                    {record.archive_period.label}
                                </span>
                            )}
                            {record.transaction_date && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary border border-border px-2.5 py-1 text-[10px] font-semibold text-text-secondary">
                                    <Icon name="clock" className="h-3 w-3 text-text-muted" />
                                    {record.transaction_date}
                                </span>
                            )}
                            {(record.origin_country) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary border border-border px-2.5 py-1 text-[10px] font-semibold text-text-secondary">
                                    <Icon name="truck" className="h-3 w-3 text-text-muted" />
                                    {record.type === 'import' ? 'Origin: ' : 'Dest: '}{record.origin_country}
                                </span>
                            )}
                            {record.type === 'import' && record.selective_color && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary border border-border px-2.5 py-1 text-[10px] font-semibold text-text-secondary">
                                    <Icon name="check-circle" className="h-3 w-3 text-text-muted" />
                                    BLSC: {titleCase(record.selective_color)}
                                </span>
                            )}
                            {(record.type === 'import' ? record.location_of_goods : record.vessel_name) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary border border-border px-2.5 py-1 text-[10px] font-semibold text-text-secondary">
                                    <Icon name="file-text" className="h-3 w-3 text-text-muted" />
                                    {record.type === 'import' ? record.location_of_goods : record.vessel_name}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-0.5 shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                    >
                        <Icon name="x" className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Drawer body ── */}
                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                    {record.my_stage_summaries.length > 0 && (
                        <section className="space-y-3">
                            <DrawerSectionHeading
                                title="My Assigned Stages"
                                hint={role === 'processor'
                                    ? 'Your processor-owned stages only.'
                                    : 'Your billing stage only.'}
                                accent="border-blue-400"
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
                            accent="border-amber-400"
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
                            <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-text-muted text-center">
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
    <div className={`flex items-start gap-2.5 border-l-2 pl-3 ${accent}`}>
        <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-primary">{title}</h3>
            <p className="mt-0.5 text-[11px] text-text-muted">{hint}</p>
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
    <div className="rounded-xl border border-border bg-surface p-3.5">
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-text-primary truncate">{summary.label}</h4>
                    <StageStateChip summary={summary} compact />
                </div>
                <p className="mt-0.5 text-[11px] text-text-muted">{stageStateLabel(summary.state, summary.uploaded_by)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {onToggleNotApplicable && (
                    <button
                        type="button"
                        onClick={() => onToggleNotApplicable(summary.state !== 'not_applicable')}
                        disabled={isApplicabilityUpdating}
                        aria-label={`${summary.state === 'not_applicable' ? 'Undo N/A' : 'Mark N/A'} for ${summary.label}`}
                        className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            summary.state === 'not_applicable'
                                ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                    >
                        {isApplicabilityUpdating ? 'Saving…' : summary.state === 'not_applicable' ? 'Undo N/A' : 'Mark N/A'}
                    </button>
                )}
                {onUpload && (
                    <button
                        type="button"
                        onClick={onUpload}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-700"
                    >
                        <Icon name="plus" className="h-3.5 w-3.5" />
                        Upload
                    </button>
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
    <div className="rounded-xl border border-border bg-surface p-3.5">
        <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-text-primary">{label}</h4>
            <div className="flex shrink-0 items-center gap-2">
                {isNotApplicable && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">N/A</span>
                )}
                {!isNotApplicable && documents.length > 0 && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {documents.length} file{documents.length === 1 ? '' : 's'}
                    </span>
                )}
                {!isNotApplicable && documents.length === 0 && (
                    <span className="rounded-full bg-surface-secondary border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted">None</span>
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
            <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-secondary">
                {emptyLabel}
            </p>
        );
    }

    return (
        <div className="mt-3 space-y-1.5">
            {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-secondary/40 px-3 py-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">{document.filename}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                            {document.uploaded_by?.name ?? 'Unknown uploader'}
                            {document.uploaded_by?.role ? ` • ${document.uploaded_by.role}` : ''}
                            {document.created_at ? ` • ${formatDateTime(document.created_at)}` : ''}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-semibold text-text-muted">{document.formatted_size}</span>
                        <button
                            type="button"
                            onClick={() => void previewDocument(document)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-hover"
                        >
                            Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => void trackingApi.downloadDocument(document.id, document.filename)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-text-primary transition-colors hover:bg-hover"
                        >
                            Download
                        </button>
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
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${tone} ${
                compact ? '' : 'shadow-sm'
            }`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {compact ? shortStageStateLabel(summary.state) : `${summary.label}: ${shortStageStateLabel(summary.state)}`}
        </span>
    );
};
