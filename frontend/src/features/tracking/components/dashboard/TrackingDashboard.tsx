import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { EmptyState } from '../../../../components/EmptyState';
import { StatusBadge } from '../../../../components/StatusBadge';
import { useTransactionList } from '../../hooks/useTransactionList';
import type { ApiExportTransaction, ApiImportTransaction, ExportTransaction, ImportTransaction, LayoutContext } from '../../types';
import { mapExportTransaction, mapImportTransaction } from '../../utils/mappers';


const ColHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] break-words leading-tight min-w-0 ${className}`}>
        {children}
    </div>
);


export const TrackingDashboard = () => {
    const navigate = useNavigate();
    const { dateTime } = useOutletContext<LayoutContext>();

    const LIVE_PARAMS = { exclude_statuses: 'completed,cancelled', per_page: 500 };

    const { data: importsData, isLoading: importsLoading } = useTransactionList('import', LIVE_PARAMS);
    const { data: exportsData, isLoading: exportsLoading } = useTransactionList('export', LIVE_PARAMS);

    const imports = useMemo<ImportTransaction[]>(
        () => (importsData?.data as ApiImportTransaction[] | undefined)?.map(mapImportTransaction) ?? [],
        [importsData],
    );

    const exports = useMemo<ExportTransaction[]>(
        () => (exportsData?.data as ApiExportTransaction[] | undefined)?.map(mapExportTransaction) ?? [],
        [exportsData],
    );

    return (
        <div className="flex flex-col gap-5">

            {/* Header */}
            <div className="shrink-0 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Live Tracking Overview</h1>
                    <p className="text-sm text-text-secondary">Real-time view of your assigned import and export transactions.</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Two panels side-by-side */}
            <div className="flex flex-col lg:flex-row gap-4 items-start pb-6">

                {/* Import Panel */}
                <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col bg-surface border border-border rounded-xl shadow-sm">
                    <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#30d158]" style={{ boxShadow: '0 0 6px #30d15880' }} />
                            <h2 className="text-sm font-bold text-text-primary">Import Transactions</h2>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">
                            {imports.length} active
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <div
                            className="shrink-0 grid gap-2 px-4 py-3 border-b border-border bg-surface-secondary/50 items-center"
                            style={{ gridTemplateColumns: '32px 140px 130px 100px 284px 95px', width: 'max-content', minWidth: '100%' }}
                        >
                            <ColHeader>SC</ColHeader>
                            <ColHeader className="whitespace-nowrap">Customs Ref No.</ColHeader>
                            <ColHeader className="text-center whitespace-nowrap">Bill of Lading</ColHeader>
                            <ColHeader className="text-center">Status</ColHeader>
                            <ColHeader>Importer</ColHeader>
                            <ColHeader className="text-center">Arrival</ColHeader>
                        </div>
                        <div className="flex flex-col">
                            {importsLoading ? (
                                <div className="divide-y divide-border/30">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`grid gap-2 px-4 py-3.5 items-center ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                            style={{ gridTemplateColumns: '32px 140px 130px 100px 284px 95px', width: 'max-content', minWidth: '100%' }}
                                        >
                                            <div className="w-2.5 h-2.5 rounded-full skeleton-shimmer self-center mx-auto" />
                                            <div className="h-4 skeleton-shimmer rounded-md" style={{ width: '80px' }} />
                                            <div className="h-4 skeleton-shimmer rounded-md mx-auto" style={{ width: '60px' }} />
                                            <div className="h-5 skeleton-shimmer rounded-full mx-auto" style={{ width: '70px' }} />
                                            <div className="h-4 skeleton-shimmer rounded-md" style={{ width: '120px' }} />
                                            <div className="h-4 skeleton-shimmer rounded-md mx-auto" style={{ width: '50px' }} />
                                        </div>
                                    ))}
                                </div>
                            ) : imports.length === 0 ? (
                                <EmptyState label="imports" />
                            ) : (
                                imports.map((row, i) => (
                                    <div
                                        key={row.id}
                                        onClick={() => navigate(`/tracking/${row.ref}`)}
                                        className={`grid gap-2 px-4 py-3.5 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                        style={{ gridTemplateColumns: '32px 140px 130px 100px 284px 95px', width: 'max-content', minWidth: '100%' }}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0 self-center mx-auto"
                                            style={{ backgroundColor: row.color, boxShadow: `0 0 4px ${row.color}40` }}
                                        />
                                        <p className="text-xs font-bold text-text-primary truncate">{row.ref}</p>
                                        <p className="text-xs text-text-secondary truncate text-center">{row.bl || '—'}</p>
                                        <div className="flex justify-center"><StatusBadge status={row.status} /></div>
                                        <p className="text-xs text-text-secondary truncate">{row.importer}</p>
                                        <p className="text-xs text-text-muted text-center truncate">{row.date || '—'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Export Panel */}
                <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col bg-surface border border-border rounded-xl shadow-sm">
                    <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#0a84ff]" style={{ boxShadow: '0 0 6px #0a84ff80' }} />
                            <h2 className="text-sm font-bold text-text-primary">Export Transactions</h2>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">
                            {exports.length} active
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <div
                            className="shrink-0 grid gap-2 px-4 py-3 border-b border-border bg-surface-secondary/50 items-center"
                            style={{ gridTemplateColumns: '300px 130px 185px 95px 100px 150px', width: 'max-content', minWidth: '100%' }}
                        >
                            <ColHeader>Shipper</ColHeader>
                            <ColHeader className="text-center whitespace-nowrap">Bill of Lading</ColHeader>
                            <ColHeader>Vessel</ColHeader>
                            <ColHeader className="text-center">Departure</ColHeader>
                            <ColHeader className="text-center">Status</ColHeader>
                            <ColHeader className="text-center">Destination</ColHeader>
                        </div>
                        <div className="flex flex-col">
                            {exportsLoading ? (
                                <div className="divide-y divide-border/30">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`grid gap-2 px-4 py-3.5 items-center ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                            style={{ gridTemplateColumns: '300px 130px 185px 95px 100px 150px', width: 'max-content', minWidth: '100%' }}
                                        >
                                            <div className="h-4 skeleton-shimmer rounded-md" style={{ width: '150px' }} />
                                            <div className="h-4 skeleton-shimmer rounded-md mx-auto" style={{ width: '60px' }} />
                                            <div className="h-4 skeleton-shimmer rounded-md" style={{ width: '60px' }} />
                                            <div className="h-4 skeleton-shimmer rounded-md mx-auto" style={{ width: '50px' }} />
                                            <div className="h-5 skeleton-shimmer rounded-full mx-auto" style={{ width: '70px' }} />
                                            <div className="h-4 skeleton-shimmer rounded-md mx-auto" style={{ width: '60px' }} />
                                        </div>
                                    ))}
                                </div>
                            ) : exports.length === 0 ? (
                                <EmptyState label="exports" />
                            ) : (
                                exports.map((row, i) => (
                                    <div
                                        key={row.id}
                                        onClick={() => navigate(`/tracking/${row.ref}`)}
                                        className={`grid gap-2 px-4 py-3.5 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                        style={{ gridTemplateColumns: '300px 130px 185px 95px 100px 150px', width: 'max-content', minWidth: '100%' }}
                                    >
                                        <p className="text-xs font-bold text-text-primary">{row.shipper}</p>
                                        <p className="text-xs text-text-secondary truncate text-center">{row.bl || '—'}</p>
                                        <p className="text-xs text-text-secondary">{row.vessel}</p>
                                        <p className="text-xs text-text-muted text-center truncate">{row.departureDate || '—'}</p>
                                        <div className="flex justify-center"><StatusBadge status={row.status} /></div>
                                        <p className="text-xs text-text-secondary text-center truncate">{row.portOfDestination}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
