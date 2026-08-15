import { ChevronRight } from 'lucide-react';

import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import type { NavigationGroup } from '../../../lib/appRoutes';
import { matchesPath } from '../utils/mainLayout.utils';
import { SidebarIcon } from './SidebarIcon';

type Props = {
    group: NavigationGroup;
    isOpen: boolean;
    pathname: string;
    onToggle: (label: string) => void;
    onNavigate: (path: string, newTab?: boolean) => void;
    compactChildren?: boolean;
};

export const NavGroupSection = ({
    group,
    isOpen,
    pathname,
    onToggle,
    onNavigate,
}: Props) => {
    const { state, isMobile } = useSidebar();
    const hasActiveChild = group.items.some((item) => matchesPath(pathname, item.path));
    const collapsed = state === 'collapsed' && !isMobile;

    if (collapsed) {
        // Icon rail mode: the group becomes a single icon that opens a flyout.
        return (
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton tooltip={group.label} isActive={hasActiveChild}>
                            <SidebarIcon d={group.icon} />
                            <span>{group.label}</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" sideOffset={4} className="w-56">
                        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {group.items.map((item) => (
                            <DropdownMenuItem key={item.label} asChild>
                                <button
                                    type="button"
                                    className="w-full"
                                    onClick={() => onNavigate(item.path, item.newTab)}
                                >
                                    {item.label}
                                </button>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        );
    }

    // Expanded: accordion with sub-menu children (conditionally rendered for
    // deterministic open/close in tests — no Radix Presence exit animation).
    return (
        <Collapsible open={isOpen} onOpenChange={() => onToggle(group.label)} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={hasActiveChild}>
                        <SidebarIcon d={group.icon} />
                        <span>{group.label}</span>
                        <ChevronRight className="ms-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                {isOpen ? (
                    <SidebarMenuSub>
                        {group.items.map((item) => (
                            <SidebarMenuSubItem key={item.label}>
                                <SidebarMenuSubButton asChild isActive={matchesPath(pathname, item.path)}>
                                    <button
                                        type="button"
                                        className="w-full text-start"
                                        onClick={() => onNavigate(item.path, item.newTab)}
                                    >
                                        {item.label}
                                    </button>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                ) : null}
            </SidebarMenuItem>
        </Collapsible>
    );
};
