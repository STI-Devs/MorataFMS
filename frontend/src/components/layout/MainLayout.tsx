import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../features/auth';

type Module = 'brokerage' | 'legal';

// ── Top-level components (must NOT be defined inside MainLayout) ──────────────
// Defining components inside a render body causes React to see a new type on
// every parent re-render, unmounting + remounting those elements every tick.

type NavItemProps = {
    item: { label: string; path: string; icon: string; newTab?: boolean };
    isActive: boolean;
    isSidebarDark: boolean;
    onNavigate: (path: string, newTab?: boolean) => void;
};

const NavItem = ({ item, isActive, isSidebarDark, onNavigate }: NavItemProps) => (
    <button
        onClick={() => onNavigate(item.path, item.newTab)}
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
            dangerouslySetInnerHTML={{ __html: item.icon.startsWith('<') ? item.icon : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />` }}
        />
        {item.label}
    </button>
);

type ModuleSwitcherProps = {
    activeModule: Module;
    hasBrokerage: boolean;
    hasLegal: boolean;
    isSidebarDark: boolean;
    onSwitch: (mod: Module) => void;
};

const ModuleSwitcher = ({ activeModule, hasBrokerage, hasLegal, isSidebarDark, onSwitch }: ModuleSwitcherProps) => (
    <div className={`flex gap-1 mb-5 p-1 rounded-lg ${isSidebarDark ? 'bg-white/6' : 'bg-black/6'}`}>
        {hasBrokerage && (
            <button
                onClick={() => onSwitch('brokerage')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${activeModule === 'brokerage'
                    ? isSidebarDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                    : isSidebarDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 2v6h6" />
                </svg>
                Brokerage
            </button>
        )}
        {hasLegal && (
            <button
                onClick={() => onSwitch('legal')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${activeModule === 'legal'
                    ? isSidebarDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                    : isSidebarDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l9-3 9 3M12 3v18M5 21h14M7 10l-2 4h4L7 10zM17 10l-2 4h4l-2-4z" />
                </svg>
                Legal
            </button>
        )}
    </div>
);

const getInitialModule = (departments: string[]): Module => {
    const saved = localStorage.getItem('activeModule') as Module | null;
    if (saved === 'legal' && departments.includes('legal')) return 'legal';
    if (saved === 'brokerage' && departments.includes('brokerage')) return 'brokerage';
    if (departments.includes('brokerage')) return 'brokerage';
    if (departments.includes('legal')) return 'legal';
    return 'brokerage';
};

export const MainLayout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [dateTime, setDateTime] = useState({
        time: '09:41 AM',
        date: 'Nov 23, 2025'
    });

    const departments = user?.departments ?? ['brokerage'];
    const isMultiDept = user?.multi_department ?? (user?.role === 'admin');

    const [activeModule, setActiveModule] = useState<Module>(() =>
        getInitialModule(departments)
    );
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    const switchModule = (mod: Module) => {
        setActiveModule(mod);
        localStorage.setItem('activeModule', mod);
        // Navigate to the module's home on switch
        navigate(mod === 'legal' ? '/law-firm' : (isAdmin ? '/transactions' : '/tracking'));
    };

    // Close account popover on outside click
    useEffect(() => {
        if (!isAccountOpen) return;
        const handler = (e: MouseEvent) => {
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
                setIsAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isAccountOpen]);

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

    // ── Brokerage nav items ───────────────────────────────────────────────────
    const adminBrokerageItems = [
        { label: 'Transaction Oversight', path: '/transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { label: 'Tracking', path: '/live-tracking', newTab: true, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'User Management', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Client Management', path: '/clients', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { label: 'Reports & Analytics', path: '/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { label: 'Archives', path: '/archives', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
        { label: 'Audit Logs', path: '/audit-logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    const encoderBrokerageItems = [
        { label: 'Tracking', path: '/tracking', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Import List', path: '/imports', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'Export List', path: '/exports', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { label: 'Documents', path: '/documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'My Archive', path: '/my-archive', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
        { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    // ── Legal / Law Firm nav items ────────────────────────────────────────────
    const legalItems = [
        { label: 'Law Firm', path: '/law-firm', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
        { label: 'Forms', path: '/forms', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Documents', path: '/legal-documents', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    const isAdmin = user?.role === 'admin';

    // Determine which brokerage nav to show
    const brokerageItems = isAdmin ? adminBrokerageItems : encoderBrokerageItems;
    const hasLegal = departments.includes('legal') || isAdmin;
    const hasBrokerage = departments.includes('brokerage') || isAdmin;

    // Active module's nav items
    const navItems = activeModule === 'legal' ? legalItems : brokerageItems;

    // ── Route guards ──────────────────────────────────────────────────────────
    const brokeragePaths = ['/transactions', '/users', '/clients', '/reports', '/audit-logs', '/archives', '/live-tracking'];
    const legalPaths = ['/law-firm', '/forms'];

    if (!isAdmin && brokeragePaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
        return <Navigate to="/tracking" replace />;
    }
    if (!hasLegal && legalPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
        return <Navigate to="/tracking" replace />;
    }

    const settingsItems = [
        { label: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { label: 'Help', path: '/help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    const isSidebarDark = theme === 'dark' || theme === 'mix';
    const isContentDark = theme === 'dark';
    const isDetailsPage = location.pathname.startsWith('/tracking');

    const themeIcon =
        theme === 'light'
            ? 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            : theme === 'dark'
                ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                : 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z';

    const themeLabel = theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'Mix Mode';

    const handleNavigation = (path: string, newTab?: boolean) => {
        if (path === '#') return;
        if (newTab) { window.open(path, '_blank'); return; }
        navigate(path);
    };

    return (
        <div className={`h-screen flex overflow-hidden ${isContentDark ? 'bg-[#111111]' : 'bg-white'}`}>

            {/* Sidebar */}
            <aside
                className={`w-64 h-full flex flex-col shrink-0 py-5 px-3 ${isDetailsPage ? 'fixed z-10' : ''} ${isSidebarDark ? 'bg-[#0d0d0d]' : 'bg-gray-100'
                    }`}
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-2.5 px-2 mb-5 cursor-pointer"
                    onClick={() => navigate(isAdmin ? '/transactions' : '/tracking')}
                >
                    <img src="/logo.jpg" alt="F.M Morata Logo" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    <div>
                        <p className={`font-bold text-sm leading-tight ${isSidebarDark ? 'text-white' : 'text-black'}`}>F.M Morata</p>
                        <p className={`text-[10px] font-medium leading-tight ${isSidebarDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {activeModule === 'legal' ? 'Law Firm' : 'Customs Brokerage'}
                        </p>
                    </div>
                </div>

                {/* Module Switcher — only shows for multi-department users */}
                {(isMultiDept || isAdmin) && (
                    <ModuleSwitcher
                        activeModule={activeModule}
                        hasBrokerage={hasBrokerage}
                        hasLegal={hasLegal}
                        isSidebarDark={isSidebarDark}
                        onSwitch={switchModule}
                    />
                )}

                {/* Scrollable nav area — prevents settings from overlapping user info */}
                <div className="flex-1 min-h-0 overflow-y-auto">

                    {/* Main Menu */}
                    <div className="mb-4">
                        <p className={`text-[10px] uppercase tracking-widest px-3 mb-2 font-bold ${isSidebarDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Main Menu
                        </p>
                        <nav className="space-y-0.5">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                return (
                                    <NavItem
                                        key={item.label}
                                        item={item}
                                        isActive={isActive}
                                        isSidebarDark={isSidebarDark}
                                        onNavigate={handleNavigation}
                                    />
                                );
                            })}
                        </nav>
                    </div>

                </div>{/* end scrollable nav area */}

                {/* Account card — click to open popover */}
                <div ref={accountRef} className="relative">

                    {/* Popover — floats above the card */}
                    {isAccountOpen && (
                        <div className={`absolute bottom-full left-0 right-0 mb-2 mx-2 rounded-xl border shadow-xl overflow-hidden z-50 animate-dropdown-up-in ${isSidebarDark
                            ? 'bg-[#1c1c1e] border-white/10'
                            : 'bg-white border-black/8'
                            }`}>
                            {/* User header inside popover */}
                            <div className={`px-4 py-3 border-b ${isSidebarDark ? 'border-white/8' : 'border-black/6'
                                }`}>
                                <p className={`text-sm font-semibold truncate ${isSidebarDark ? 'text-white' : 'text-gray-900'}`}>
                                    {user?.name || 'User'}
                                </p>
                                <p className={`text-xs capitalize truncate ${isSidebarDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {user?.role || 'Role'} &middot; {user?.email || ''}
                                </p>
                            </div>

                            {/* Nav items */}
                            <div className="py-1">
                                {settingsItems.map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => { handleNavigation(item.path); setIsAccountOpen(false); }}
                                        className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${location.pathname === item.path
                                            ? isSidebarDark ? 'text-white bg-white/8' : 'text-black bg-black/6'
                                            : isSidebarDark ? 'text-gray-300 hover:bg-white/6 hover:text-white' : 'text-gray-700 hover:bg-black/4 hover:text-black'
                                            }`}
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                        </svg>
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className={`mx-3 h-px ${isSidebarDark ? 'bg-white/8' : 'bg-black/6'}`} />

                            {/* Theme + Sign Out */}
                            <div className="py-1">
                                <button
                                    onClick={() => { toggleTheme(); setIsAccountOpen(false); }}
                                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isSidebarDark ? 'text-gray-300 hover:bg-white/6 hover:text-white' : 'text-gray-700 hover:bg-black/4 hover:text-black'
                                        }`}
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={themeIcon} />
                                    </svg>
                                    {themeLabel}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isSidebarDark ? 'text-red-400 hover:bg-white/6' : 'text-red-500 hover:bg-red-50'
                                        }`}
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}

                    {/* The clickable card */}
                    <button
                        onClick={() => setIsAccountOpen(!isAccountOpen)}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-t transition-colors group ${isSidebarDark
                            ? 'border-white/10 hover:bg-white/5'
                            : 'border-black/8 hover:bg-black/4'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isSidebarDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'
                            }`}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1 text-left">
                            <span className={`text-sm font-semibold truncate ${isSidebarDark ? 'text-white' : 'text-black'}`}>
                                {user?.name || 'User'}
                            </span>
                            <span className={`text-xs capitalize truncate ${isSidebarDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {user?.role || 'Role'} User
                            </span>
                        </div>
                        {/* Chevron indicator */}
                        <svg
                            className={`w-4 h-4 shrink-0 transition-all duration-200 ${isAccountOpen
                                ? isSidebarDark ? 'text-white rotate-180' : 'text-black rotate-180'
                                : isSidebarDark ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-300 group-hover:text-gray-500'
                                }`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 overflow-y-auto p-6 relative flex flex-col ${isDetailsPage ? 'ml-64' : ''
                } ${isContentDark
                    ? 'bg-[#111111]'
                    : 'bg-white'
                }`}>
                <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0">
                    <Outlet context={{ user, dateTime }} />
                </div>
            </main>
        </div>
    );
};
