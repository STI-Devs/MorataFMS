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

function PanelMetric({
    label,
    value,
    detail,
}: {
    label: string;
    value: number;
    detail: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface-secondary/50 p-4 shadow-sm">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
            <p className="text-3xl font-semibold tabular-nums text-text-primary">{value}</p>
            <p className="mt-2 text-xs text-text-muted">{detail}</p>
        </div>
    );
}

function SectionColumnHeader({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    return (
        <span className={`text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted ${alignClass}`}>
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
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${badgeTone === 'green' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <div>
                    <h2 className="text-sm font-bold text-text-primary">{title}</h2>
                    <p className="text-xs text-text-muted">Expanded voyage view · active transactions only</p>
                </div>
            </div>
            <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[10px] font-semibold text-text-muted">
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
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <TrackingPanelHeader title="Import Workload" badgeTone="green" vesselCount={groups.length} />

            <div className="flex-1">
                {isLoading ? (
                    <div className="divide-y divide-border/40">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 px-4 py-4">
                                <div className="h-4 w-32 rounded skeleton-shimmer" />
                                <div className="h-4 w-24 rounded skeleton-shimmer" />
                                <div className="ml-auto h-4 w-20 rounded skeleton-shimmer" />
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <EmptyState label="imports" />
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.vesselKey} className="border-b border-border last:border-0">
                            <VesselGroupHeader
                                group={group}
                                isExpanded={expandedGroups.has(group.vesselKey)}
                                onToggle={() => onToggle(group.vesselKey)}
                            />

                            {expandedGroups.has(group.vesselKey) && (
                                <div>
                                    <div className="hidden border-b border-border bg-surface-secondary/35 px-4 py-2 lg:grid lg:grid-cols-[1.35fr_1.1fr_108px_1.2fr_110px] lg:gap-x-3">
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
                                            className={`grid w-full gap-3 border-b border-border/40 px-4 py-4 text-left transition-colors hover:bg-hover/60 last:border-0 lg:grid-cols-[1.35fr_1.1fr_108px_1.2fr_110px] lg:items-center lg:py-3 ${
                                                index % 2 !== 0 ? 'bg-surface-secondary/15' : ''
                                            } ${transaction.open_remarks_count > 0 ? 'border-l-4 border-red-500 bg-red-50/20 dark:bg-red-950/10' : 'border-l-4 border-transparent'}`}
                                        >
                                            <div className="min-w-0">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Customs Ref</span>
                                                <p className="truncate text-sm font-semibold text-text-primary lg:text-xs">{transaction.customs_ref_no}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">BL No.</span>
                                                <p className="truncate font-mono text-sm text-text-secondary lg:text-[11px]">{transaction.bl_no || '—'}</p>
                                            </div>
                                            <div className="flex lg:justify-center">
                                                <StatusBadge status={transaction.status ?? ''} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Importer</span>
                                                <p className="truncate text-sm text-text-secondary lg:text-xs">{transaction.importer?.name ?? '—'}</p>
                                            </div>
                                            <div className="min-w-0 lg:text-right">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Arrival</span>
                                                <p className="truncate text-sm text-text-muted lg:text-[11px]">{formatDateLabel(transaction.arrival_date)}</p>
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
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <TrackingPanelHeader title="Export Workload" badgeTone="blue" vesselCount={groups.length} />

            <div className="flex-1">
                {isLoading ? (
                    <div className="divide-y divide-border/40">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 px-4 py-4">
                                <div className="h-4 w-28 rounded skeleton-shimmer" />
                                <div className="h-4 w-32 rounded skeleton-shimmer" />
                                <div className="ml-auto h-4 w-20 rounded skeleton-shimmer" />
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <EmptyState label="exports" />
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.vesselKey} className="border-b border-border last:border-0">
                            <VesselGroupHeader
                                group={group}
                                isExpanded={expandedGroups.has(group.vesselKey)}
                                onToggle={() => onToggle(group.vesselKey)}
                            />

                            {expandedGroups.has(group.vesselKey) && (
                                <div>
                                    <div className="hidden border-b border-border bg-surface-secondary/35 px-4 py-2 lg:grid lg:grid-cols-[1.15fr_1.25fr_108px_1fr_120px] lg:gap-x-3">
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
                                                className={`grid w-full gap-3 border-b border-border/40 px-4 py-4 text-left transition-colors hover:bg-hover/60 last:border-0 lg:grid-cols-[1.15fr_1.25fr_108px_1fr_120px] lg:items-center lg:py-3 ${
                                                    index % 2 !== 0 ? 'bg-surface-secondary/15' : ''
                                                } ${transaction.open_remarks_count > 0 ? 'border-l-4 border-red-500 bg-red-50/20 dark:bg-red-950/10' : 'border-l-4 border-transparent'}`}
                                            >
                                                <div className="min-w-0">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">BL No.</span>
                                                    <p className="truncate font-mono text-sm font-semibold text-text-primary lg:text-[11px]">{reference}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Shipper</span>
                                                    <p className="truncate text-sm text-text-secondary lg:text-xs">{transaction.shipper?.name ?? '—'}</p>
                                                </div>
                                                <div className="flex lg:justify-center">
                                                    <StatusBadge status={transaction.status ?? ''} />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Destination</span>
                                                    <p className="truncate text-sm text-text-secondary lg:text-xs">{transaction.destination_country?.name ?? '—'}</p>
                                                </div>
                                                <div className="min-w-0 lg:text-right">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Departure</span>
                                                    <p className="truncate text-sm text-text-muted lg:text-[11px]">{formatDateLabel(transaction.export_date)}</p>
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

export const AdminLiveTracking = () => {
    const { data: importsData, isLoading: importsLoading } = useAllImportsData(LIVE_PARAMS);
    const { data: exportsData, isLoading: exportsLoading } = useAllExportsData(LIVE_PARAMS);

    const rawImports = useMemo(() => (importsData as ApiImportTransaction[] | undefined) ?? [], [importsData]);
    const rawExports = useMemo(() => (exportsData as ApiExportTransaction[] | undefined) ?? [], [exportsData]);

    const importGroups = useImportVesselGroups(rawImports);
    const exportGroups = useExportVesselGroups(rawExports);

    const [expandedImports, setExpandedImports] = useState<Set<string>>(() => new Set(importGroups.map((group) => group.vesselKey)));
    const [expandedExports, setExpandedExports] = useState<Set<string>>(() => new Set(exportGroups.map((group) => group.vesselKey)));

    const toggleImport = (key: string) => {
        setExpandedImports((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleExport = (key: string) => {
        setExpandedExports((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const importsWithAttention = rawImports.filter((transaction) => transaction.open_remarks_count > 0).length;
    const exportsWithAttention = rawExports.filter((transaction) => transaction.open_remarks_count > 0).length;
    const activeTransactions = rawImports.length + rawExports.length;

    return (
        <div className="min-h-screen bg-surface-secondary px-6 py-6" data-testid="admin-live-tracking-page">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-text-primary">Live Tracking Overview</h1>
                            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                                Vessel-first monitoring for active import and export workloads, without losing the underlying transaction record detail.
                            </p>
                        </div>
                    </div>
                    <CurrentDateTime
                        className="text-right hidden shrink-0 sm:block"
                        timeClassName="text-3xl font-bold tabular-nums text-text-primary leading-none"
                        dateClassName="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <PanelMetric label="Active Imports" value={rawImports.length} detail="Import transactions still in motion" />
                    <PanelMetric label="Active Exports" value={rawExports.length} detail="Export transactions currently open" />
                    <PanelMetric label="Open Workload" value={activeTransactions} detail="Combined active import and export load" />
                    <PanelMetric label="Needs Attention" value={importsWithAttention + exportsWithAttention} detail="Transactions with active remarks or blockers" />
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
        </div>
    );
};
