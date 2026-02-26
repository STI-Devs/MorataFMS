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
                className="p-1.5 rounded-lg hover:bg-hover text-text-secondary transition-colors"
                title="Actions"
            >
                <Icon name="more-vertical" className="w-4 h-4" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-1 z-50 w-44
                        bg-surface-elevated
                        border border-border-strong
                        rounded-lg shadow-lg overflow-hidden
                        animate-in fade-in duration-150"
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
                                text-text-primary
                                hover:bg-hover
                                transition-colors"
                        >
                            <Icon name={item.icon} className="w-4 h-4 opacity-60" />
                            {item.label}
                        </button>
                    ))}

                    {/* Separator + Danger items */}
                    {dangerItems.length > 0 && (
                        <>
                            <div className="border-t border-border my-0.5" />
                            {dangerItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        item.onClick();
                                    }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left
                                        text-red-500
                                        hover:bg-hover
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
