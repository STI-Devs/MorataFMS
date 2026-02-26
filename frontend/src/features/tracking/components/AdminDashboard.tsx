import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { StatusBadge } from '../../../components/StatusBadge';
import { Spinner } from '../../../components/Spinner';
import { EmptyState } from '../../../components/EmptyState';
import { useTransactionList } from '../hooks/useTransactionList';
import { mapImportTransaction, mapExportTransaction } from '../utils/mappers';

interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

/* ── Static dashboard data ────────────────────────────────── */
const statCards = [
    { label: 'Total Imports', value: '1,234', change: '+12%', positive: true, color: '#0a84ff', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', sub: 'vs last month' },
    { label: 'Total Exports', value: '856', change: '+5%', positive: true, color: '#30d158', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', sub: 'vs last month' },
    { label: 'Pending Docs', value: '42', change: '-2%', positive: false, color: '#ff9f0a', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', sub: 'requires action' },
    { label: 'Active Users', value: '18', change: '+3', positive: true, color: '#bf5af2', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', sub: 'online now' },
];

const quickLinks = [
    { label: 'User Management', path: '/users', color: '#bf5af2', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Client Management', path: '/clients', color: '#0a84ff', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Transaction Oversight', path: '/transactions', color: '#30d158', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Reports & Analytics', path: '/reports', color: '#ff9f0a', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Audit Logs', path: '/audit-logs', color: '#ff453a', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'New Import', path: '/imports', color: '#64d2ff', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
];



const ColH = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] whitespace-nowrap">{children}</span>
);

/* ── Main component ─────────────────────────────────────────── */
export const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, dateTime } = useOutletContext<LayoutContext>();
    const [tab, setTab] = useState<'overview' | 'live'>('overview');

    const userName = user?.name || 'User';

    /* Live Tracking data */
    const { data: importsData, isLoading: importsLoading } = useTransactionList('import');
    const { data: exportsData, isLoading: exportsLoading } = useTransactionList('export');

    const imports = useMemo(() => importsData?.data.map(mapImportTransaction) ?? [], [importsData]);
    const exports = useMemo(() => exportsData?.data.map(mapExportTransaction) ?? [], [exportsData]);



    return (
        <div className={`flex flex-col flex-1 min-h-0 ${tab === 'live' ? 'overflow-hidden gap-5' : 'space-y-5 p-4'}`}>

            {/* ── Header ── */}
            <div className={`shrink-0 flex justify-between items-end ${tab === 'live' ? 'px-4 pt-4' : ''}`}>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-text-muted">Admin Dashboard</p>
                    <h1 className="text-3xl font-bold text-text-primary">Welcome back, {userName}</h1>
                    <p className="text-sm mt-1 text-text-secondary">Here's what's happening with your shipments today.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className={`shrink-0 flex gap-1 ${tab === 'live' ? 'px-4' : ''}`}>
                {(['overview', 'live'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t
                            ? 'bg-surface border border-border text-text-primary'
                            : 'text-text-muted hover:text-text-secondary'}`}
                    >
                        {t === 'overview' ? 'Overview' : '🟢 Live Tracking'}
                    </button>
                ))}
            </div>

            {/* ══════════════ OVERVIEW TAB ══════════════ */}
            {tab === 'overview' && (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {statCards.map((stat) => (
                            <div key={stat.label} className="bg-surface rounded-lg p-5 border border-border transition-all hover:-translate-y-0.5 hover:shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                                        <svg className="w-4.5 h-4.5" fill="none" stroke={stat.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                        </svg>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.positive ? 'text-green-500 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                                <p className="text-xs mt-1 font-medium text-text-secondary">{stat.label}</p>
                                <p className="text-[10px] mt-0.5 text-text-muted">{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Links */}
                    <div className="bg-surface rounded-lg border border-border p-5">
                        <h2 className="text-sm font-bold mb-4 text-text-primary">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {quickLinks.map((link) => (
                                <button key={link.label} onClick={() => navigate(link.path)}
                                    className="flex flex-col items-center gap-2.5 p-4 rounded-lg border border-border transition-all hover:-translate-y-0.5 hover:bg-hover hover:border-border-strong text-center">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${link.color}18` }}>
                                        <svg className="w-4.5 h-4.5" fill="none" stroke={link.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold leading-tight text-text-secondary">{link.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-surface rounded-lg border border-border p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <div>
                                <p className="text-sm font-semibold text-text-primary">All Systems Operational</p>
                                <p className="text-xs text-text-secondary">No delays reported in customs processing today.</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/reports')}
                            className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                            View Reports
                        </button>
                    </div>
                </>
            )}

            {/* ══════════════ LIVE TRACKING TAB ══════════════ */}
            {tab === 'live' && (
                <div className="flex gap-3 flex-1 min-h-0 px-4 pb-4">

                    {/* Import Panel */}
                    <div className="flex-1 min-w-0 flex flex-col bg-surface border border-border/60 rounded-lg overflow-hidden">
                        <div className="shrink-0 px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#30d158]" style={{ boxShadow: '0 0 6px #30d15880' }} />
                                <h2 className="text-sm font-bold text-text-primary">Import Transactions</h2>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">{imports.length} active</span>
                        </div>

                        <div className="shrink-0 grid px-4 py-1.5 border-b border-border/30 bg-surface-secondary/50"
                            style={{ gridTemplateColumns: '22px repeat(5, 1fr)' }}>
                            <ColH>SC</ColH><ColH>Customs Ref No.</ColH><ColH>Bill of Lading</ColH>
                            <ColH>Status</ColH><ColH>Importer</ColH><ColH>Arrival</ColH>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                            {importsLoading ? <Spinner color="#30d158" /> :
                                imports.length === 0 ? <EmptyState label="imports" /> :
                                    imports.map((row, i) => (
                                        <div key={row.id} onClick={() => navigate(`/tracking/${row.ref}`)}
                                            className={`grid px-4 py-1.5 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                            style={{ gridTemplateColumns: '22px repeat(5, 1fr)' }}>
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${row.color}`} />
                                            <p className="text-xs font-bold text-text-primary truncate pr-2">{row.ref}</p>
                                            <p className="text-xs text-text-secondary truncate pr-2">{row.bl || '—'}</p>
                                            <StatusBadge status={row.status} />
                                            <p className="text-xs text-text-secondary truncate pr-2">{row.importer}</p>
                                            <p className="text-xs text-text-muted">{row.date}</p>
                                        </div>
                                    ))}
                        </div>
                    </div>

                    {/* Export Panel */}
                    <div className="flex-1 min-w-0 flex flex-col bg-surface border border-border/60 rounded-lg overflow-hidden">
                        <div className="shrink-0 px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#0a84ff]" style={{ boxShadow: '0 0 6px #0a84ff80' }} />
                                <h2 className="text-sm font-bold text-text-primary">Export Transactions</h2>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full border border-border">{exports.length} active</span>
                        </div>

                        <div className="shrink-0 grid px-4 py-1.5 border-b border-border/30 bg-surface-secondary/50"
                            style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                            <ColH>Shipper</ColH><ColH>Bill of Lading</ColH><ColH>Vessel</ColH>
                            <ColH>Departure</ColH><ColH>Status</ColH><ColH>Destination</ColH>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                            {exportsLoading ? <Spinner color="#0a84ff" /> :
                                exports.length === 0 ? <EmptyState label="exports" /> :
                                    exports.map((row, i) => (
                                        <div key={row.id} onClick={() => navigate(`/tracking/${row.ref}`)}
                                            className={`grid px-4 py-1.5 items-center cursor-pointer hover:bg-hover/60 transition-colors border-b border-border/30 ${i % 2 !== 0 ? 'bg-surface-secondary/30' : ''}`}
                                            style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                                            <p className="text-xs font-bold text-text-primary truncate pr-2">{row.shipper}</p>
                                            <p className="text-xs text-text-secondary truncate pr-2">{row.bl || '—'}</p>
                                            <p className="text-xs text-text-secondary truncate pr-2">{row.vessel}</p>
                                            <p className="text-xs text-text-muted">{row.departureDate}</p>
                                            <StatusBadge status={row.status} />
                                            <p className="text-xs text-text-secondary truncate">{row.portOfDestination}</p>
                                        </div>
                                    ))}
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
};
