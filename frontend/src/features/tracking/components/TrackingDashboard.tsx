import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { StatusBadge } from '../../../components/StatusBadge';
import { Spinner } from '../../../components/Spinner';
import { EmptyState } from '../../../components/EmptyState';
import { useTransactionList } from '../hooks/useTransactionList';
import { mapImportTransaction, mapExportTransaction } from '../utils/mappers';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../types';



const ColHeader = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] whitespace-nowrap">{children}</span>
);

export const TrackingDashboard = () => {
    const navigate = useNavigate();
    const { dateTime } = useOutletContext<LayoutContext>();

    const { data: importsData, isLoading: importsLoading } = useTransactionList('import');
    const { data: exportsData, isLoading: exportsLoading } = useTransactionList('export');

    const imports = useMemo<ImportTransaction[]>(
        () => importsData?.data.map(mapImportTransaction) ?? [],
        [importsData],
    );

    const exports = useMemo<ExportTransaction[]>(
        () => exportsData?.data.map(mapExportTransaction) ?? [],
        [exportsData],
    );

    return (
        /* Outer shell — no fixed height, let it grow so MainLayout scrolls */
        <div className="flex flex-col gap-5">

            {/* ── Page Header ── */}
            <div className="shrink-0 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Live Tracking Overview</h1>
                    <p className="text-sm text-text-secondary">Real-time view of your assigned import and export transactions.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* ── Two panels side by side, each growing to their content ── */}
            <div className="flex flex-col lg:flex-row gap-4 items-start pb-6">

                {/* ─── Import Transactions Panel ─── */}
                <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col bg-surface border border-border/60 rounded-lg shadow-sm overflow-hidden">

                    {/* Panel header */}
                    <div className="shrink-0 px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#30d158] shadow-sm" style={{ boxShadow: '0 0 6px #30d15880' }} />
                            <h2 className="text-sm font-bold text-text-primary">Import Transactions</h2>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">
                            {imports.length} active
                        </span>
                    </div>

                    {/* Column headers */}
                    <div className="shrink-0 grid px-4 py-1.5 border-b border-border/30 bg-surface-secondary/50"
                        style={{ gridTemplateColumns: '28px 1.4fr 1.3fr 110px 1.5fr 1fr' }}>
                        <ColHeader>SC</ColHeader>
                        <ColHeader>Customs Ref No.</ColHeader>
                        <ColHeader>Bill of Lading</ColHeader>
                        <div className="text-center"><ColHeader>Status</ColHeader></div>
                        <ColHeader>Importer</ColHeader>
                        <div className="text-center"><ColHeader>Arrival</ColHeader></div>
                    </div>

                    {/* Rows — natural growth */}
                    <div className="flex flex-col">
                        {importsLoading ? (
                            <Spinner color="#30d158" />
                        ) : imports.length === 0 ? (
                            <EmptyState label="imports" />
                        ) : (
                            imports.map((row, i) => (
                                <div
                                    key={row.id}
                                    onClick={() => navigate(`/tracking/${row.ref}`)}
                                    className={`grid px-4 py-1.5 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                    style={{ gridTemplateColumns: '28px 1.4fr 1.3fr 110px 1.5fr 1fr' }}
                                >
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${row.color}`} />
                                    <p className="text-xs font-bold text-text-primary truncate pr-2">{row.ref}</p>
                                    <p className="text-xs text-text-secondary truncate pr-2">{row.bl || '—'}</p>
                                    <div className="flex justify-center"><StatusBadge status={row.status} /></div>
                                    <p className="text-xs text-text-secondary truncate pr-2">{row.importer}</p>
                                    <p className="text-xs text-text-muted text-center truncate">{row.date || '—'}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ─── Export Transactions Panel ─── */}
                <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col bg-surface border border-border/60 rounded-lg shadow-sm overflow-hidden">

                    {/* Panel header */}
                    <div className="shrink-0 px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#0a84ff]" style={{ boxShadow: '0 0 6px #0a84ff80' }} />
                            <h2 className="text-sm font-bold text-text-primary">Export Transactions</h2>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">
                            {exports.length} active
                        </span>
                    </div>

                    {/* Column headers */}
                    <div className="shrink-0 grid px-4 py-1.5 border-b border-border/30 bg-surface-secondary/50"
                        style={{ gridTemplateColumns: '1.5fr 1.1fr 1.1fr 1.2fr 100px 1fr' }}>
                        <ColHeader>Shipper</ColHeader>
                        <ColHeader>Bill of Lading</ColHeader>
                        <ColHeader>Vessel</ColHeader>
                        <ColHeader>Departure</ColHeader>
                        <div className="text-center"><ColHeader>Status</ColHeader></div>
                        <div className="text-center"><ColHeader>Destination</ColHeader></div>
                    </div>

                    {/* Rows — natural growth */}
                    <div className="flex flex-col">
                        {exportsLoading ? (
                            <Spinner color="#0a84ff" />
                        ) : exports.length === 0 ? (
                            <EmptyState label="exports" />
                        ) : (
                            exports.map((row, i) => (
                                <div
                                    key={row.id}
                                    onClick={() => navigate(`/tracking/${row.ref}`)}
                                    className={`grid px-4 py-1.5 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                    style={{ gridTemplateColumns: '1.5fr 1.1fr 1.1fr 1.2fr 100px 1fr' }}
                                >
                                    <p className="text-xs font-bold text-text-primary truncate pr-2">{row.shipper}</p>
                                    <p className="text-xs text-text-secondary truncate pr-2">{row.bl || '—'}</p>
                                    <p className="text-xs text-text-secondary truncate pr-2">{row.vessel}</p>
                                    <p className="text-xs text-text-muted truncate pr-2">{row.departureDate || '—'}</p>
                                    <div className="flex justify-center"><StatusBadge status={row.status} /></div>
                                    <p className="text-xs text-text-secondary truncate text-center">{row.portOfDestination}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
