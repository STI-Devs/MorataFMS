import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

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
    const { theme } = useTheme();
    const { user, dateTime } = useOutletContext<LayoutContext>();

    const isDark = theme === 'dark' || theme === 'mix';
    const userName = user?.name || 'User';

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Admin Dashboard
                    </p>
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Welcome back, {userName}
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Here's what's happening with your shipments today.
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className={`text-2xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{dateTime.time}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dateTime.date}</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className={`rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}22` }}>
                                <svg className="w-5 h-5" fill="none" stroke={stat.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                </svg>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.positive ? 'text-green-500 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className={`text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                        <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                        <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Quick Links Grid */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h2 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {quickLinks.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => navigate(link.path)}
                            className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-sm text-center ${isDark ? 'border-gray-800 hover:border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${link.color}18` }}>
                                <svg className="w-5 h-5" fill="none" stroke={link.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                </svg>
                            </div>
                            <span className={`text-xs font-semibold leading-tight ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{link.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* System Status Banner */}
            <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
                style={{ background: 'linear-gradient(135deg, #0a84ff22 0%, #30d15822 100%)', border: '1px solid #0a84ff33' }}>
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <div>
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>All Systems Operational</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No delays reported in customs processing today.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/reports')}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ backgroundColor: '#0a84ff', color: '#fff' }}
                >
                    View Reports
                </button>
            </div>
        </div>
    );
};
