import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth';

export const MainLayout = () => {
    const { user, logout } = useAuth();
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
        { label: 'Tracking', path: '#', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { label: 'Import List', path: '/dashboard', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'Export List', path: '/export', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
        { label: 'Documents', path: '/documents', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ];

    const settingsItems = [
        { label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { label: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    const isDetailsPage = location.pathname.startsWith('/tracking');

    return (
        <div className="bg-[#e8e8e8] min-h-screen flex text-gray-900 overflow-hidden">

            {/* Sidebar */}
            <aside className={`w-56 bg-[#1a2332] min-h-screen flex flex-col py-6 px-4 shrink-0 transition-all ${isDetailsPage ? 'fixed h-full z-10' : ''}`}>
                {/* Logo */}
                <div className="flex items-center gap-2 px-2 mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="w-8 h-8">
                        <svg viewBox="0 0 64 64" className="w-full h-full">
                            <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#c41e3a" strokeWidth="2" />
                            <path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="#c41e3a" />
                            <circle cx="32" cy="32" r="8" fill="white" />
                            <path d="M28 28 L36 36 M36 28 L28 36" stroke="#1e3a5f" strokeWidth="2" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-sm">F.M. Morata</span>
                </div>

                {/* Main Menu */}
                <div className="mb-6">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider px-2 mb-3 font-semibold">Main Menu</p>
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.path !== '#' && navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${location.pathname === item.path ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Settings */}
                <div className="mb-6">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider px-2 mb-3 font-semibold">Settings</p>
                    <nav className="space-y-1">
                        {settingsItems.map((item) => (
                            <a
                                key={item.label}
                                href="#"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 text-sm hover:bg-white/5 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Sign Out at bottom */}
                <div className="mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 text-sm hover:bg-white/5 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>


            {/* Main Content Area */}
            <main className={`flex-1 bg-white p-8 overflow-y-auto transition-all ${isDetailsPage ? 'ml-56' : ''}`}>
                {/* Page Content */}
                <Outlet context={{ user, dateTime }} />
            </main>
        </div>
    );
};
