import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { EmptyState } from '../../../../components/EmptyState';
import { StatusBadge } from '../../../../components/StatusBadge';
import { appRoutes } from '../../../../lib/appRoutes';
import { useAllExportsData, useAllImportsData } from '../../hooks/useAllTransactionRecords';
import { useExportVesselGroups, useImportVesselGroups } from '../../hooks/useVesselGrouping';
import type { ApiExportTransaction, ApiImportTransaction, VesselGroup } from '../../types';
import { VesselGroupHeader } from '../vessel-groups/VesselGroupHeader';

const LIVE_PARAMS = { exclude_statuses: 'completed,cancelled' };

function SectionColumnHeader({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider text-text-secondary ${alignClass}`}>
            {children}
        </span>
    );
}

function formatDateLabel(dateString: string | null | undefined): string {
    if (!dateString) return '—';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function TrackingPanelHeader({
    title,
    badgeTone,
    vesselCount,
}: {
    title: string;
    badgeTone: 'green' | 'blue';
    vesselCount: number;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${badgeTone === 'green' ? 'bg-success/10' : 'bg-primary/10'}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${badgeTone === 'green' ? 'bg-success' : 'bg-primary'}`} />
                </div>
                <div>
                    <h2 className="text-sm font-bold tracking-tight text-text-primary">{title}</h2>
                    <p className="text-[11px] font-medium text-text-muted">Expanded view · Active transactions</p>
                </div>
            </div>
            <span className="rounded-lg border border-border bg-surface-secondary/50 px-3 py-1 text-[11px] font-bold text-text-secondary shadow-sm">
                {vesselCount} vessels
            </span>
        </div>
    );
}

