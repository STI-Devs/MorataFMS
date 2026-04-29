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
    isSidebarDark: boolean;
    onNavigate: (path: string, newTab?: boolean) => void;
    showIcon?: boolean;
};

export const NavItem = ({ item, isActive, isSidebarDark, onNavigate, showIcon = true }: Props) => (
    <button
        onClick={() => onNavigate(item.path, item.newTab)}
        className={`w-full text-left flex items-center ${showIcon ? 'gap-3' : 'gap-2'} px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
            ? isSidebarDark ? 'bg-white/10 text-white' : 'bg-black/8 text-black'
            : isSidebarDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-black/5 hover:text-black'
            }`}
    >
        {showIcon ? (
            <svg
                className={`w-4 h-4 shrink-0 ${isActive
                    ? isSidebarDark ? 'text-white' : 'text-black'
                    : isSidebarDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge ? (
            <span
                className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    isActive
                        ? isSidebarDark
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                        : isSidebarDark
                            ? 'bg-white/10 text-gray-300'
                            : 'bg-black/8 text-gray-600'
                }`}
            >
                {item.badge}
            </span>
        ) : null}
    </button>
);
