import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';

const statCards = [
    {
        label: 'Total Imports',
        value: '1,234',
        change: '+12%',
        positive: true,
        color: '#0a84ff',
        icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
        sub: 'vs last month',
    },
    {
        label: 'Total Exports',
        value: '856',
        change: '+5%',
        positive: true,
        color: '#30d158',
        icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
        sub: 'vs last month',
    },
    {
        label: 'Pending Docs',
        value: '42',
        change: '-2%',
        positive: false,
        color: '#ff9f0a',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        sub: 'requires action',
    },
    {
        label: 'Active Users',
        value: '18',
        change: '+3',
        positive: true,
        color: '#bf5af2',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        sub: 'online now',
    },
];

const quickLinks = [
    { label: 'User Management', path: '/admin/users', color: '#bf5af2', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Client Management', path: '/admin/clients', color: '#0a84ff', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Transaction Oversight', path: '/admin/transactions', color: '#30d158', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Reports & Analytics', path: '/admin/reports', color: '#ff9f0a', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Audit Logs', path: '/admin/audit-logs', color: '#ff453a', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'New Import', path: '/imports', color: '#64d2ff', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
];

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, dateTime } = useOutletContext<LayoutContext>();

    const userName = user?.name || 'User';

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-text-muted">
                        Admin Dashboard
                    </p>
                    <h1 className="text-3xl font-bold text-text-primary">
                        Welcome back, {userName}
                    </h1>
                    <p className="text-sm mt-1 text-text-secondary">
                        Here's what's happening with your shipments today.
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-surface rounded-lg p-5 border border-border transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    >
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

            {/* Quick Links Grid */}
            <div className="bg-surface rounded-lg border border-border p-5">
                <h2 className="text-sm font-bold mb-4 text-text-primary">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {quickLinks.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => navigate(link.path)}
                            className="flex flex-col items-center gap-2.5 p-4 rounded-lg border border-border transition-all hover:-translate-y-0.5 hover:bg-hover hover:border-border-strong text-center"
                        >
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

            {/* System Status Banner */}
            <div className="bg-surface rounded-lg border border-border p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <div>
                        <p className="text-sm font-semibold text-text-primary">All Systems Operational</p>
                        <p className="text-xs text-text-secondary">No delays reported in customs processing today.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/reports')}
                    className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor: '#0a84ff', color: '#fff' }}
                >
                    View Reports
                </button>
            </div>
        </div>
    );
};