function ImportGroupsPanel({
    groups,
    isLoading,
    expandedGroups,
    onToggle,
}: {
    groups: VesselGroup<ApiImportTransaction>[];
    isLoading: boolean;
    expandedGroups: Set<string>;
    onToggle: (key: string) => void;
}) {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[520px] flex-col">
            <div className="mb-4 rounded-xl border border-border bg-surface shadow-sm">
                <TrackingPanelHeader title="Import Workload" badgeTone="green" vesselCount={groups.length} />
            </div>

            <div className="flex-1 flex flex-col gap-4">
                {isLoading ? (
                    <div className="flex flex-col gap-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-5 shadow-sm">
                                <div className="h-5 w-32 rounded skeleton-shimmer" />
                                <div className="h-4 w-24 rounded skeleton-shimmer" />
                                <div className="ml-auto h-5 w-20 rounded skeleton-shimmer" />
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface shadow-sm">
                        <EmptyState label="imports" />
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.vesselKey} className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
                            <VesselGroupHeader
                                group={group}
                                isExpanded={expandedGroups.has(group.vesselKey)}
                                onToggle={() => onToggle(group.vesselKey)}
                            />

                            {expandedGroups.has(group.vesselKey) && (
                                <div>
                                    <div className="hidden border-b border-border bg-surface-secondary/40 px-5 py-2.5 lg:grid lg:grid-cols-[1.35fr_1.1fr_108px_1.2fr_110px] lg:gap-x-3">
                                        <SectionColumnHeader>Customs Ref</SectionColumnHeader>
                                        <SectionColumnHeader>Bill of Lading</SectionColumnHeader>
                                        <SectionColumnHeader align="center">Status</SectionColumnHeader>
                                        <SectionColumnHeader>Importer</SectionColumnHeader>
                                        <SectionColumnHeader align="right">Arrival</SectionColumnHeader>
                                    </div>
                                    {group.transactions.map((transaction, index) => (
                                        <button
                                            key={transaction.id}
                                            type="button"
                                            onClick={() => navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(transaction.customs_ref_no)))}
                                            className={`grid w-full gap-3 border-b border-border/40 px-5 py-4 text-left transition-all hover:bg-hover/80 last:border-0 lg:grid-cols-[1.35fr_1.1fr_108px_1.2fr_110px] lg:items-center lg:py-3.5 ${
                                                index % 2 !== 0 ? 'bg-surface/30' : 'bg-surface'
                                            } ${transaction.open_remarks_count > 0 ? 'border-l-[3px] border-l-danger bg-danger/10' : 'border-l-[3px] border-l-transparent'}`}
                                        >
                                            <div className="min-w-0 pl-1">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Customs Ref</span>
                                                <p className="truncate font-mono text-[13px] font-bold text-text-primary">{transaction.customs_ref_no}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">BL No.</span>
                                                <p className="truncate font-mono text-xs font-semibold text-text-secondary">{transaction.bl_no || '—'}</p>
                                            </div>
                                            <div className="flex lg:justify-center">
                                                <StatusBadge status={transaction.status ?? ''} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Importer</span>
                                                <p className="truncate text-[13px] text-text-secondary">{transaction.importer?.name ?? '—'}</p>
                                            </div>
                                            <div className="min-w-0 lg:text-right">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Arrival</span>
                                                <p className="truncate text-[12px] font-medium text-text-muted">{formatDateLabel(transaction.arrival_date)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ExportGroupsPanel({
    groups,
    isLoading,
    expandedGroups,
    onToggle,
}: {
    groups: VesselGroup<ApiExportTransaction>[];
    isLoading: boolean;
    expandedGroups: Set<string>;
    onToggle: (key: string) => void;
}) {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[520px] flex-col">
            <div className="mb-4 rounded-xl border border-border bg-surface shadow-sm">
                <TrackingPanelHeader title="Export Workload" badgeTone="blue" vesselCount={groups.length} />
            </div>

            <div className="flex-1 flex flex-col gap-4">
                {isLoading ? (
                    <div className="flex flex-col gap-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-5 shadow-sm">
                                <div className="h-5 w-28 rounded skeleton-shimmer" />
                                <div className="h-4 w-32 rounded skeleton-shimmer" />
                                <div className="ml-auto h-5 w-20 rounded skeleton-shimmer" />
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface shadow-sm">
                        <EmptyState label="exports" />
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.vesselKey} className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
                            <VesselGroupHeader
                                group={group}
                                isExpanded={expandedGroups.has(group.vesselKey)}
                                onToggle={() => onToggle(group.vesselKey)}
                            />

                            {expandedGroups.has(group.vesselKey) && (
                                <div>
                                    <div className="hidden border-b border-border bg-surface-secondary/40 px-5 py-2.5 lg:grid lg:grid-cols-[1.15fr_1.25fr_108px_1fr_120px] lg:gap-x-3">
                                        <SectionColumnHeader>BL No.</SectionColumnHeader>
                                        <SectionColumnHeader>Shipper</SectionColumnHeader>
                                        <SectionColumnHeader align="center">Status</SectionColumnHeader>
                                        <SectionColumnHeader>Destination</SectionColumnHeader>
                                        <SectionColumnHeader align="right">Departure</SectionColumnHeader>
                                    </div>
                                    {group.transactions.map((transaction, index) => {
                                        const reference = transaction.bl_no || `EXP-${String(transaction.id).padStart(4, '0')}`;

                                        return (
                                            <button
                                                key={transaction.id}
                                                type="button"
                                                onClick={() => navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(reference)))}
                                                className={`grid w-full gap-3 border-b border-border/40 px-5 py-4 text-left transition-all hover:bg-hover/80 last:border-0 lg:grid-cols-[1.15fr_1.25fr_108px_1fr_120px] lg:items-center lg:py-3.5 ${
                                                    index % 2 !== 0 ? 'bg-surface/30' : 'bg-surface'
                                                } ${transaction.open_remarks_count > 0 ? 'border-l-[3px] border-l-danger bg-danger/10' : 'border-l-[3px] border-l-transparent'}`}
                                            >
                                                <div className="min-w-0 pl-1">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">BL No.</span>
                                                    <p className="truncate font-mono text-[13px] font-bold text-text-primary">{reference}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Shipper</span>
                                                    <p className="truncate text-[13px] text-text-secondary">{transaction.shipper?.name ?? '—'}</p>
                                                </div>
                                                <div className="flex lg:justify-center">
                                                    <StatusBadge status={transaction.status ?? ''} />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Destination</span>
                                                    <p className="truncate text-[13px] text-text-secondary">{transaction.destination_country?.name ?? '—'}</p>
                                                </div>
                                                <div className="min-w-0 lg:text-right">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Departure</span>
                                                    <p className="truncate text-[12px] font-medium text-text-muted">{formatDateLabel(transaction.export_date)}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export const TrackingDashboard = () => {
    const { data: importsData, isLoading: importsLoading } = useAllImportsData(LIVE_PARAMS);
    const { data: exportsData, isLoading: exportsLoading } = useAllExportsData(LIVE_PARAMS);

    const rawImports = useMemo(() => (importsData as ApiImportTransaction[] | undefined) ?? [], [importsData]);
    const rawExports = useMemo(() => (exportsData as ApiExportTransaction[] | undefined) ?? [], [exportsData]);

    const importGroups = useImportVesselGroups(rawImports);
    const exportGroups = useExportVesselGroups(rawExports);

    const [expandedImports, setExpandedImports] = useState<Set<string>>(() => new Set(importGroups.map(g => g.vesselKey)));
    const [expandedExports, setExpandedExports] = useState<Set<string>>(() => new Set(exportGroups.map(g => g.vesselKey)));

    const toggleImport = (key: string) => setExpandedImports(prev => {
        const n = new Set(prev);
        if (n.has(key)) { n.delete(key); } else { n.add(key); }
        return n;
    });
    const toggleExport = (key: string) => setExpandedExports(prev => {
        const n = new Set(prev);
        if (n.has(key)) { n.delete(key); } else { n.add(key); }
        return n;
    });

    return (
        <div className="flex flex-col gap-5 pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Live Tracking Overview</h1>
                    <p className="mt-1 text-sm text-text-secondary">Your assigned transactions · Grouped by vessel</p>
                </div>
                <CurrentDateTime
                    className="hidden shrink-0 text-right sm:block"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary leading-none"
                    dateClassName="mt-1 text-sm text-text-secondary leading-none"
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ImportGroupsPanel
                    groups={importGroups}
                    isLoading={importsLoading}
                    expandedGroups={expandedImports}
                    onToggle={toggleImport}
                />
                <ExportGroupsPanel
                    groups={exportGroups}
                    isLoading={exportsLoading}
                    expandedGroups={expandedExports}
                    onToggle={toggleExport}
                />
            </div>
        </div>
    );
};
