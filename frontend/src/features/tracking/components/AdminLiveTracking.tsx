import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { Spinner } from '../../../components/Spinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { useTransactionList } from '../hooks/useTransactionList';
import { mapExportTransaction, mapImportTransaction } from '../utils/mappers';

const STATS = [
    { key: 'imports',    label: 'Active Imports',  color: '#0a84ff', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
    { key: 'exports',    label: 'Active Exports',  color: '#30d158', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 1 1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
    { key: 'pending',    label: 'Pending',         color: '#ff9f0a', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'completed',  label: 'Completed',       color: '#bf5af2', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export const AdminLiveTracking = () => {
    const navigate = useNavigate();

    const {
        data: importData,
        isLoading: importsLoading,
    } = useTransactionList('import');

    const {
        data: exportData,
        isLoading: exportsLoading,
    } = useTransactionList('export');

    const imports = useMemo(
        () => (importData?.data ?? []).map(t => mapImportTransaction(t as Parameters<typeof mapImportTransaction>[0])),
        [importData]
    );

    const exports = useMemo(
        () => (exportData?.data ?? []).map(t => mapExportTransaction(t as Parameters<typeof mapExportTransaction>[0])),
        [exportData]
    );

    const stats = {
        imports:   imports.length,
        exports:   exports.length,
        pending:   [...imports, ...exports].filter(t => t.status === 'Pending' || t.status === 'Processing').length,
        completed: [...imports, ...exports].filter(t => t.status === 'Cleared' || t.status === 'Shipped').length,
    };

    return (
        <div
            className="min-h-screen p-6 space-y-6"
            style={{ backgroundColor: '#09090b', color: '#ffffff' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
                        Live Transaction Tracking
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Real-time overview of all active import and export transactions
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATS.map(({ key, label, color, icon }) => (
                    <div
                        key={key}
                        className="rounded-xl p-4 flex items-center justify-between"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div>
                            <p className="text-3xl font-bold tabular-nums" style={{ color: '#ffffff' }}>
                                {stats[key as keyof typeof stats]}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                        </div>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
                            <svg className="w-4.5 h-4.5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Imports */}
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0a84ff' }} />
                        <h2 className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            Imports <span className="ml-1 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>({imports.length})</span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        {importsLoading ? (
                            <div className="p-10 flex justify-center"><Spinner color="#0a84ff" /></div>
                        ) : imports.length === 0 ? (
                            <EmptyState label="imports" />
                        ) : (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {['Ref No', 'Client', 'Status', 'Date'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {imports.map((row) => (
                                        <tr
                                            key={row.id}
                                            onClick={() => navigate(`/tracking/${row.ref}`)}
                                            className="cursor-pointer transition-colors hover:bg-white/5"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        >
                                            <td className="px-4 py-2.5 font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.ref || '—'}</td>
                                            <td className="px-4 py-2.5 truncate max-w-[120px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.importer || '—'}</td>
                                            <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                                            <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.date || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Exports */}
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#30d158' }} />
                        <h2 className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            Exports <span className="ml-1 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>({exports.length})</span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        {exportsLoading ? (
                            <div className="p-10 flex justify-center"><Spinner color="#30d158" /></div>
                        ) : exports.length === 0 ? (
                            <EmptyState label="exports" />
                        ) : (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {['BL No', 'Shipper', 'Status', 'Departure'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {exports.map((row) => (
                                        <tr
                                            key={row.id}
                                            onClick={() => navigate(`/tracking/${row.ref}`)}
                                            className="cursor-pointer transition-colors hover:bg-white/5"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        >
                                            <td className="px-4 py-2.5 font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.bl || '—'}</td>
                                            <td className="px-4 py-2.5 truncate max-w-[120px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.shipper || '—'}</td>
                                            <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                                            <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.departureDate || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
