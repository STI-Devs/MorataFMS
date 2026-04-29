import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { logoImage } from '../../assets/branding';
import { useTheme } from '../../context/ThemeContext';
import { isEncoder as isUserEncoder, getRoleLabel } from '../../features/auth/utils/access';
import {
    adminBrokerageNavigationGroups,
    appRoutes,
    encoderBrokerageNavigationGroups,
} from '../../lib/appRoutes';
import { PageFallback } from '../PageFallback';
import { matchesPath } from './utils/mainLayout.utils';
import { AccountMenu } from './nav/AccountMenu';
import { ModuleSwitcher } from './nav/ModuleSwitcher';
import { NavGroupSection } from './nav/NavGroupSection';
import { NavItem } from './nav/NavItem';
import { useMainLayoutNavigation } from './hooks/useMainLayoutNavigation';

export const MainLayout = () => {
    const { theme, toggleTheme } = useTheme();
    const {
        user,
        isAdmin,
        isProcessor,
        isAccountant,
        hasLegal,
        hasBrokerage,
        isMultiDept,
        activeModule,
        switchModule,
        activeModuleHomePath,
        navItems,
        settingsItems,
        filteredLegalNavigationGroups,
        openLegalGroups,
        openBrokerageGroups,
        handleToggleLegalGroup,
        handleToggleBrokerageGroup,
        isAccountOpen,
        setIsAccountOpen,
        pathname,
        navigate,
        guardRedirectTarget,
        handleNavigation,
        handleLogout,
    } = useMainLayoutNavigation();

    if (guardRedirectTarget) {
        return <Navigate to={guardRedirectTarget} replace />;
    }

    const isSidebarDark = theme === 'dark' || theme === 'mix';
    const isContentDark = theme === 'dark';
    const isDetailsPage = pathname.startsWith(appRoutes.tracking);

    const themeIcon =
        theme === 'light'
            ? 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            : theme === 'dark'
                ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                : 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z';

    const themeLabel = theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'Mix Mode';

    const moduleSubtitle = activeModule === 'legal'
        ? 'Law Firm'
        : isProcessor
            ? 'Processor'
            : isAccountant
                ? 'Accountant'
                : 'Customs Brokerage';

    return (
        <div className={`h-screen flex overflow-hidden ${isContentDark ? 'bg-[#111111]' : 'bg-white'}`}>
            <aside
                className={`w-64 h-full flex flex-col shrink-0 py-5 px-3 ${isDetailsPage ? 'fixed z-10' : ''} ${isSidebarDark ? 'bg-[#0d0d0d]' : 'bg-gray-100'}`}
            >
                <div
                    className="flex items-center gap-2.5 px-2 mb-5 cursor-pointer"
                    onClick={() => navigate(activeModuleHomePath)}
                >
                    <img src={logoImage} alt="F.M Morata Logo" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    <div>
                        <p className={`font-bold text-sm leading-tight ${isSidebarDark ? 'text-white' : 'text-black'}`}>F.M Morata</p>
                        <p className={`text-[10px] font-medium leading-tight ${isSidebarDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {moduleSubtitle}
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

                <div className="scrollbar-hidden flex-1 min-h-0 overflow-y-auto">
                    <div className="mb-4">
                        <p className={`text-[10px] uppercase tracking-widest px-3 mb-2 font-bold ${isSidebarDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Main Menu
                        </p>
                        {activeModule === 'legal' ? (
                            <div className="space-y-3">
                                {navItems.map((item) => {
                                    const isActive = item.exact
                                        ? pathname === item.path
                                        : matchesPath(pathname, item.path);
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

                                {filteredLegalNavigationGroups.map((group) => (
                                    <NavGroupSection
                                        key={group.label}
                                        group={group}
                                        isOpen={openLegalGroups[group.label] ?? false}
                                        isSidebarDark={isSidebarDark}
                                        pathname={pathname}
                                        onToggle={handleToggleLegalGroup}
                                        onNavigate={handleNavigation}
                                        compactChildren
                                    />
                                ))}
                            </div>
                        ) : (
                            <nav className="space-y-0.5">
                                {navItems.map((item) => {
                                    const isActive = item.exact
                                        ? pathname === item.path
                                        : matchesPath(pathname, item.path);
                                    const navItem = (
                                        <NavItem
                                            key={item.label}
                                            item={item}
                                            isActive={isActive}
                                            isSidebarDark={isSidebarDark}
                                            onNavigate={handleNavigation}
                                        />
                                    );

                                    if (isAdmin && item.path === appRoutes.auditLogs) {
                                        return (
                                            <div key={item.label} className="space-y-0.5">
                                                {adminBrokerageNavigationGroups.map((group) => (
                                                    <NavGroupSection
                                                        key={group.label}
                                                        group={group}
                                                        isOpen={openBrokerageGroups[group.label] ?? false}
                                                        isSidebarDark={isSidebarDark}
                                                        pathname={pathname}
                                                        onToggle={handleToggleBrokerageGroup}
                                                        onNavigate={handleNavigation}
                                                        compactChildren
                                                    />
                                                ))}
                                                {navItem}
                                            </div>
                                        );
                                    }

                                    if (isUserEncoder(user) && item.path === appRoutes.documents) {
                                        return (
                                            <div key={item.label} className="space-y-0.5">
                                                {navItem}
                                                {encoderBrokerageNavigationGroups.map((group) => (
                                                    <NavGroupSection
                                                        key={group.label}
                                                        group={group}
                                                        isOpen={openBrokerageGroups[group.label] ?? false}
                                                        isSidebarDark={isSidebarDark}
                                                        pathname={pathname}
                                                        onToggle={handleToggleBrokerageGroup}
                                                        onNavigate={handleNavigation}
                                                        compactChildren
                                                    />
                                                ))}
                                            </div>
                                        );
                                    }

                                    return navItem;
                                })}
                            </nav>
                        )}
                    </div>
                </div>

                <AccountMenu
                    isOpen={isAccountOpen}
                    onToggleOpen={() => setIsAccountOpen(!isAccountOpen)}
                    onClose={() => setIsAccountOpen(false)}
                    isSidebarDark={isSidebarDark}
                    user={user ?? null}
                    roleLabel={getRoleLabel(user)}
                    settingsItems={settingsItems}
                    activePathname={pathname}
                    themeIcon={themeIcon}
                    themeLabel={themeLabel}
                    onNavigate={handleNavigation}
                    onToggleTheme={toggleTheme}
                    onLogout={() => void handleLogout()}
                />
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
