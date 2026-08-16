import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useTheme } from '../../context/ThemeContext';
import { getCookie } from '../../lib/cookies';
import { PageFallback } from '../PageFallback';
import { Separator } from '../ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useMainLayoutNavigation } from './hooks/useMainLayoutNavigation';

export const MainLayout = () => {
    const { theme, toggleTheme } = useTheme();
    const nav = useMainLayoutNavigation();

    if (nav.guardRedirectTarget) {
        return <Navigate to={nav.guardRedirectTarget} replace />;
    }

    const themeIcon =
        theme === 'light'
            ? 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            : theme === 'dark'
                ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                : 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z';

    const themeLabel = theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'Mix Mode';

    const moduleSubtitle =
        nav.activeModule === 'legal'
            ? 'Law Firm'
            : nav.isProcessor
                ? 'Processor'
                : nav.isAccountant
                    ? 'Accountant'
                    : 'Customs Brokerage';

    return (
        <SidebarProvider defaultOpen={getCookie('sidebar_state') !== 'false'}>
            <AppSidebar
                nav={nav}
                themeIcon={themeIcon}
                themeLabel={themeLabel}
                onToggleTheme={toggleTheme}
            />

            <SidebarInset className="h-svh">
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
                    <SidebarTrigger variant="outline" className="max-md:scale-125" />
                    <Separator orientation="vertical" className="h-6" />
                    <p className="truncate text-sm font-semibold text-foreground">{moduleSubtitle}</p>
                </header>

                <main
                    id="main-content"
                    className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-5"
                >
                    <div className="flex min-h-0 w-full flex-1 flex-col">
                        <Suspense fallback={<PageFallback />}>
                            <Outlet context={{ user: nav.user }} />
                        </Suspense>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};
