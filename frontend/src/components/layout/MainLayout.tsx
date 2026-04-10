import { Suspense, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logoImage } from '../../assets/branding';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../features/auth';
import { getRoleLabel, hasBrokerageAccess, hasLegalAccess } from '../../features/auth/utils/access';
import { adminBrokerageGuardPaths, appRoutes, legalGuardPaths, navigationItems } from '../../lib/appRoutes';
import { PageFallback } from '../PageFallback';

type Module = 'brokerage' | 'legal';

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
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
        </svg>
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

    const departments = user?.departments ?? ['brokerage'];
    const isAdmin = user?.role === 'admin';
    const hasLegal = hasLegalAccess(user);
    const hasBrokerage = hasBrokerageAccess(user);
    const isMultiDept = user?.multi_department ?? isAdmin;

    const [activeModule, setActiveModule] = useState<Module>(() => getInitialModule(departments));
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    const brokerageItems = isAdmin ? navigationItems.adminBrokerage : navigationItems.encoderBrokerage;
    const navItems = activeModule === 'legal' ? navigationItems.legal : brokerageItems;
    const settingsItems = navigationItems.settings;

    const switchModule = (moduleName: Module) => {
        setActiveModule(moduleName);
        localStorage.setItem('activeModule', moduleName);
        navigate(moduleName === 'legal' ? appRoutes.lawFirm : (isAdmin ? appRoutes.dashboard : appRoutes.tracking));
    };

    useEffect(() => {
        if (!isAccountOpen) {
            return;
        }

        const handler = (event: MouseEvent) => {
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setIsAccountOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isAccountOpen]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            navigate(appRoutes.login);
        }
    };

    if (!isAdmin && adminBrokerageGuardPaths.some((path) => location.pathname === path || location.pathname.startsWith(path + '/'))) {
        return <Navigate to={appRoutes.tracking} replace />;
    }
    if (!hasLegal && legalGuardPaths.some((path) => location.pathname === path || location.pathname.startsWith(path + '/'))) {
        return <Navigate to={appRoutes.tracking} replace />;
    }

    const isSidebarDark = theme === 'dark' || theme === 'mix';
    const isContentDark = theme === 'dark';
    const isDetailsPage = location.pathname.startsWith(appRoutes.tracking);

    const themeIcon =
        theme === 'light'
            ? 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            : theme === 'dark'
                ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                : 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z';

    const themeLabel = theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'Mix Mode';

    const handleNavigation = (path: string, newTab?: boolean) => {
        if (path === '#') {
            return;
        }
        if (newTab) {
            const externalTab = window.open(path, '_blank');
            if (externalTab) {
                externalTab.opener = null;
            }
            return;
        }
        navigate(path);
    };

    return (
        <div className={`h-screen flex overflow-hidden ${isContentDark ? 'bg-[#111111]' : 'bg-white'}`}>
            <aside
                className={`w-64 h-full flex flex-col shrink-0 py-5 px-3 ${isDetailsPage ? 'fixed z-10' : ''} ${isSidebarDark ? 'bg-[#0d0d0d]' : 'bg-gray-100'}`}
            >
                <div
                    className="flex items-center gap-2.5 px-2 mb-5 cursor-pointer"
                    onClick={() => navigate(isAdmin ? appRoutes.dashboard : appRoutes.tracking)}
                >
                    <img src={logoImage} alt="F.M Morata Logo" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    <div>
                        <p className={`font-bold text-sm leading-tight ${isSidebarDark ? 'text-white' : 'text-black'}`}>F.M Morata</p>
                        <p className={`text-[10px] font-medium leading-tight ${isSidebarDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {activeModule === 'legal' ? 'Law Firm' : 'Customs Brokerage'}
                        </p>
                    </div>
                </div>

                {(isMultiDept || isAdmin) && (
                    <ModuleSwitcher
                        activeModule={activeModule}
                        hasBrokerage={hasBrokerage}
                        hasLegal={hasLegal}
                        isSidebarDark={isSidebarDark}
                        onSwitch={switchModule}
                    />
                )}

                <div className="flex-1 min-h-0 overflow-y-auto">
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
                </div>

                <div ref={accountRef} className="relative">
                    {isAccountOpen && (
                        <div className={`absolute bottom-full left-0 right-0 mb-2 mx-2 rounded-xl border shadow-xl overflow-hidden z-50 animate-dropdown-up-in ${isSidebarDark ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/8'}`}>
                            <div className={`px-4 py-3 border-b ${isSidebarDark ? 'border-white/8' : 'border-black/6'}`}>
                                <p className={`text-sm font-semibold truncate ${isSidebarDark ? 'text-white' : 'text-gray-900'}`}>
                                    {user?.name || 'User'}
                                </p>
                                <p className={`text-xs capitalize truncate ${isSidebarDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {getRoleLabel(user)} &middot; {user?.email || ''}
                                </p>
                            </div>

                            <div className="py-1">
                                {settingsItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            handleNavigation(item.path);
                                            setIsAccountOpen(false);
                                        }}
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

                            <div className={`mx-3 h-px ${isSidebarDark ? 'bg-white/8' : 'bg-black/6'}`} />

                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        toggleTheme();
                                        setIsAccountOpen(false);
                                    }}
                                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isSidebarDark ? 'text-gray-300 hover:bg-white/6 hover:text-white' : 'text-gray-700 hover:bg-black/4 hover:text-black'}`}
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={themeIcon} />
                                    </svg>
                                    {themeLabel}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isSidebarDark ? 'text-red-400 hover:bg-white/6' : 'text-red-500 hover:bg-red-50'}`}
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsAccountOpen(!isAccountOpen)}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-t transition-colors group ${isSidebarDark ? 'border-white/10 hover:bg-white/5' : 'border-black/8 hover:bg-black/4'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isSidebarDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1 text-left">
                            <span className={`text-sm font-semibold truncate ${isSidebarDark ? 'text-white' : 'text-black'}`}>
                                {user?.name || 'User'}
                            </span>
                            <span className={`text-xs capitalize truncate ${isSidebarDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {getRoleLabel(user)}
                            </span>
                        </div>
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

            <main
                id="main-content"
                className={`relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto p-6 ${isDetailsPage ? 'ml-64' : ''} ${isContentDark ? 'bg-[#111111]' : 'bg-white'}`}
            >
                <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0">
                    <Suspense fallback={<PageFallback />}>
                        <Outlet context={{ user }} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
};
