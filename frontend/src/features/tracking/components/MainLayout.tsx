import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../auth';

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
        console.log('Logging out...');
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            navigate('/login');
        }
    };

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Import List', path: '/imports', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'Export List', path: '/exports', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { label: 'Documents', path: '/documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];

    const settingsItems = [
        { label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { label: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    // In mix mode, sidebar needs dark text/icons
    const sidebarDark = theme === 'dark' || theme === 'mix';

    return (
        <div className="h-screen flex overflow-hidden font-sans transition-colors duration-300 ease-in-out bg-surface-secondary">

            {/* Sidebar */}
            <aside className="w-64 h-full flex flex-col pt-8 pb-6 px-4 shrink-0 overflow-y-auto transition-all duration-300 ease-in-out bg-sidebar-bg border-r border-sidebar-border">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 mb-6 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="w-8 h-8 flex-shrink-0">
                        <svg viewBox="0 0 64 64" className="w-full h-full">
                            <circle cx="32" cy="32" r="30" fill="currentColor" className={sidebarDark ? 'text-white' : 'text-gray-900'} />
                            <path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="#c41e3a" />
                            <circle cx="32" cy="32" r="8" fill="white" />
                        </svg>
                    </div>
                    <span className={`font-bold text-lg tracking-tight ${sidebarDark ? 'text-white' : 'text-gray-900'}`}>F.M. Morata</span>
                </div>

                {/* Main Menu */}
                <div className="mb-8">
                    <p className={`text-[11px] uppercase tracking-wider px-3 mb-4 font-bold ${sidebarDark ? 'text-gray-500' : 'text-gray-400'}`}>Main Menu</p>
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.path !== '#' && navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === item.path
                                    ? sidebarDark ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-900 text-white shadow-md'
                                    : sidebarDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <svg className={`w-5 h-5 ${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Settings */}
                <div className="mb-8">
                    <p className={`text-[11px] uppercase tracking-wider px-3 mb-4 font-bold ${sidebarDark ? 'text-gray-500' : 'text-gray-400'}`}>Settings</p>
                    <nav className="space-y-1">
                        {settingsItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.label === 'Profile' && navigate('/profile')}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    sidebarDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Theme Toggle */}
                <div className="mb-6 mt-auto">
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            sidebarDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        {theme === 'light' ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Light Mode
                            </>
                        ) : theme === 'dark' ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                Dark Mode
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                Mix Mode
                            </>
                        )}
                    </button>
                </div>

                {/* Sign Out */}
                <div>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            sidebarDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative m-2 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out bg-surface-elevated p-6">
                {/* Page Content */}
                <Outlet context={{ user, dateTime }} />
            </main>
        </div>
    );
};
