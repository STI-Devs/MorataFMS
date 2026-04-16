import { useDeferredValue, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon } from '../../../components/Icon';
import { UploadModal } from '../../../components/modals/UploadModal';
import { archiveTaskApi } from '../api/archiveTaskApi';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { DocumentableType } from '../../tracking/types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../tracking/utils/stageUtils';
import { useArchiveOperationalQueue } from '../hooks/useArchiveOperationalQueue';
import type {
    ArchiveTaskDocument,
    ArchiveTaskQueueStatus,
    ArchiveTaskRecord,
    ArchiveTaskRole,
    ArchiveTaskStageState,
    ArchiveTaskStageSummary,
} from '../types/archiveTask.types';
import { archiveTaskKeys } from '../utils/archiveTaskQueryKeys';

type StageDefinition = {
    type: string;
    title: string;
};

const OTHER_STAGE_DEFINITION: StageDefinition = {
    type: 'others',
    title: 'Other Documents',
};
const PROCESSOR_OPTIONAL_ARCHIVE_STAGE_KEYS: Record<'import' | 'export', Set<string>> = {
    import: new Set(['ppa', 'port_charges']),
    export: new Set(['dccci']),
};
const ROW_STAGE_SUMMARY_ORDER: ArchiveTaskStageState[] = [
    'missing',
    'not_applicable',
    'uploaded_by_me',
    'uploaded_by_admin',
    'uploaded_by_encoder',
    'shared',
    'uploaded_by_other_staff',
];

const SECTION_ORDER: ArchiveTaskQueueStatus[] = [
    'needs_my_upload',
    'waiting_on_others',
    'already_supplied',
    'completed_by_me',
];

const SECTION_META: Record<ArchiveTaskQueueStatus, { title: string; accent: string; badge: string }> = {
    needs_my_upload: {
        title: 'Needs My Upload',
        accent: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700',
    },
    waiting_on_others: {
        title: 'Waiting on Others',
        accent: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700',
    },
    already_supplied: {
        title: 'Filed',
        accent: 'bg-violet-500',
        badge: 'bg-violet-100 text-violet-700',
    },
    completed_by_me: {
        title: 'Completed by Me',
        accent: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700',
    },
};

const ROLE_META: Record<ArchiveTaskRole, {
    title: string;
    subtitle: string;
    summaryTone: string;
    uploadLabel: string;
}> = {
    processor: {
        title: 'Archive Tasks',
        subtitle: 'Upload historical processor-owned files for shared archive records without reopening the live workflow.',
        summaryTone: 'text-blue-900',
        uploadLabel: 'Processor Stage Upload',
    },
    accounting: {
        title: 'Archive Finance Tasks',
        subtitle: 'Complete legacy billing archive records and review shared uploads from encoder, admin, and processor users.',
        summaryTone: 'text-amber-900',
        uploadLabel: 'Billing / Liquidation Upload',
    },
};

const EMPTY_ARCHIVE_TASK_RECORDS: ArchiveTaskRecord[] = [];

