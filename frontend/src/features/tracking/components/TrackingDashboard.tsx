import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { useExports } from '../hooks/useExports';
import { useImports } from '../hooks/useImports';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { PageHeader } from './shared/PageHeader';

type Transaction = ImportTransaction | ExportTransaction;

const statusStyle = (status: string) => {
    switch (status) {
        case 'Cleared':
        case 'Shipped': return { color: '#30d158', bg: 'rgba(48,209,88,0.13)' };
        case 'Pending':
        case 'Processing': return { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' };
        case 'Delayed': return { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' };
        default: return { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' };
    }
};

export const TrackingDashboard = () => {
    const navigate = useNavigate();
    const { user, dateTime } = useOutletContext<LayoutContext>();
    const [filter, setFilter] = useState('');

    const { data: importsData, isLoading: importsLoading } = useImports();
    const { data: exportsData, isLoading: exportsLoading } = useExports();

    const transactions = useMemo<Transaction[]>(() => {
        const imports: ImportTransaction[] = (importsData?.data || []).map(t => ({
            id: t.id,
            ref: t.customs_ref_no,
            bl: t.bl_no,
            status: t.status === 'pending' ? 'Pending' : t.status === 'in_progress' ? 'In Transit' : t.status === 'completed' ? 'Cleared' : 'Delayed',
            color: t.selective_color === 'green' ? 'bg-green-500' : t.selective_color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500',
            importer: t.importer?.name || 'Unknown',
            date: t.arrival_date || '',
        }));

        const exports: ExportTransaction[] = (exportsData?.data || []).map(t => ({
            id: t.id,
            ref: `EXP-${String(t.id).padStart(4, '0')}`,
            bl: t.bl_no,
            status: t.status === 'pending' ? 'Processing' : t.status === 'in_progress' ? 'In Transit' : t.status === 'completed' ? 'Shipped' : 'Delayed',
            color: '',
            shipper: t.shipper?.name || 'Unknown',
            vessel: t.vessel || '',
            departureDate: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            portOfDestination: t.destination_country?.name || '',
        }));

        return [...imports, ...exports];
    }, [importsData, exportsData]);

    const loading = importsLoading || exportsLoading;

    const filteredData = transactions.filter(t =>
        t.ref.toLowerCase().includes(filter.toLowerCase()) ||
        t.bl.toLowerCase().includes(filter.toLowerCase())
    );

    const totalActive = transactions.filter(t => t.status !== 'Cleared' && t.status !== 'Shipped').length;
    const totalImports = transactions.filter(t => 'importer' in t).length;
    const totalExports = transactions.filter(t => 'shipper' in t).length;
    const totalCleared = transactions.filter(t => t.status === 'Cleared' || t.status === 'Shipped').length;

    const isImport = (t: Transaction): t is ImportTransaction => 'importer' in t;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tracking Dashboard"
                breadcrumb="Dashboard / Tracking"
                user={user || null}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Active Shipments', value: totalActive, color: '#0a84ff', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', sub: 'in progress' },
                    { label: 'Total Imports', value: totalImports, color: '#30d158', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', sub: 'all time' },
                    { label: 'Total Exports', value: totalExports, color: '#ff9f0a', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', sub: 'all time' },
                    { label: 'Cleared / Shipped', value: totalCleared, color: '#64d2ff', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', sub: 'completed' },
                ].map(stat => (
                    <div key={stat.label} className="bg-surface-tint rounded-xl p-5 border border-border-tint transition-all hover:-translate-y-0.5 hover:shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}22` }}>
                                <svg className="w-5 h-5" fill="none" stroke={stat.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                </svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                        <p className="text-xs mt-1 font-medium text-text-secondary">{stat.label}</p>
                        <p className="text-[10px] mt-0.5 text-text-muted">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Shipments Table */}
                <div className="lg:col-span-2 bg-surface rounded-xl border border-border overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-border">
                        <h2 className="text-base font-bold text-text-primary">All Shipments</h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search ref or BL..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-input-bg rounded-xl border border-border-strong text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-52 text-text-primary"
                            />
                            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Type</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Reference</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((t, i) => {
                                        const s = statusStyle(t.status);
                                        return (
                                            <tr
                                                key={i}
                                                className="border-b border-border/50 hover:bg-hover transition-colors cursor-pointer"
                                                onClick={() => navigate(`/tracking/${t.ref}`)}
                                            >
                                                <td className="px-5 py-3.5">
                                                    {isImport(t) ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ color: '#30d158', backgroundColor: 'rgba(48,209,88,0.13)' }}>
                                                            <Icon name="download" className="w-3.5 h-3.5" /> Import
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ color: '#0a84ff', backgroundColor: 'rgba(10,132,255,0.13)' }}>
                                                            <Icon name="truck" className="w-3.5 h-3.5" /> Export
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm font-bold text-text-primary">{t.ref}</p>
                                                    <p className="text-xs text-text-muted">{t.bl}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>
                                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button className="text-text-muted hover:text-blue-500 transition-colors">
                                                        <Icon name="chevron-right" className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-text-muted text-sm">
                                                No shipments found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right: Info Panel */}
                <div className="flex flex-col gap-4">
                    {/* Time Card */}
                    <div className="bg-surface-tint rounded-xl border border-border-tint p-5 text-center">
                        <p className="text-4xl font-bold tabular-nums text-text-primary tracking-tight">{dateTime.time}</p>
                        <p className="text-sm text-text-secondary mt-1">{dateTime.date}</p>
                        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-text-muted font-medium">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Manila, Philippines
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="bg-surface-tint rounded-xl border border-border-tint p-5 flex-1">
                        <h3 className="text-sm font-bold text-text-primary mb-4">Status Breakdown</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Cleared / Shipped', count: transactions.filter(t => t.status === 'Cleared' || t.status === 'Shipped').length, color: '#30d158' },
                                { label: 'In Transit', count: transactions.filter(t => t.status === 'In Transit').length, color: '#64d2ff' },
                                { label: 'Pending / Processing', count: transactions.filter(t => t.status === 'Pending' || t.status === 'Processing').length, color: '#ff9f0a' },
                                { label: 'Delayed', count: transactions.filter(t => t.status === 'Delayed').length, color: '#ff453a' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs text-text-secondary">{item.label}</span>
                                    </div>
                                    <span className="text-xs font-bold tabular-nums" style={{ color: item.color }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-surface rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <h3 className="text-sm font-bold text-text-primary">System Status</h3>
                        </div>
                        <p className="text-xs text-text-secondary">All systems operational. No delays reported in customs processing today.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
