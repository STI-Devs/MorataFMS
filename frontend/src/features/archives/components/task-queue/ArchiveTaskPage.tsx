import {
    Archive,
    CheckCircle2,
    ChevronRight,
    Clock,
    Layers,
    Search,
    Upload,
    X,
} from 'lucide-react';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
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
import { cn } from '@/lib/utils';

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
        <div className="flex h-full flex-1 flex-col bg-background">
            <main className="flex-1 overflow-y-auto px-6 py-6 pb-20 space-y-6">
                {/* Header */}
                <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Legacy Contribution Queue
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {ROLE_META[role].title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {ROLE_META[role].subtitle}
                        </p>
                    </div>
                    <CurrentDateTime
                        className="text-left sm:text-right"
                        timeClassName="text-xl font-mono font-bold tracking-tight text-foreground"
                        dateClassName="mt-0.5 text-xs font-mono uppercase tracking-wider text-muted-foreground"
                    />
                </header>

                {/* Section 1: KPI Metrics Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* 1. Needs My Upload */}
                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Needs My Upload</CardTitle>
                            <Upload className="size-4 text-blue-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {isLoading ? '—' : summary.needs_my_upload}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Actionable legacy records
                            </p>
                        </CardContent>
                    </Card>

                    {/* 2. Waiting on Others */}
                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Waiting on Others</CardTitle>
                            <Clock className="size-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {isLoading ? '—' : summary.waiting_on_others}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Pending other contributors
                            </p>
                        </CardContent>
                    </Card>

                    {/* 3. Completed by Me */}
                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Completed by Me</CardTitle>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {isLoading ? '—' : summary.completed_by_me}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Uploaded and finalized
                            </p>
                        </CardContent>
                    </Card>

                    {/* 4. Shared Records */}
                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Shared Records</CardTitle>
                            <Layers className="size-4 text-muted-foreground/70" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {isLoading ? '—' : summary.shared_records}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Total queue inventory
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Section 2: Search & Quick Filters */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <RoleFilter role={role} value={typeFilter} onChange={setTypeFilter} />
                        <label className="flex items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors shadow-2xs">
                            <input
                                type="checkbox"
                                checked={onlyMyAction}
                                onChange={(event) => setOnlyMyAction(event.target.checked)}
                                className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                            Only show records needing my action
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative min-w-0 sm:w-72">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search BL, ref, client, vessel..."
                                className="h-9 pl-8.5 pr-8 text-xs"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    aria-label="Clear search"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        <select
                            value={periodFilter}
                            onChange={(event) => setPeriodFilter(event.target.value)}
                            className="h-9 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                        >
                            <option value="all">All Archive Periods</option>
                            {periodOptions.map((period) => (
                                <option key={period} value={period}>
                                    {period}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content States */}
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
                    <div className="space-y-8">
                        {SECTION_ORDER.map((status) => (
                            <ArchiveSection
                                key={status}
                                title={SECTION_META[status].title}
                                accentClassName={SECTION_META[status].accent}
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
        <div className="flex items-center gap-1">
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <Button
                        key={option.value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'h-8 px-3 text-xs font-medium shrink-0 transition-all cursor-pointer shadow-2xs',
                            !isSelected && 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                        )}
                    >
                        {option.label}
                    </Button>
                );
            })}
        </div>
    );
};

const LoadingState = () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4 gap-2 shadow-xs bg-card animate-pulse">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="mt-2 h-6 w-32 rounded bg-muted" />
                <div className="mt-4 h-8 rounded bg-muted" />
            </Card>
        ))}
    </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="rounded-xl border border-dashed border-border/80 bg-card p-12 text-center shadow-2xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Archive className="size-6" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">{description}</p>
    </div>
);

const ArchiveSection = ({
    title,
    accentClassName,
    records,
    onOpenRecord,
}: {
    title: string;
    accentClassName: string;
    records: ArchiveTaskRecord[];
    onOpenRecord: (id: number) => void;
}) => {
    if (records.length === 0) {
        return null;
    }

    return (
        <section className="space-y-2.5">
            {/* Section header */}
            <div className="flex items-center gap-2 px-1">
                <div className={cn('size-2 rounded-full', accentClassName)} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                    {records.length}
                </Badge>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[42rem] rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden">
                    {/* Column header */}
                    <div
                        className="grid items-center gap-3 border-b border-border/80 bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                        style={{ gridTemplateColumns: '80px 1.4fr 1.6fr 110px 1.6fr 64px 24px' }}
                    >
                        <span>Type</span>
                        <span>BL No. / Ref</span>
                        <span>Client</span>
                        <span>Period</span>
                        <span>Stages</span>
                        <span>Contributors</span>
                        <span />
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-border/60">
                        {records.map((record) => (
                            <button
                                key={record.id}
                                type="button"
                                onClick={() => onOpenRecord(record.id)}
                                className="group w-full grid items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 cursor-pointer"
                                style={{ gridTemplateColumns: '80px 1.4fr 1.6fr 110px 1.6fr 64px 24px' }}
                            >
                                {/* Type badge */}
                                <span>
                                    <RecordTypeBadge type={record.type} />
                                </span>

                                {/* BL No. + ref */}
                                <span className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors" title={record.bl_no}>
                                        {record.bl_no}
                                    </p>
                                    <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5" title={record.reference}>
                                        {record.reference}
                                    </p>
                                </span>

                                {/* Client */}
                                <span className="min-w-0">
                                    <p className="truncate text-xs text-muted-foreground" title={record.client_name ?? ''}>
                                        {record.client_name ?? '—'}
                                    </p>
                                </span>

                                {/* Period */}
                                <span>
                                    {record.archive_period.label ? (
                                        <span className="inline-block rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                            {record.archive_period.label}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </span>

                                {/* Stage chips */}
                                <span className="flex flex-wrap gap-1">
                                    {buildRowStageChips(record.my_stage_summaries).map((chip) => (
                                        <StageSummaryChip
                                            key={chip.key}
                                            state={chip.state}
                                            label={chip.label}
                                        />
                                    ))}
                                </span>

                                {/* Contributors */}
                                <span>
                                    <CompactContributors contributors={record.contributors} />
                                </span>

                                {/* Chevron */}
                                <span className="flex justify-end">
                                    <ChevronRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const CompactContributors = ({ contributors }: { contributors: ArchiveTaskRecord['contributors'] }) => {
    if (contributors.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    return (
        <div className="flex -space-x-1.5">
            {contributors.slice(0, 3).map((contributor) => (
                <div
                    key={contributor.id}
                    className="flex size-6 items-center justify-center rounded-full border border-card bg-primary/10 text-[9px] font-bold text-primary shadow-2xs"
                    title={contributor.name}
                >
                    {initials(contributor.name)}
                </div>
            ))}
            {contributors.length > 3 && (
                <div className="flex size-6 items-center justify-center rounded-full border border-card bg-muted text-[9px] font-bold text-muted-foreground shadow-2xs">
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
    <Badge
        variant="outline"
        className={cn('text-[10px] px-2 py-0.5 font-semibold gap-1.5', stageStateTone(state))}
    >
        <span className="size-1.5 rounded-full bg-current opacity-80" />
        {label}
    </Badge>
);



