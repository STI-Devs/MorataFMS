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
        await logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Tracking', path: '#', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Import List', path: '/dashboard', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'Export List', path: '/export', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { label: 'Documents', path: '/documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];

    const settingsItems = [
        { label: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { label: 'Help', path: '/help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    const isDetailsPage = location.pathname.startsWith('/tracking');

    return (
        <div className={`min-h-screen flex text-gray-900 overflow-hidden ${theme === 'dark' || theme === 'mix' ? 'bg-black' : 'bg-white'
            }`}>

            {/* Sidebar */}
            <aside className={`w-56 min-h-screen flex flex-col py-6 px-4 shrink-0 ${isDetailsPage ? 'fixed h-full z-10' : ''} ${theme === 'dark' || theme === 'mix' ? 'bg-black' : 'bg-white'
                }`}>
                {/* Logo */}
                <div className="flex items-center gap-2 px-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8">
                        <svg viewBox="0 0 64 64" className="w-full h-full">
                            <circle cx="32" cy="32" r="30" fill="#000000" stroke="#c41e3a" strokeWidth="2" />
                            <path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="#c41e3a" />
                            <circle cx="32" cy="32" r="8" fill="white" />
                            <path d="M28 28 L36 36 M36 28 L28 36" stroke="#1e3a5f" strokeWidth="2" />
                        </svg>
                    </div>
                    <span className={`font-bold text-sm ${theme === 'dark' || theme === 'mix' ? 'text-white' : 'text-black'
                        }`}>F.M Morata</span>
                </div>

                {/* Main Menu */}
                <div className="mb-6">
                    <p className={`text-[10px] uppercase tracking-wider px-2 mb-3 font-semibold ${theme === 'dark' || theme === 'mix' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Main Menu</p>
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.path !== '#' && navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${location.pathname === item.path
                                    ? theme === 'dark' || theme === 'mix'
                                        ? 'bg-white/10 text-white'
                                        : 'bg-black/10 text-black'
                                    : theme === 'dark' || theme === 'mix'
                                        ? 'text-gray-300 hover:bg-white/5'
                                        : 'text-gray-600 hover:bg-black/5'
                                    }`}
                            >
                                <svg className={`w-5 h-5 ${theme === 'dark' || theme === 'mix' ? 'text-white' : 'text-black'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Settings */}
                <div className="mt-8">
                    <p className={`text-[10px] uppercase tracking-wider px-2 mb-3 font-semibold ${theme === 'dark' || theme === 'mix' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Settings</p>
                    <nav className="space-y-1">
                        {settingsItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${location.pathname === item.path
                                    ? theme === 'dark' || theme === 'mix'
                                        ? 'bg-white/10 text-white'
                                        : 'bg-black/10 text-black'
                                    : theme === 'dark' || theme === 'mix'
                                        ? 'text-gray-300 hover:bg-white/5'
                                        : 'text-gray-600 hover:bg-black/5'
                                    }`}
                            >
                                <svg className={`w-5 h-5 ${theme === 'dark' || theme === 'mix' ? 'text-white' : 'text-black'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${theme === 'dark' || theme === 'mix'
                                    ? 'text-gray-300 hover:bg-white/5'
                                    : 'text-gray-600 hover:bg-black/5'
                                }`}
                        >
                            <svg className={`w-5 h-5 ${theme === 'dark' || theme === 'mix' ? 'text-white' : 'text-black'
                                }`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                                    theme === 'light' ? "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                        : theme === 'dark' ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                            : "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                } />
                            </svg>
                            {theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'Mix Mode'}
                        </button>

                        {/* Sign Out Button */}
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mt-4 ${theme === 'dark' || theme === 'mix'
                                ? 'text-red-400 hover:bg-white/5'
                                : 'text-red-600 hover:bg-red-50'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content Area - Rounded Card Look */}
            <main className={`flex-1 p-8 overflow-y-auto m-4 rounded-[2.5rem] shadow-2xl relative border ${isDetailsPage ? 'ml-64' : ''} ${theme === 'dark' ? 'bg-black border-transparent' : 'bg-white border-white'
                }`}>
                {/* Page Content */}
                <div className="max-w-7xl mx-auto min-h-[calc(100vh-8rem)]">
                    <Outlet context={{ user, dateTime }} />
                </div>
            </main>
        </div>
    );
};
