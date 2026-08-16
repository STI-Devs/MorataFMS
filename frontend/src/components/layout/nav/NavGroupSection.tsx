import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
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
    const hasActiveChild = group.items.some((item) => matchesPath(pathname, item.path));

    return (
        <Collapsible open={isOpen} onOpenChange={() => onToggle(group.label)} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        isActive={hasActiveChild}
                        tooltip={group.label}
                        className="cursor-pointer"
                    >
                        <SidebarIcon d={group.icon} />
                        <span>{group.label}</span>
                        <ChevronRight className="ms-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                {isOpen ? (
                    <div className="group-data-[collapsible=icon]:hidden">
                        <SidebarMenuSub>
                            {group.items.map((item) => (
                                <SidebarMenuSubItem key={item.label}>
                                    <SidebarMenuSubButton asChild isActive={matchesPath(pathname, item.path)}>
                                        <button
                                            type="button"
                                            className="w-full text-start cursor-pointer"
                                            onClick={() => onNavigate(item.path, item.newTab)}
                                        >
                                            {item.label}
                                        </button>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </div>
                ) : null}
            </SidebarMenuItem>
        </Collapsible>
    );
};
