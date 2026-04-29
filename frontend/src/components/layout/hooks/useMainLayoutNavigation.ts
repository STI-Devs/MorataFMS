import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../features/auth';
import {
    hasBrokerageAccess,
    hasLegalAccess,
    isAccounting as isUserAccounting,
    isAdmin as isUserAdmin,
    isProcessor as isUserProcessor,
} from '../../../features/auth/utils/access';
import {
    accountantGuardPaths,
    adminBrokerageGuardPaths,
    appRoutes,
    encoderBrokerageGuardPaths,
    legalGuardPaths,
    legalNavigationGroups,
    navigationItems,
    processorGuardPaths,
} from '../../../lib/appRoutes';
import { getInitialModule, matchesAnyPath, matchesPath, type Module } from '../utils/mainLayout.utils';

export function useMainLayoutNavigation() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const departments = user?.departments ?? ['brokerage'];
    const isAdmin = isUserAdmin(user);
    const isProcessor = isUserProcessor(user);
    const isAccountant = isUserAccounting(user);
    const hasLegal = hasLegalAccess(user);
    const hasBrokerage = hasBrokerageAccess(user);
    const isMultiDept = user?.multi_department ?? isAdmin;

    const [activeModule, setActiveModule] = useState<Module>(() => getInitialModule(departments));
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [openLegalGroups, setOpenLegalGroups] = useState<Record<string, boolean>>({
        Notarial: true,
        'Legal Files': true,
    });
    const [openBrokerageGroups, setOpenBrokerageGroups] = useState<Record<string, boolean>>({
        Records: true,
    });

    const brokerageItems = isAdmin
        ? navigationItems.adminBrokerage
        : isProcessor
            ? navigationItems.processor
            : isAccountant
                ? navigationItems.accountant
                : navigationItems.encoderBrokerage;

    const filteredLegalNavigationGroups = legalNavigationGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                item.requiredPermission ? Boolean(user?.permissions?.[item.requiredPermission]) : true,
            ),
        }))
        .filter((group) => group.items.length > 0);

    const navItems = activeModule === 'legal' ? navigationItems.legal : brokerageItems;
    const settingsItems = navigationItems.settings;
    const isLegalRoute = matchesAnyPath(location.pathname, legalGuardPaths);
    const isSettingsRoute = settingsItems.some((item) => matchesPath(location.pathname, item.path));

    const activeModuleHomePath = activeModule === 'legal' && hasLegal
        ? appRoutes.paralegalDashboard
        : isAdmin
            ? appRoutes.dashboard
            : isProcessor
                ? appRoutes.processorDashboard
                : isAccountant
                    ? appRoutes.accountantDashboard
                    : appRoutes.encoderDashboard;

    const switchModule = (moduleName: Module) => {
        setActiveModule(moduleName);
        localStorage.setItem('activeModule', moduleName);
        navigate(
            moduleName === 'legal'
                ? appRoutes.paralegalDashboard
                : isAdmin
                    ? appRoutes.dashboard
                    : isProcessor
                        ? appRoutes.processorDashboard
                        : isAccountant
                            ? appRoutes.accountantDashboard
                            : appRoutes.encoderDashboard,
        );
    };

    useEffect(() => {
        if (isLegalRoute && hasLegal) {
            setActiveModule((currentModule) => {
                if (currentModule === 'legal') {
                    return currentModule;
                }

                localStorage.setItem('activeModule', 'legal');
                return 'legal';
            });
            return;
        }

        if (!isSettingsRoute && hasBrokerage) {
            setActiveModule((currentModule) => {
                if (currentModule === 'brokerage') {
                    return currentModule;
                }

                localStorage.setItem('activeModule', 'brokerage');
                return 'brokerage';
            });
        }
    }, [hasBrokerage, hasLegal, isLegalRoute, isSettingsRoute]);

    useEffect(() => {
        if (activeModule !== 'legal') {
            return;
        }

        const nextOpenState = { ...openLegalGroups };
        let hasChange = false;

        for (const group of filteredLegalNavigationGroups) {
            const hasActiveItem = group.items.some((item) => matchesPath(location.pathname, item.path));
            if (hasActiveItem && ! nextOpenState[group.label]) {
                nextOpenState[group.label] = true;
                hasChange = true;
            }
        }

        if (hasChange) {
            setOpenLegalGroups(nextOpenState);
        }
    }, [activeModule, filteredLegalNavigationGroups, location.pathname, openLegalGroups]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            navigate(appRoutes.login);
        }
    };

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

    const handleToggleLegalGroup = (label: string) => {
        setOpenLegalGroups((current) => ({
            ...current,
            [label]: ! current[label],
        }));
    };

    const handleToggleBrokerageGroup = (label: string) => {
        setOpenBrokerageGroups((current) => ({
            ...current,
            [label]: ! current[label],
        }));
    };

    const guardRedirectTarget: string | null = (() => {
        if (!isAdmin && matchesAnyPath(location.pathname, adminBrokerageGuardPaths)) return activeModuleHomePath;
        if (!hasLegal && isLegalRoute) return activeModuleHomePath;
        if (!isProcessor && matchesAnyPath(location.pathname, processorGuardPaths)) return activeModuleHomePath;
        if (!isAccountant && matchesAnyPath(location.pathname, accountantGuardPaths)) return activeModuleHomePath;
        if (!isAdmin && user?.role !== 'encoder' && matchesAnyPath(location.pathname, encoderBrokerageGuardPaths)) return activeModuleHomePath;
        return null;
    })();

    return {
        // identity
        user,
        isAdmin,
        isProcessor,
        isAccountant,
        hasLegal,
        hasBrokerage,
        isMultiDept,
        // module
        activeModule,
        switchModule,
        activeModuleHomePath,
        // nav data
        navItems,
        settingsItems,
        filteredLegalNavigationGroups,
        // open-group state
        openLegalGroups,
        openBrokerageGroups,
        handleToggleLegalGroup,
        handleToggleBrokerageGroup,
        // account dropdown
        isAccountOpen,
        setIsAccountOpen,
        // routing
        pathname: location.pathname,
        navigate,
        guardRedirectTarget,
        // handlers
        handleNavigation,
        handleLogout,
    };
}
