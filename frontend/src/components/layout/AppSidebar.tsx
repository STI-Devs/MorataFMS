import { logoImage } from '../../assets/branding';
import { isEncoder as isUserEncoder, getRoleLabel } from '../../features/auth/utils/access';
import {
    adminBrokerageNavigationGroups,
    appRoutes,
    encoderBrokerageNavigationGroups,
} from '../../lib/appRoutes';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarRail,
    useSidebar,
} from '../ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useMainLayoutNavigation } from './hooks/useMainLayoutNavigation';
import { AccountMenu } from './nav/AccountMenu';
import { ModuleSwitcher } from './nav/ModuleSwitcher';
import { NavGroupSection } from './nav/NavGroupSection';
import { NavItem } from './nav/NavItem';
import { matchesPath } from './utils/mainLayout.utils';

type AppSidebarProps = {
    nav: ReturnType<typeof useMainLayoutNavigation>;
    themeIcon: string;
    themeLabel: string;
    onToggleTheme: () => void;
};

export const AppSidebar = ({ nav, themeIcon, themeLabel, onToggleTheme }: AppSidebarProps) => {
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    const {
        user,
        isAdmin,
        isMultiDept,
        activeModule,
        switchModule,
        hasBrokerage,
        hasLegal,
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
        handleNavigation,
        handleLogout,
    } = nav;

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => navigate(activeModuleHomePath)}
                            aria-label="F.M Morata"
                            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
                        >
                            <img
                                src={logoImage}
                                alt="F.M Morata Logo"
                                className="size-7 min-w-7 min-h-7 shrink-0 rounded-full object-cover aspect-square"
                            />
                            <div className="group-data-[collapsible=icon]:hidden">
                                <p className="text-sm font-bold leading-tight text-sidebar-foreground">F.M Morata</p>
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" hidden={!isCollapsed}>
                        F.M Morata
                    </TooltipContent>
                </Tooltip>

                {(isMultiDept || isAdmin) && (
                    <ModuleSwitcher
                        activeModule={activeModule}
                        hasBrokerage={hasBrokerage}
                        hasLegal={hasLegal}
                        onSwitch={switchModule}
                    />
                )}
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
                    <SidebarMenu>
                        {activeModule === 'legal' ? (
                            <>
                                {navItems.map((item) => {
                                    const isActive = item.exact
                                        ? pathname === item.path
                                        : matchesPath(pathname, item.path);
                                    return (
                                        <NavItem
                                            key={item.label}
                                            item={item}
                                            isActive={isActive}
                                            onNavigate={handleNavigation}
                                        />
                                    );
                                })}
                                {filteredLegalNavigationGroups.map((group) => (
                                    <NavGroupSection
                                        key={group.label}
                                        group={group}
                                        isOpen={openLegalGroups[group.label] ?? false}
                                        pathname={pathname}
                                        onToggle={handleToggleLegalGroup}
                                        onNavigate={handleNavigation}
                                        compactChildren
                                    />
                                ))}
                            </>
                        ) : (
                            <>
                                {navItems.map((item) => {
                                    const isActive = item.exact
                                        ? pathname === item.path
                                        : matchesPath(pathname, item.path);
                                    const navItem = (
                                        <NavItem
                                            key={item.label}
                                            item={item}
                                            isActive={isActive}
                                            onNavigate={handleNavigation}
                                        />
                                    );

                                    if (isAdmin && item.path === appRoutes.auditLogs) {
                                        return (
                                            <div key={item.label} className="contents">
                                                {adminBrokerageNavigationGroups.map((group) => (
                                                    <NavGroupSection
                                                        key={group.label}
                                                        group={group}
                                                        isOpen={openBrokerageGroups[group.label] ?? false}
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
                                            <div key={item.label} className="contents">
                                                {navItem}
                                                {encoderBrokerageNavigationGroups.map((group) => (
                                                    <NavGroupSection
                                                        key={group.label}
                                                        group={group}
                                                        isOpen={openBrokerageGroups[group.label] ?? false}
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
                            </>
                        )}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <AccountMenu
                    isOpen={isAccountOpen}
                    onToggleOpen={() => setIsAccountOpen(!isAccountOpen)}
                    onClose={() => setIsAccountOpen(false)}
                    user={user ?? null}
                    roleLabel={getRoleLabel(user)}
                    settingsItems={settingsItems}
                    activePathname={pathname}
                    themeIcon={themeIcon}
                    themeLabel={themeLabel}
                    onNavigate={handleNavigation}
                    onToggleTheme={onToggleTheme}
                    onLogout={() => void handleLogout()}
                />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
};
