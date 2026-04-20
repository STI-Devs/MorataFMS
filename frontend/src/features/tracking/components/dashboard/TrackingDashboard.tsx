import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { EmptyState } from '../../../../components/EmptyState';
import { StatusBadge } from '../../../../components/StatusBadge';

import { appRoutes } from '../../../../lib/appRoutes';
import { useAllExportsData, useAllImportsData } from '../../hooks/useAllTransactionRecords';
import { useImportVesselGroups, useExportVesselGroups } from '../../hooks/useVesselGrouping';
import type { ApiExportTransaction, ApiImportTransaction, VesselGroup } from '../../types';

// ─── Vessel group header (light theme) ───────────────────────────────────────

function VesselGroupHeader<T>({
    group,
    isExpanded,
    onToggle,
}: {
    group: VesselGroup<T>;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const etaLabel = group.type === 'import' ? 'ETA' : 'ETD';
    const formattedEta = group.eta
        ? new Date(`${group.eta}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-border
                ${group.stats.blocked > 0
                    ? 'bg-red-50/60 dark:bg-red-950/20 border-l-2 border-l-red-500'
                    : group.isDelayed
                        ? 'bg-amber-50/40 dark:bg-amber-950/10 border-l-2 border-l-amber-500'
                        : 'bg-surface-secondary/50 hover:bg-surface-secondary border-l-2 border-l-transparent'
                }
            `}
        >
            <svg
                className={`w-3 h-3 text-text-muted shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="flex-1 text-sm font-bold text-text-primary truncate min-w-0">{group.vesselName}</span>
            {group.isDelayed && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shrink-0">DELAYED</span>
            )}
            <span className="text-[10px] text-text-muted shrink-0 hidden sm:inline">{etaLabel} {formattedEta}</span>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">{group.stats.total}</span>
                {group.stats.blocked > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">{group.stats.blocked} blocked</span>
                )}
            </div>
        </button>
    );
}

// ─── Column header helper ─────────────────────────────────────────────────────

const ColHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] break-words leading-tight min-w-0 ${className}`}>
        {children}
    </div>
);

// ─── TrackingDashboard ────────────────────────────────────────────────────────

export const TrackingDashboard = () => {
    const navigate = useNavigate();
    const LIVE_PARAMS = { exclude_statuses: 'completed,cancelled' };

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
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="shrink-0 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Live Tracking Overview</h1>
                    <p className="text-sm text-text-secondary">Your assigned transactions · Grouped by vessel</p>
                </div>
                <CurrentDateTime
                    className="text-right hidden sm:block shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-secondary"
                />
            </div>

            {/* Two panels */}
            <div className="flex flex-col lg:flex-row gap-4 items-start pb-6">

                {/* Import panel */}
                <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col bg-surface border border-border rounded-xl shadow-sm">
                    <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#30d158]" style={{ boxShadow: '0 0 6px #30d15880' }} />
                            <h2 className="text-sm font-bold text-text-primary">Import — by Vessel</h2>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">
                            {importGroups.length} vessels
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        {/* Column headers */}
                        <div className="shrink-0 grid gap-2 px-4 py-3 border-b border-border bg-surface-secondary/50 items-center"
                            style={{ gridTemplateColumns: '140px 130px 128px 250px 90px', width: 'max-content', minWidth: '100%' }}>
                            <ColHeader className="whitespace-nowrap">Customs Ref</ColHeader>
                            <ColHeader className="text-center whitespace-nowrap">Bill of Lading</ColHeader>
                            <ColHeader className="text-center">Status</ColHeader>
                            <ColHeader>Importer</ColHeader>
                            <ColHeader className="text-center">Arrival</ColHeader>
                        </div>

                        {importsLoading ? (
                            <div className="divide-y divide-border/30">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="grid gap-2 px-4 py-3.5 items-center"
                                        style={{ gridTemplateColumns: '140px 130px 128px 250px 90px', width: 'max-content', minWidth: '100%' }}>
                                        <div className="h-4 skeleton-shimmer rounded-md w-20" />
                                        <div className="h-4 skeleton-shimmer rounded-md mx-auto w-16" />
                                        <div className="h-5 skeleton-shimmer rounded-full mx-auto w-16" />
                                        <div className="h-4 skeleton-shimmer rounded-md w-28" />
                                        <div className="h-4 skeleton-shimmer rounded-md mx-auto w-12" />
                                    </div>
                                ))}
                            </div>
                        ) : importGroups.length === 0 ? (
                            <EmptyState label="imports" />
                        ) : (
                            importGroups.map(group => (
                                <div key={group.vesselKey}>
                                    <VesselGroupHeader group={group} isExpanded={expandedImports.has(group.vesselKey)} onToggle={() => toggleImport(group.vesselKey)} />
                                    {expandedImports.has(group.vesselKey) && group.transactions.map((t, i) => (
                                        <div
                                            key={t.id}
                                            onClick={() => navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(t.customs_ref_no)))}
                                            className={`grid gap-2 px-4 py-3 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                            style={{
                                                gridTemplateColumns: '140px 130px 128px 250px 90px',
                                                width: 'max-content',
                                                minWidth: '100%',
                                                borderLeft: t.open_remarks_count > 0 ? '2px solid #ef4444' : '2px solid transparent',
                                            }}
                                        >
                                            <p className="text-xs font-bold text-text-primary truncate">{t.customs_ref_no}</p>
                                            <p className="text-xs text-text-secondary truncate text-center">{t.bl_no || '—'}</p>
                                            <div className="flex justify-center"><StatusBadge status={t.status ?? ''} /></div>
                                            <p className="text-xs text-text-secondary truncate">{t.importer?.name ?? '—'}</p>
                                            <p className="text-xs text-text-muted text-center truncate">{t.arrival_date || '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Export panel */}
                <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col bg-surface border border-border rounded-xl shadow-sm">
                    <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#0a84ff]" style={{ boxShadow: '0 0 6px #0a84ff80' }} />
                            <h2 className="text-sm font-bold text-text-primary">Export — by Vessel</h2>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">
                            {exportGroups.length} vessels
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        {/* Column headers */}
                        <div className="shrink-0 grid gap-2 px-4 py-3 border-b border-border bg-surface-secondary/50 items-center"
                            style={{ gridTemplateColumns: '280px 130px 100px 120px 140px', width: 'max-content', minWidth: '100%' }}>
                            <ColHeader>Shipper</ColHeader>
                            <ColHeader className="text-center whitespace-nowrap">Bill of Lading</ColHeader>
                            <ColHeader className="text-center">Departure</ColHeader>
                            <ColHeader className="text-center">Status</ColHeader>
                            <ColHeader className="text-center">Destination</ColHeader>
                        </div>

                        {exportsLoading ? (
                            <div className="divide-y divide-border/30">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="grid gap-2 px-4 py-3.5 items-center"
                                        style={{ gridTemplateColumns: '280px 130px 100px 120px 140px', width: 'max-content', minWidth: '100%' }}>
                                        <div className="h-4 skeleton-shimmer rounded-md w-36" />
                                        <div className="h-4 skeleton-shimmer rounded-md mx-auto w-16" />
                                        <div className="h-4 skeleton-shimmer rounded-md mx-auto w-12" />
                                        <div className="h-5 skeleton-shimmer rounded-full mx-auto w-16" />
                                        <div className="h-4 skeleton-shimmer rounded-md mx-auto w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : exportGroups.length === 0 ? (
                            <EmptyState label="exports" />
                        ) : (
                            exportGroups.map(group => (
                                <div key={group.vesselKey}>
                                    <VesselGroupHeader group={group} isExpanded={expandedExports.has(group.vesselKey)} onToggle={() => toggleExport(group.vesselKey)} />
                                    {expandedExports.has(group.vesselKey) && group.transactions.map((t, i) => {
                                        const ref = t.bl_no || `EXP-${String(t.id).padStart(4, '0')}`;
                                        return (
                                            <div
                                                key={t.id}
                                                onClick={() => navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(ref)))}
                                                className={`grid gap-2 px-4 py-3 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                                style={{
                                                    gridTemplateColumns: '280px 130px 100px 120px 140px',
                                                    width: 'max-content',
                                                    minWidth: '100%',
                                                    borderLeft: t.open_remarks_count > 0 ? '2px solid #ef4444' : '2px solid transparent',
                                                }}
                                            >
                                                <p className="text-xs font-bold text-text-primary truncate">{t.shipper?.name ?? '—'}</p>
                                                <p className="text-xs text-text-secondary truncate text-center">{t.bl_no || '—'}</p>
                                                <p className="text-xs text-text-muted text-center truncate">{t.export_date || '—'}</p>
                                                <div className="flex justify-center"><StatusBadge status={t.status ?? ''} /></div>
                                                <p className="text-xs text-text-secondary text-center truncate">{t.destination_country?.name ?? '—'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