export const ArchiveTaskPage = ({ role }: { role: ArchiveTaskRole }) => {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useArchiveOperationalQueue(role);

    const [search, setSearch] = useState('');
    const [onlyMyAction, setOnlyMyAction] = useState(false);
    const [typeFilter, setTypeFilter] = useState<'all' | 'import' | 'export'>(role === 'processor' ? 'import' : 'all');
    const [periodFilter, setPeriodFilter] = useState<'all' | string>('all');
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [selectedUploadStage, setSelectedUploadStage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [applicabilityStageKey, setApplicabilityStageKey] = useState<string | null>(null);

    const deferredSearch = useDeferredValue(search);
    const allRecords = data?.data ?? EMPTY_ARCHIVE_TASK_RECORDS;

    const filteredRecords = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();

        return allRecords.filter((record) => {
            if (role === 'processor' && typeFilter !== record.type) {
                return false;
            }

            if (role === 'accounting' && typeFilter !== 'all' && typeFilter !== record.type) {
                return false;
            }

            if (periodFilter !== 'all' && record.archive_period.label !== periodFilter) {
                return false;
            }

            if (onlyMyAction && record.queue_status !== 'needs_my_upload') {
                return false;
            }

            if (!term) {
                return true;
            }

            return [
                record.reference,
                record.bl_no,
                record.client_name ?? '',
                record.vessel_name ?? '',
                record.origin_country ?? '',
                record.location_of_goods ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(term);
        });
    }, [allRecords, deferredSearch, onlyMyAction, periodFilter, role, typeFilter]);

    const selectedRecord = useMemo(
        () => filteredRecords.find((record) => record.id === selectedRecordId)
            ?? allRecords.find((record) => record.id === selectedRecordId)
            ?? null,
        [allRecords, filteredRecords, selectedRecordId],
    );

    const summary = useMemo(() => ({
        needs_my_upload: filteredRecords.filter((record) => record.queue_status === 'needs_my_upload').length,
        waiting_on_others: filteredRecords.filter((record) => record.queue_status === 'waiting_on_others').length,
        completed_by_me: filteredRecords.filter((record) => record.queue_status === 'completed_by_me').length,
        shared_records: filteredRecords.length,
    }), [filteredRecords]);

    const periodOptions = useMemo(
        () => Array.from(
            new Set(
                allRecords
                    .map((record) => record.archive_period.label)
                    .filter((period): period is string => typeof period === 'string' && period.length > 0),
            ),
        ).sort().reverse(),
        [allRecords],
    );

    const recordsBySection = useMemo(
        () => Object.fromEntries(
            SECTION_ORDER.map((status) => [
                status,
                filteredRecords.filter((record) => record.queue_status === status),
            ]),
        ) as Record<ArchiveTaskQueueStatus, ArchiveTaskRecord[]>,
        [filteredRecords],
    );

    const handleUpload = async (files: File[]) => {
        if (!selectedRecord || !selectedUploadStage) {
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            await trackingApi.uploadDocuments({
                files,
                type: selectedUploadStage,
                documentable_type: documentableTypeFor(selectedRecord),
                documentable_id: selectedRecord.id,
            });

            await queryClient.invalidateQueries({
                queryKey: archiveTaskKeys.operational(role),
            });
            setSelectedUploadStage(null);
            toast.success('Archive documents uploaded successfully.');
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? (error instanceof Error ? error.message : 'Upload failed. Please try again.');

            setUploadError(message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleStageApplicabilityChange = async (
        record: ArchiveTaskRecord,
        stage: string,
        notApplicable: boolean,
    ) => {
        const nextStageKey = `${record.id}:${stage}`;
        setApplicabilityStageKey(nextStageKey);

        try {
            if (record.type === 'import') {
                await archiveTaskApi.updateImportStageApplicability(record.id, {
                    stage,
                    not_applicable: notApplicable,
                });
            } else {
                await archiveTaskApi.updateExportStageApplicability(record.id, {
                    stage,
                    not_applicable: notApplicable,
                });
            }

            await queryClient.invalidateQueries({
                queryKey: archiveTaskKeys.operational(role),
            });
            toast.success(
                notApplicable
                    ? `${stageLabelFor(record, stage)} marked as not applicable.`
                    : `${stageLabelFor(record, stage)} restored to required.`,
            );
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? (error instanceof Error ? error.message : 'Failed to update the archive stage.');

            toast.error(message);
        } finally {
            setApplicabilityStageKey(null);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col bg-app-bg">
            <main className="flex-1 overflow-y-auto px-6 py-6 pb-20">
                <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">Legacy Contribution Queue</p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary">{ROLE_META[role].title}</h1>
                        <p className="mt-2 max-w-3xl text-sm text-text-secondary">{ROLE_META[role].subtitle}</p>
                    </div>
                    <CurrentDateTime
                        className="text-left sm:text-right"
                        timeClassName="text-2xl font-mono font-bold tracking-tight text-text-primary"
                        dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary"
                    />
                </header>

                <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label="Needs My Upload"
                        value={summary.needs_my_upload}
                        accent="border-blue-500/30 bg-blue-50/60"
                        valueClassName="text-blue-900"
                    />
                    <SummaryCard
                        label="Waiting on Others"
                        value={summary.waiting_on_others}
                        accent="border-amber-500/30 bg-amber-50/60"
                        valueClassName="text-amber-900"
                    />
                    <SummaryCard
                        label="Completed by Me"
                        value={summary.completed_by_me}
                        accent="border-emerald-500/30 bg-emerald-50/60"
                        valueClassName="text-emerald-900"
                    />
                    <SummaryCard
                        label="Shared Records"
                        value={summary.shared_records}
                        accent="border-border bg-surface"
                        valueClassName={ROLE_META[role].summaryTone}
                    />
                </section>

                <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <RoleFilter role={role} value={typeFilter} onChange={setTypeFilter} />
                        <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary">
                            <input
                                type="checkbox"
                                checked={onlyMyAction}
                                onChange={(event) => setOnlyMyAction(event.target.checked)}
                                className="h-4 w-4 rounded border-border text-blue-500 focus:ring-blue-500"
                            />
                            Only show records needing my action
                        </label>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative min-w-0 sm:w-72">
                            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search BL, ref, client, vessel..."
                                className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={periodFilter}
                            onChange={(event) => setPeriodFilter(event.target.value)}
                            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">All Archive Periods</option>
                            {periodOptions.map((period) => (
                                <option key={period} value={period}>
                                    {period}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {isLoading && <LoadingState />}
                {isError && !isLoading && (
                    <EmptyState
                        title="Archive queue failed to load"
                        description="The backend did not return the archive task queue. Refresh the page and try again."
                    />
                )}
                {!isLoading && !isError && filteredRecords.length === 0 && (
                    <EmptyState
                        title="No archive records match these filters"
                        description="Adjust the search or filters, or clear the “Only show records needing my action” toggle."
                    />
                )}
                {!isLoading && !isError && filteredRecords.length > 0 && (
                    <div className="mt-8 space-y-10">
                        {SECTION_ORDER.map((status) => (
                            <ArchiveSection
                                key={status}
                                title={SECTION_META[status].title}
                                accentClassName={SECTION_META[status].accent}
                                badgeClassName={SECTION_META[status].badge}
                                records={recordsBySection[status]}
                                onOpenRecord={setSelectedRecordId}
                            />
                        ))}
                    </div>
                )}
            </main>

            {selectedRecord && (
                <ArchiveDetailDrawer
                    record={selectedRecord}
                    role={role}
                    onClose={() => setSelectedRecordId(null)}
                    onUploadStage={setSelectedUploadStage}
                    onToggleStageApplicability={handleStageApplicabilityChange}
                    applicabilityStageKey={applicabilityStageKey}
                />
            )}

            <UploadModal
                isOpen={selectedUploadStage !== null}
                onClose={() => {
                    setSelectedUploadStage(null);
                    setUploadError(null);
                }}
                onUpload={handleUpload}
                title={selectedUploadStage
                    ? `${ROLE_META[role].uploadLabel}: ${stageLabelFor(selectedRecord, selectedUploadStage)}`
                    : ROLE_META[role].uploadLabel}
                isLoading={isUploading}
                errorMessage={uploadError ?? undefined}
            />
        </div>
    );
};

const SummaryCard = ({
    label,
    value,
    accent,
    valueClassName,
}: {
    label: string;
    value: number;
    accent: string;
    valueClassName: string;
}) => (
    <div className={`rounded-2xl border p-5 shadow-sm ${accent}`}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-text-secondary">{label}</p>
        <p className={`mt-3 text-3xl font-bold ${valueClassName}`}>{value}</p>
    </div>
);

const RoleFilter = ({
    role,
    value,
    onChange,
}: {
    role: ArchiveTaskRole;
    value: 'all' | 'import' | 'export';
    onChange: (value: 'all' | 'import' | 'export') => void;
}) => {
    const options = role === 'processor'
        ? [
            { value: 'import' as const, label: 'Imports' },
            { value: 'export' as const, label: 'Exports' },
        ]
        : [
            { value: 'all' as const, label: 'All Records' },
            { value: 'import' as const, label: 'Imports' },
            { value: 'export' as const, label: 'Exports' },
        ];

    return (
        <div className="inline-flex rounded-lg border border-border bg-hover p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                        value === option.value
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

const LoadingState = () => (
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
                <div className="mt-4 h-6 w-40 animate-pulse rounded bg-surface-secondary" />
                <div className="mt-6 h-10 animate-pulse rounded bg-surface-secondary" />
            </div>
        ))}
    </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Icon name="archive" className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-bold text-text-primary">{title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-text-secondary">{description}</p>
    </div>
);

const ArchiveSection = ({
    title,
    accentClassName,
    badgeClassName,
    records,
    onOpenRecord,
}: {
    title: string;
    accentClassName: string;
    badgeClassName: string;
    records: ArchiveTaskRecord[];
    onOpenRecord: (id: number) => void;
}) => {
    if (records.length === 0) {
        return null;
    }

    return (
        <section className="space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-3 px-1">
                <div className={`h-4 w-1 rounded-full ${accentClassName}`} />
                <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-text-secondary">{title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClassName}`}>{records.length}</span>
            </div>

            {/* Column header */}
            <div className="grid items-center gap-3 rounded-lg bg-surface-secondary/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted"
                style={{ gridTemplateColumns: '80px 1.4fr 1.6fr 100px 1.6fr 64px 24px' }}>
                <span>Type</span>
                <span>BL No. / Ref</span>
                <span>Client</span>
                <span>Period</span>
                <span>Stages</span>
                <span>Contributors</span>
                <span />
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/40 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
                {records.map((record, index) => (
                    <button
                        key={record.id}
                        type="button"
                        onClick={() => onOpenRecord(record.id)}
                        className={`group w-full grid items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover ${
                            index % 2 !== 0 ? 'bg-surface-secondary/30' : ''
                        }`}
                        style={{ gridTemplateColumns: '80px 1.4fr 1.6fr 100px 1.6fr 64px 24px' }}
                    >
                        {/* Type badge */}
                        <span><RecordTypeBadge type={record.type} /></span>

                        {/* BL No. + ref */}
                        <span className="min-w-0">
                            <p className="truncate text-sm font-bold text-text-primary" title={record.bl_no}>{record.bl_no}</p>
                            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-text-muted" title={record.reference}>{record.reference}</p>
                        </span>

                        {/* Client */}
                        <span className="min-w-0">
                            <p className="truncate text-sm text-text-secondary" title={record.client_name ?? ''}>{record.client_name ?? '—'}</p>
                        </span>

                        {/* Period */}
                        <span>
                            {record.archive_period.label
                                ? <span className="rounded-full border border-border bg-hover px-2 py-0.5 text-[10px] font-semibold text-text-secondary">{record.archive_period.label}</span>
                                : <span className="text-xs text-text-muted">—</span>}
                        </span>

                        {/* Stage chips (compact) */}
                        <span className="flex flex-wrap gap-1">
                            {buildRowStageChips(record.my_stage_summaries).map((chip) => (
                                <StageSummaryChip
                                    key={chip.key}
                                    state={chip.state}
                                    label={chip.label}
                                />
                            ))}
                        </span>

                        {/* Contributors (avatar stack only) */}
                        <span>
                            <CompactContributors contributors={record.contributors} />
                        </span>

                        {/* Chevron */}
                        <span className="flex justify-end">
                            <Icon name="chevron-right" className="h-4 w-4 text-text-muted transition-colors group-hover:text-text-primary" />
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
};

const CompactContributors = ({ contributors }: { contributors: ArchiveTaskRecord['contributors'] }) => {
    if (contributors.length === 0) {
        return <span className="text-[10px] text-text-muted">—</span>;
    }

    return (
        <div className="flex -space-x-1.5">
            {contributors.slice(0, 3).map((contributor) => (
                <div
                    key={contributor.id}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-blue-100 text-[9px] font-bold text-blue-700"
                    title={contributor.name}
                >
                    {initials(contributor.name)}
                </div>
            ))}
            {contributors.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-surface-secondary text-[9px] font-bold text-text-muted">
                    +{contributors.length - 3}
                </div>
            )}
        </div>
    );
};

const ArchiveDetailDrawer = ({
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

const StageSummaryChip = ({
    state,
    label,
}: {
    state: ArchiveTaskStageState;
    label: string;
}) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${stageStateTone(state)}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {label}
    </span>
);

const RecordTypeBadge = ({ type }: { type: ArchiveTaskRecord['type'] }) => (
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

function stageStateTone(state: ArchiveTaskStageState): string {
    switch (state) {
        case 'missing':
            return 'border-red-200 bg-red-50 text-red-700';
        case 'not_applicable':
            return 'border-slate-200 bg-slate-100 text-slate-600';
        case 'uploaded_by_me':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'uploaded_by_admin':
            return 'border-violet-200 bg-violet-50 text-violet-700';
        case 'uploaded_by_encoder':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'shared':
            return 'border-indigo-200 bg-indigo-50 text-indigo-700';
        default:
            return 'border-amber-200 bg-amber-50 text-amber-700';
    }
}

function shortStageStateLabel(state: ArchiveTaskStageState): string {
    switch (state) {
        case 'missing':
            return 'Pending';
        case 'not_applicable':
            return 'N/A';
        case 'uploaded_by_me':
            return 'By Me';
        case 'uploaded_by_admin':
            return 'By Admin';
        case 'uploaded_by_encoder':
            return 'By Encoder';
        case 'shared':
            return 'Shared';
        default:
            return 'By Staff';
    }
}

function rowStageSummaryLabel(state: ArchiveTaskStageState, count: number): string {
    switch (state) {
        case 'missing':
            return count === 1 ? 'Pending' : `${count} pending`;
        case 'not_applicable':
            return count === 1 ? 'N/A' : `${count} N/A`;
        case 'uploaded_by_me':
            return count === 1 ? '1 my upload' : `${count} my uploads`;
        case 'uploaded_by_admin':
            return count === 1 ? '1 admin upload' : `${count} admin uploads`;
        case 'uploaded_by_encoder':
            return count === 1 ? '1 encoder upload' : `${count} encoder uploads`;
        case 'shared':
            return count === 1 ? '1 shared upload' : `${count} shared uploads`;
        case 'uploaded_by_other_staff':
            return count === 1 ? '1 staff upload' : `${count} staff uploads`;
    }
}

function buildRowStageChips(summaries: ArchiveTaskStageSummary[]): Array<{
    key: string;
    state: ArchiveTaskStageState;
    label: string;
}> {
    if (summaries.length === 1) {
        const [summary] = summaries;

        return [
            {
                key: summary.key,
                state: summary.state,
                label: `${summary.label}: ${shortStageStateLabel(summary.state)}`,
            },
        ];
    }

    const grouped = new Map<ArchiveTaskStageState, number>();

    for (const summary of summaries) {
        grouped.set(summary.state, (grouped.get(summary.state) ?? 0) + 1);
    }

    return ROW_STAGE_SUMMARY_ORDER
        .filter((state) => grouped.has(state))
        .map((state) => {
            const count = grouped.get(state) ?? 0;

            return {
                key: `${state}:${count}`,
                state,
                label: rowStageSummaryLabel(state, count),
            };
        });
}

function stageStateLabel(state: ArchiveTaskStageState, uploader: ArchiveTaskStageSummary['uploaded_by']): string {
    switch (state) {
        case 'missing':
            return 'No documents have been uploaded for this stage yet.';
        case 'not_applicable':
            return 'This stage is marked as not applicable.';
        case 'uploaded_by_me':
            return 'You already supplied this stage.';
        case 'shared':
            return 'This stage has files from multiple contributors.';
        case 'uploaded_by_admin':
        case 'uploaded_by_encoder':
        case 'uploaded_by_other_staff':
            return `${uploader?.name ?? 'Another user'} already uploaded this stage.`;
    }
}

function canToggleArchiveStageApplicability(
    role: ArchiveTaskRole,
    record: ArchiveTaskRecord,
    summary: ArchiveTaskStageSummary,
): boolean {
    if (role !== 'processor') {
        return false;
    }

    if (!PROCESSOR_OPTIONAL_ARCHIVE_STAGE_KEYS[record.type].has(summary.key)) {
        return false;
    }

    return summary.documents_count === 0 && (summary.state === 'missing' || summary.state === 'not_applicable');
}

function allStageDefinitions(type: ArchiveTaskRecord['type']): StageDefinition[] {
    const stageDefinitions = (type === 'import' ? IMPORT_STAGES : EXPORT_STAGES).map((stage) => ({
        type: stage.type,
        title: stage.title,
    }));

    return [...stageDefinitions, OTHER_STAGE_DEFINITION];
}

function stageLabelFor(record: ArchiveTaskRecord | null, stageKey: string): string {
    const summaryLabel = record?.my_stage_summaries.find((summary) => summary.key === stageKey)?.label;

    if (summaryLabel) {
        return summaryLabel;
    }

    return allStageDefinitions(record?.type ?? 'import')
        .find((stage) => stage.type === stageKey)?.title
        ?? stageKey;
}

function groupDocumentsByStage(documents: ArchiveTaskDocument[]): Map<string, ArchiveTaskDocument[]> {
    const grouped = new Map<string, ArchiveTaskDocument[]>();

    for (const document of documents) {
        const existing = grouped.get(document.type) ?? [];
        grouped.set(document.type, [...existing, document]);
    }

    return grouped;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Unknown date';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function titleCase(value: string): string {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function documentableTypeFor(record: ArchiveTaskRecord): DocumentableType {
    return record.type === 'import'
        ? 'App\\Models\\ImportTransaction'
        : 'App\\Models\\ExportTransaction';
}

async function previewDocument(document: ArchiveTaskDocument): Promise<void> {
    const extension = document.filename.split('.').pop()?.toLowerCase() ?? '';
    const isOfficeDocument = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv'].includes(extension);

    if (isOfficeDocument) {
        await trackingApi.downloadDocument(document.id, document.filename);
        return;
    }

    const pendingTab = window.open('', '_blank');

    if (pendingTab) {
        pendingTab.opener = null;
        pendingTab.document.title = document.filename;
    }

    try {
        const previewBlob = await trackingApi.previewDocument(document.id);
        const previewUrl = window.URL.createObjectURL(previewBlob);

        if (pendingTab) {
            pendingTab.location.replace(previewUrl);
        } else {
            const fallbackTab = window.open(previewUrl, '_blank', 'noopener');

            if (fallbackTab) {
                fallbackTab.opener = null;
            }
        }

        window.setTimeout(() => {
            window.URL.revokeObjectURL(previewUrl);
        }, 60_000);
    } catch (error) {
        pendingTab?.close();
        const message = error instanceof Error ? error.message : 'Preview failed. Please try again.';
        toast.error(message);
    }
}
