import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { Icon } from '../../../../components/Icon';
import { UploadModal } from '../../../../components/modals/UploadModal';
import { ArchiveDetailDrawer, RecordTypeBadge } from './ArchiveDetailDrawer';
import { useArchiveTaskWorkspace } from '../../hooks/useArchiveTaskWorkspace';
import type {
    ArchiveTaskRecord,
    ArchiveTaskRole,
    ArchiveTaskStageState,
} from '../../types/archiveTask.types';
import {
    ROLE_META,
    SECTION_META,
    SECTION_ORDER,
    buildRowStageChips,
    initials,
    stageLabelFor,
    stageStateTone,
} from '../../utils/archiveTask.utils';

export const ArchiveTaskPage = ({ role }: { role: ArchiveTaskRole }) => {
    const {
        isLoading,
        isError,
        search,
        setSearch,
        onlyMyAction,
        setOnlyMyAction,
        typeFilter,
        setTypeFilter,
        periodFilter,
        setPeriodFilter,
        selectedRecord,
        setSelectedRecordId,
        selectedUploadStage,
        setSelectedUploadStage,
        isUploading,
        uploadError,
        applicabilityStageKey,
        filteredRecords,
        recordsBySection,
        summary,
        periodOptions,
        handleUpload,
        handleStageApplicabilityChange,
        closeUploadModal,
        closeDrawer,
    } = useArchiveTaskWorkspace(role);

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
                    onClose={closeDrawer}
                    onUploadStage={setSelectedUploadStage}
                    onToggleStageApplicability={handleStageApplicabilityChange}
                    applicabilityStageKey={applicabilityStageKey}
                />
            )}

            <UploadModal
                isOpen={selectedUploadStage !== null}
                onClose={closeUploadModal}
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


