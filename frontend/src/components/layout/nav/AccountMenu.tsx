import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
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
    user,
    roleLabel,
    settingsItems,
    themeIcon,
    themeLabel,
    onNavigate,
    onToggleTheme,
    onLogout,
}: Props) => {
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                        >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/80 font-bold text-sm text-sidebar-foreground">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold text-sidebar-foreground">
                                    {user?.name || 'User'}
                                </span>
                                <span className="truncate text-xs capitalize text-muted-foreground">
                                    {roleLabel}
                                </span>
                            </div>
                            <svg
                                className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border border-sidebar-accent/60 bg-sidebar text-sidebar-foreground shadow-2xl p-1.5 z-50"
                        side={isCollapsed ? 'right' : 'top'}
                        align={isCollapsed ? 'end' : 'center'}
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2.5 px-3 py-2 text-left text-sm border-b border-sidebar-accent/40 mb-1">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/80 font-bold text-sm text-sidebar-foreground">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-sidebar-foreground">
                                        {user?.name || 'User'}
                                    </span>
                                    <span className="truncate text-xs text-sidebar-foreground/60">
                                        {roleLabel} · {user?.email || ''}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {settingsItems.map((item) => (
                                <DropdownMenuItem
                                    key={item.label}
                                    onClick={() => onNavigate(item.path)}
                                    className="cursor-pointer gap-2.5 px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground rounded-lg"
                                >
                                    <svg className="size-4 shrink-0 text-sidebar-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                    </svg>
                                    <span>{item.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-sidebar-accent/60 my-1" />
                        <DropdownMenuItem
                            onClick={onToggleTheme}
                            className="cursor-pointer gap-2.5 px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground rounded-lg"
                        >
                            <svg className="size-4 shrink-0 text-sidebar-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={themeIcon} />
                            </svg>
                            <span>{themeLabel}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-sidebar-accent/60 my-1" />
                        <DropdownMenuItem
                            onClick={onLogout}
                            className="cursor-pointer gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger/10 hover:text-danger focus:bg-danger/10 focus:text-danger rounded-lg"
                        >
                            <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
};
