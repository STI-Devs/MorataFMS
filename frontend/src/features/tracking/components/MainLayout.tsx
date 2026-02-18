import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useTheme } from '../../../context/ThemeContext';

export const MainLayout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [dateTime, setDateTime] = useState({
        time: '09:41 AM',
        date: 'Nov 23, 2025'
    });

    useEffect(() => {
        const updateTime = () => {
            const timeOptions: Intl.DateTimeFormatOptions = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Manila'
            };
            const dateOptions: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                timeZone: 'Asia/Manila'
            };
            const now = new Date();
            setDateTime({
                time: now.toLocaleTimeString('en-US', timeOptions),
                date: now.toLocaleDateString('en-US', dateOptions)
            });
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            navigate('/login');
        }
    };

    const adminItems = [
        { label: 'Dashboard', path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { label: 'User Management', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Client Management', path: '/clients', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { label: 'Transaction Oversight', path: '/transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { label: 'Reports & Analytics', path: '/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { label: 'Audit Logs', path: '/audit-logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    ];

    const encoderItems = [
        { label: 'Tracking', path: '/tracking', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Import List', path: '/imports', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'Export List', path: '/export', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { label: 'Documents', path: '/documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];

    const isAdmin = user?.role === 'admin';
    const navItems = isAdmin ? adminItems : encoderItems;

    const settingsItems = [
        { label: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { label: 'Help', path: '/help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    // In mix mode: sidebar is dark, content is light
    // In dark mode: both are dark
    // In light mode: both are light
    const isSidebarDark = theme === 'dark' || theme === 'mix';
    const isContentDark = theme === 'dark';
    const isDetailsPage = location.pathname.startsWith('/tracking');

    // Theme icon path
    const themeIcon =
        theme === 'light' ? "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            : theme === 'dark' ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                : "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z";

    const themeLabel = theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'Mix Mode';

    // Sidebar nav item — always uses sidebar-dark styles
    const NavItem = ({ item, isActive }: { item: { label: string; path: string; icon: string }; isActive: boolean }) => (
        <button
            onClick={() => item.path !== '#' && navigate(item.path)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                    ? isSidebarDark ? 'bg-white/10 text-white' : 'bg-black/8 text-black'
                    : isSidebarDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-black/5 hover:text-black'
                }`}
        >
            <svg
                className={`w-4 h-4 shrink-0 ${isActive
                        ? isSidebarDark ? 'text-white' : 'text-black'
                        : isSidebarDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            {item.label}
        </button>
    );

    return (
        <div className={`h-screen flex overflow-hidden ${isContentDark ? 'bg-black' : 'bg-gray-100'}`}>

            {/* Sidebar — always dark in mix/dark, light in light */}
            <aside
                className={`w-64 h-full flex flex-col shrink-0 py-5 px-3 ${isDetailsPage ? 'fixed z-10' : ''} ${isSidebarDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'
                    }`}
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-2.5 px-2 mb-6 cursor-pointer"
                    onClick={() => navigate('/')}
                >
                    <div className="w-7 h-7 shrink-0">
                        <img src="/logo.jpg" alt="F.M Morata Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <span className={`font-bold text-sm ${isSidebarDark ? 'text-white' : 'text-black'}`}>
                        F.M Morata
                    </span>
                </div>

                {/* Main Menu */}
                <div className="mb-4">
                    <p className={`text-[10px] uppercase tracking-widest px-3 mb-2 font-bold ${isSidebarDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        Main Menu
                    </p>
                    <nav className="space-y-0.5">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                            return <NavItem key={item.label} item={item} isActive={isActive} />;
                        })}
                    </nav>
                </div>

                {/* Divider */}
                <div className={`mx-3 my-2 h-px ${isSidebarDark ? 'bg-white/8' : 'bg-black/8'}`} />

                {/* Settings */}
                <div className="mb-2">
                    <p className={`text-[10px] uppercase tracking-widest px-3 mb-2 font-bold ${isSidebarDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        Settings
                    </p>
                    <nav className="space-y-0.5">
                        {settingsItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return <NavItem key={item.label} item={item} isActive={isActive} />;
                        })}
                    </nav>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom actions */}
                <div className="space-y-0.5">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isSidebarDark
                                ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                                : 'text-gray-500 hover:bg-black/5 hover:text-black'
                            }`}
                    >
                        <svg className={`w-4 h-4 shrink-0 ${isSidebarDark ? 'text-gray-400' : 'text-gray-500'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={themeIcon} />
                        </svg>
                        {themeLabel}
                    </button>

                    {/* Sign Out */}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isSidebarDark ? 'text-red-400 hover:bg-white/5' : 'text-red-500 hover:bg-red-50'
                            }`}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area — light in mix/light, dark in dark */}
            <main className={`flex-1 overflow-y-auto p-6 m-3 rounded-2xl relative border ${isDetailsPage ? 'ml-64' : ''
                } ${isContentDark
                    ? 'bg-[#0a0a0a] border-white/5'
                    : 'bg-white border-black/5'
                }`}>
                <div className="max-w-7xl mx-auto min-h-full flex flex-col">
                    <Outlet context={{ user, dateTime }} />
                </div>
            </main>
        </div>
    );
};
