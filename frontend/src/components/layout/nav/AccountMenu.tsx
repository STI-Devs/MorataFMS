import { useEffect, useRef } from 'react';

import { useSidebar } from '@/components/ui/sidebar';
import type { NavItemData } from './NavItem';

type SettingsItem = NavItemData;

type Props = {
    isOpen: boolean;
    onToggleOpen: () => void;
    onClose: () => void;
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
    const { state, isMobile } = useSidebar();
    const collapsed = state === 'collapsed' && !isMobile;

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
                <div className={`absolute bottom-full ${collapsed ? 'left-0 w-64' : 'left-0 right-0 mx-2'} mb-2 rounded-xl border border-sidebar-accent shadow-xl overflow-hidden z-50 animate-dropdown-up-in bg-sidebar text-sidebar-foreground`}>
                    <div className="px-4 py-3 border-b border-sidebar-accent/60">
                        <p className="text-sm font-semibold truncate text-sidebar-foreground">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs capitalize truncate text-sidebar-foreground/60">
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
                                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                    activePathname === item.path
                                        ? 'text-sidebar-accent-foreground bg-sidebar-accent/60'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                                }`}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="mx-3 h-px bg-sidebar-accent/60" />

                    <div className="py-1">
                        <button
                            onClick={() => {
                                onToggleTheme();
                                onClose();
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={themeIcon} />
                            </svg>
                            {themeLabel}
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-danger hover:bg-sidebar-accent/50"
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
                className={`w-full flex items-center gap-3 py-3 border-t border-sidebar-accent transition-colors group hover:bg-sidebar-accent/50 ${collapsed ? 'justify-center px-2' : 'px-4'}`}
            >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-sidebar-accent/60 text-sidebar-accent-foreground">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className={`flex-col overflow-hidden flex-1 text-left ${collapsed ? 'hidden' : 'flex'}`}>
                    <span className="text-sm font-semibold truncate text-sidebar-foreground">
                        {user?.name || 'User'}
                    </span>
                    <span className="text-xs capitalize truncate text-sidebar-foreground/60">
                        {roleLabel}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 shrink-0 transition-all duration-200 ${collapsed ? 'hidden' : ''} ${isOpen
                        ? 'text-sidebar-foreground rotate-180'
                        : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                        }`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
            </button>
        </div>
    );
};
