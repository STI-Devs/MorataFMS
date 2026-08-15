import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SidebarIcon } from './SidebarIcon';

export type NavItemData = {
    label: string;
    path: string;
    icon: string;
    newTab?: boolean;
    exact?: boolean;
    badge?: number | string;
};

type Props = {
    item: NavItemData;
    isActive: boolean;
    onNavigate: (path: string, newTab?: boolean) => void;
};

export const NavItem = ({ item, isActive, onNavigate }: Props) => (
    <SidebarMenuItem>
        <SidebarMenuButton
            isActive={isActive}
            onClick={() => onNavigate(item.path, item.newTab)}
            tooltip={item.label}
        >
            <SidebarIcon d={item.icon} />
            <span>{item.label}</span>
            {item.badge ? (
                <span className="ml-auto rounded-full bg-sidebar-foreground/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-sidebar-foreground">
                    {item.badge}
                </span>
            ) : null}
        </SidebarMenuButton>
    </SidebarMenuItem>
);
