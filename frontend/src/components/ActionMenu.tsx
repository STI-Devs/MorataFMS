import { Icon, type IconName } from './Icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

export interface ActionMenuItem {
    label: string;
    icon: IconName;
    onClick: () => void;
    variant?: 'default' | 'danger';
    /** If true, this item won't be rendered at all */
    hidden?: boolean;
}

interface ActionMenuProps {
    items: ActionMenuItem[];
}

export function ActionMenu({ items }: ActionMenuProps) {
    const visibleItems = items.filter(item => !item.hidden);

    // Separate danger items to show them at the bottom with a divider
    const normalItems = visibleItems.filter(i => i.variant !== 'danger');
    const dangerItems = visibleItems.filter(i => i.variant === 'danger');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-haspopup="menu"
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10
                        text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
                    title="Actions"
                >
                    <Icon name="more-vertical" className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="z-50 w-44 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-lg animate-dropdown-in"
            >
                {normalItems.map((item) => (
                    <DropdownMenuItem
                        key={item.label}
                        onClick={item.onClick}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left
                            text-gray-700 dark:text-gray-300
                            hover:bg-gray-50 dark:hover:bg-white/5
                            transition-colors cursor-pointer"
                    >
                        <Icon name={item.icon} className="w-4 h-4 opacity-60" />
                        {item.label}
                    </DropdownMenuItem>
                ))}

                {dangerItems.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="border-t border-gray-200 dark:border-gray-700 my-0.5" />
                        {dangerItems.map((item) => (
                            <DropdownMenuItem
                                key={item.label}
                                variant="destructive"
                                onClick={item.onClick}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left
                                    text-red-600 dark:text-red-400
                                    hover:bg-red-50 dark:hover:bg-red-900/20
                                    transition-colors cursor-pointer"
                            >
                                <Icon name={item.icon} className="w-4 h-4 opacity-75" />
                                {item.label}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
