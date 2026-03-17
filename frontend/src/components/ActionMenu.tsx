import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from './Icon';

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
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const visibleItems = items.filter(item => !item.hidden);

    // Separate danger items to show them at the bottom with a divider
    const normalItems = visibleItems.filter(i => i.variant !== 'danger');
    const dangerItems = visibleItems.filter(i => i.variant === 'danger');

    return (
        <div ref={menuRef} className="relative">
            {/* Trigger button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(prev => !prev);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 
                    text-gray-500 dark:text-gray-400 transition-colors"
                title="Actions"
            >
                <Icon name="more-vertical" className="w-4 h-4" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-1 z-50 w-44 
                        bg-white dark:bg-gray-800 
                        border border-gray-200 dark:border-gray-700 
                        rounded-lg shadow-lg overflow-hidden
                        animate-dropdown-in"
                >
                    {/* Normal items */}
                    {normalItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                item.onClick();
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left
                                text-gray-700 dark:text-gray-300 
                                hover:bg-gray-50 dark:hover:bg-white/5 
                                transition-colors"
                        >
                            <Icon name={item.icon} className="w-4 h-4 opacity-60" />
                            {item.label}
                        </button>
                    ))}

                    {/* Separator + Danger items */}
                    {dangerItems.length > 0 && (
                        <>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-0.5" />
                            {dangerItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        item.onClick();
                                    }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left
                                        text-red-600 dark:text-red-400 
                                        hover:bg-red-50 dark:hover:bg-red-900/20 
                                        transition-colors"
                                >
                                    <Icon name={item.icon} className="w-4 h-4 opacity-75" />
                                    {item.label}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
