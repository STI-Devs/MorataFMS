import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user, dateTime } = useOutletContext<LayoutContext>();

    const userName = user?.name === 'Admin User' ? 'Test User' : (user?.name || 'Test User');

    const stats = [
        { label: 'Total Imports', value: '1,234', change: '+12%', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
        { label: 'Total Exports', value: '856', change: '+5%', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
        { label: 'Pending Docs', value: '42', change: '-2%', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Active Users', value: '18', change: '+3', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ];

    return (
        <div className="space-y-8 p-4">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Welcome back, {userName}
                    </h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Here's what's happening with your shipments today.
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{dateTime.time}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{dateTime.date}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className={`p-6 rounded-[2rem] border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                                </svg>
                            </div>
                            <span className={`text-sm font-bold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {stat.value}
                        </h3>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className={`p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
                <div className="flex gap-4 flex-wrap">
                    <button
                        onClick={() => navigate('/imports')}
                        className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        New Import
                    </button>
                    <button
                        onClick={() => navigate('/export')}
                        className={`px-6 py-3 rounded-xl font-bold border transition-colors flex items-center gap-2 ${theme === 'dark'
                            ? 'border-gray-600 text-white hover:bg-gray-700'
                            : 'border-gray-200 text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        New Export
                    </button>
                </div>
            </div>
        </div>
    );
};
