import { useEffect, useRef } from 'react';

import type { NavItemData } from './NavItem';

type SettingsItem = NavItemData;

type Props = {
    isOpen: boolean;
    onToggleOpen: () => void;
    onClose: () => void;
    isSidebarDark: boolean;
    user: {
        name?: string;
        email?: string;
    } | null | undefined;
    roleLabel: string;
    settingsItems: SettingsItem[];
    activePathname: string;
    themeIcon: string;
    themeLabel: string;
    onNavigate: (path: string, newTab?: boolean) => void;
    onToggleTheme: () => void;
    onLogout: () => void;
};

export const AccountMenu = ({
    isOpen,
    onToggleOpen,
    onClose,
    isSidebarDark,
    user,
    roleLabel,
    settingsItems,
    activePathname,
    themeIcon,
    themeLabel,
    onNavigate,
    onToggleTheme,
    onLogout,
}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handler = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    return (
        <div ref={containerRef} className="relative">
            {isOpen && (
                <div className={`absolute bottom-full left-0 right-0 mb-2 mx-2 rounded-xl border shadow-xl overflow-hidden z-50 animate-dropdown-up-in ${isSidebarDark ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/8'}`}>
                    <div className={`px-4 py-3 border-b ${isSidebarDark ? 'border-white/8' : 'border-black/6'}`}>
                        <p className={`text-sm font-semibold truncate ${isSidebarDark ? 'text-white' : 'text-gray-900'}`}>
                            {user?.name || 'User'}
                        </p>
                        <p className={`text-xs capitalize truncate ${isSidebarDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {roleLabel} &middot; {user?.email || ''}
                        </p>
                    </div>

                    <div className="py-1">
                        {settingsItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => {
                                    onNavigate(item.path);
                                    onClose();
                                }}
                                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${activePathname === item.path
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
                                onToggleTheme();
                                onClose();
                            }}
                            className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isSidebarDark ? 'text-gray-300 hover:bg-white/6 hover:text-white' : 'text-gray-700 hover:bg-black/4 hover:text-black'}`}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={themeIcon} />
                            </svg>
                            {themeLabel}
                        </button>
                        <button
                            onClick={onLogout}
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
                onClick={onToggleOpen}
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
                        {roleLabel}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 shrink-0 transition-all duration-200 ${isOpen
                        ? isSidebarDark ? 'text-white rotate-180' : 'text-black rotate-180'
                        : isSidebarDark ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-300 group-hover:text-gray-500'
                        }`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
            </button>
        </div>
    );
};
