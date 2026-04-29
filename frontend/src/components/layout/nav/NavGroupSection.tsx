import type { NavigationGroup } from '../../../lib/appRoutes';
import { matchesPath } from '../utils/mainLayout.utils';
import { NavItem } from './NavItem';

type Props = {
    group: NavigationGroup;
    isOpen: boolean;
    isSidebarDark: boolean;
    pathname: string;
    onToggle: (label: string) => void;
    onNavigate: (path: string, newTab?: boolean) => void;
    compactChildren?: boolean;
};

export const NavGroupSection = ({
    group,
    isOpen,
    isSidebarDark,
    pathname,
    onToggle,
    onNavigate,
    compactChildren = false,
}: Props) => {
    const hasActiveChild = group.items.some((item) => matchesPath(pathname, item.path));

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={() => onToggle(group.label)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    hasActiveChild
                        ? isSidebarDark
                            ? 'bg-white/6 text-white'
                            : 'bg-black/6 text-black'
                        : isSidebarDark
                            ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                            : 'text-gray-600 hover:bg-black/5 hover:text-black'
                }`}
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={group.icon} />
                </svg>
                <span className="flex-1 truncate">{group.label}</span>
                <svg
                    className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen ? (
                <div className={compactChildren ? 'ml-8 space-y-0.5' : 'ml-3 space-y-0.5 border-l border-border pl-3'}>
                    {group.items.map((item) => {
                        const isActive = matchesPath(pathname, item.path);

                        return (
                            <NavItem
                                key={item.label}
                                item={item}
                                isActive={isActive}
                                isSidebarDark={isSidebarDark}
                                onNavigate={onNavigate}
                                showIcon={!compactChildren}
                            />
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};
